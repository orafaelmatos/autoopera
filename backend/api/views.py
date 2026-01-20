from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Barbershop, UserProfile, Service, Customer, CustomerBarbershop, LoyaltyReward, Appointment,
    Availability, ScheduleException, Transaction, Promotion, Product, Barber
)
from .serializers import (
    BarbershopSerializer, ServiceSerializer, CustomerSerializer, LoyaltyRewardSerializer,
    AppointmentSerializer, AvailabilitySerializer,
    ScheduleExceptionSerializer, TransactionSerializer, PromotionSerializer,
    ProductSerializer, BarberSerializer
)
from .services import BookingService
from datetime import datetime
from django.utils import timezone
from django.utils.dateparse import parse_datetime

class TenantModelViewSet(viewsets.ModelViewSet):
    """Mixin para filtrar automaticamente por barbearia (tenant)"""
    def get_queryset(self):
        barbershop = getattr(self.request, 'barbershop', None)
        
        # Tenta resolver pelo slug na URL se o middleware falhou
        slug_in_url = self.kwargs.get('barbershop_slug')
        if not barbershop and slug_in_url:
            barbershop = Barbershop.objects.filter(slug=slug_in_url, is_active=True).first()
            if barbershop:
                self.request.barbershop = barbershop

        # Fallback: Usuário autenticado (Barbeiro)
        if not barbershop and self.request.user.is_authenticated:
            if hasattr(self.request.user, 'barber_profile'):
                barbershop = self.request.user.barber_profile.barbershop
                self.request.barbershop = barbershop # Injeta contextualmente

        if not barbershop:
            return self.queryset.none()
        return self.queryset.filter(barbershop=barbershop)

    def perform_create(self, serializer):
        barbershop = getattr(self.request, 'barbershop', None)
        
        slug_in_url = self.kwargs.get('barbershop_slug')
        if not barbershop and slug_in_url:
            barbershop = Barbershop.objects.filter(slug=slug_in_url, is_active=True).first()

        if not barbershop and self.request.user.is_authenticated:
            if hasattr(self.request.user, 'barber_profile'):
                barbershop = self.request.user.barber_profile.barbershop
        
        serializer.save(barbershop=barbershop)

@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def current_barbershop(request, barbershop_slug=None):
    """Retorna ou atualiza os dados da barbearia atual"""
    if request.method == 'PATCH' and not request.user.is_authenticated:
        return Response({"detail": "Não autenticado"}, status=401)
        
    barbershop = getattr(request, 'barbershop', None)
    
    # Se o slug veio na URL mas o middleware não resolveu
    if not barbershop and barbershop_slug:
        barbershop = Barbershop.objects.filter(slug=barbershop_slug, is_active=True).first()
        if barbershop:
            request.barbershop = barbershop

    # Fallback: Se ainda não resolvido, tenta pelo perfil do usuário
    if not barbershop and request.user.is_authenticated:
        if hasattr(request.user, 'barber_profile'):
            barbershop = request.user.barber_profile.barbershop
            request.barbershop = barbershop
            
    if not barbershop:
        return Response({"error": "TENANT_REQUIRED", "message": "Contexto de barbearia não encontrado"}, status=404)
        
    if request.method == 'GET':
        serializer = BarbershopSerializer(barbershop, context={'request': request})
        return Response(serializer.data)
        
    elif request.method == 'PATCH':
        # Apenas barbeiros do próprio shop podem editar
        if not hasattr(request.user, 'barber_profile') or request.user.barber_profile.barbershop != barbershop:
            return Response({"detail": "Sem permissão para editar esta barbearia"}, status=403)

        serializer = BarbershopSerializer(barbershop, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class BarbershopViewSet(viewsets.ModelViewSet):
    queryset = Barbershop.objects.all()
    serializer_class = BarbershopSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

@api_view(['POST'])
@permission_classes([AllowAny])
def whatsapp_login(request, barbershop_slug=None):
    phone = request.data.get('phone')
    password = request.data.get('password')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    confirm_identity = request.data.get('confirm_identity', False)

    # Resolve barbershop from slug if provided in URL or body
    slug = barbershop_slug or request.data.get('barbershop_slug')
    barbershop = Barbershop.objects.filter(slug=slug).first()

    if not phone:
        return Response({"error": "TELEFONE_REQUIRED", "message": "O telefone é obrigatório"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=phone)
        
        # Se for barbeiro e NÃO enviou senha ou quer confirmar identidade sem senha
        if hasattr(user, 'barber_profile'):
            if not password:
                return Response({"error": "PASSWORD_REQUIRED", "message": "Barbeiros precisam de senha."}, status=status.HTTP_200_OK)
            
            user = authenticate(username=phone, password=password)
            if not user:
                return Response({"error": "INVALID_PASSWORD", "message": "Senha incorreta."}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            # É um cliente. Pergunta se é ele se ainda não confirmou via flag confirm_identity.
            if not confirm_identity:
                full_name = f"{user.first_name} {user.last_name}".strip() or user.username
                return Response({
                    "error": "CONFIRM_IDENTITY", 
                    "name": full_name
                }, status=status.HTTP_200_OK)
            
            # Identidade confirmada, segue para login sem conferência de senha
            pass

        # Vincular cliente à barbearia se logou nela
        if barbershop:
            customer = Customer.objects.filter(user=user).first()
            if customer:
                CustomerBarbershop.objects.get_or_create(customer=customer, barbershop=barbershop)

        refresh = RefreshToken.for_user(user)
        role = 'barber' if hasattr(user, 'barber_profile') else 'customer'
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': role,
            'name': user.first_name or user.username,
            'phone': user.username,
            'barbershop': barbershop.slug if barbershop else None
        })

    except User.DoesNotExist:
        # Primeiro acesso
        if not first_name or not last_name:
            return Response({
                "error": "NAME_REQUIRED", 
                "message": "Primeiro acesso! Por favor, informe seu nome e sobrenome."
            }, status=status.HTTP_200_OK)
        
        user = User.objects.create_user(
            username=phone, 
            password=phone, 
            first_name=first_name, 
            last_name=last_name
        )
        
        full_name = f"{first_name} {last_name}"
        customer, created = Customer.objects.get_or_create(
            phone=phone, 
            defaults={'name': full_name, 'user': user}
        )
        if not created:
            customer.user = user
            customer.name = full_name
            customer.save()
        
        if barbershop:
            CustomerBarbershop.objects.get_or_create(customer=customer, barbershop=barbershop)
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': 'customer',
            'name': first_name,
            'phone': phone,
            'barbershop': barbershop.slug if barbershop else None
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def barber_register(request):
    """Cria barbeiro, usuário e barbearia de uma vez"""
    data = request.data
    phone = data.get('phone')
    password = data.get('password')
    name = data.get('name')
    shop_name = data.get('shop_name')
    shop_slug = data.get('shop_slug')
    shop_address = data.get('address', '')
    shop_instagram = data.get('instagram', '')
    shop_description = data.get('description', '')
    banner = request.FILES.get('banner')

    if not all([phone, password, name, shop_name, shop_slug]):
        return Response({"error": "REQUIRED_FIELDS", "message": "Todos os campos são obrigatórios"}, status=400)
    
    # ... logic continues ...
    if User.objects.filter(username=phone).exists():
        return Response({"error": "USER_EXISTS", "message": "Este telefone já está cadastrado"}, status=400)
    
    if Barbershop.objects.filter(slug=shop_slug).exists():
        return Response({"error": "SLUG_EXISTS", "message": "Este endereço de barbearia já está em uso"}, status=400)

    # Criar Usuário
    user = User.objects.create_user(
        username=phone,
        password=password,
        first_name=name.split(' ')[0],
        last_name=' '.join(name.split(' ')[1:]) if ' ' in name else ''
    )

    # Criar Barbearia
    barbershop = Barbershop.objects.create(
        name=shop_name,
        slug=shop_slug,
        owner=user,
        address=shop_address,
        instagram=shop_instagram,
        description=shop_description,
        banner=banner
    )

    # Criar Perfil de Barbeiro
    Barber.objects.create(
        user=user,
        barbershop=barbershop,
        name=name,
        email=f"{phone}@auto.com" # Email placeholder
    )

    # Criar Perfil Universal
    UserProfile.objects.create(user=user, role='BARBER')

    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'role': 'barber',
        'name': name,
        'phone': phone,
        'barbershop': barbershop.slug
    }, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def n8n_today_summary(request):
    """Resumo simplificado para n8n/IA"""
    barbershop = request.barbershop
    if not barbershop:
        return Response({"error": "TENANT_REQUIRED"}, status=400)
    
    from datetime import date
    from django.db.models import Count, Sum
    
    today = date.today()
    appointments = Appointment.objects.filter(barbershop=barbershop, date__date=today)
    
    summary = {
        "barbershop": barbershop.name,
        "date": today.isoformat(),
        "total_appointments": appointments.count(),
        "confirmed": appointments.filter(status='confirmed').count(),
        "completed": appointments.filter(status='completed').count(),
        "cancelled": appointments.filter(status='cancelled').count(),
        "revenue_today": Transaction.objects.filter(
            barbershop=barbershop, 
            date__date=today, 
            type='income', 
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
    }
    
    return Response(summary)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def n8n_next_appointments(request):
    """Próximos agendamentos formatados para IA ler facilmente"""
    barbershop = request.barbershop
    if not barbershop:
        return Response({"error": "TENANT_REQUIRED"}, status=400)
    
    now = timezone.now()
    appointments = Appointment.objects.filter(
        barbershop=barbershop, 
        date__gte=now, 
        status='confirmed'
    ).order_by('date')[:10]
    
    data = []
    for app in appointments:
        data.append({
            "id": str(app.id),
            "client": app.client_name,
            "service": app.service.name,
            "barber": app.barber.name,
            "time": app.date.strftime("%H:%M"),
            "date": app.date.strftime("%d/%m/%Y"),
            "whatsapp": app.customer.phone if app.customer else "N/A"
        })
        
    return Response({"appointments": data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request, **kwargs):
    user = request.user
    role = 'customer'
    profile_id = None
    extra_data = {}
    
    if hasattr(user, 'barber_profile'):
        role = 'barber'
        barber = user.barber_profile
        profile_id = barber.id
        extra_data = {
            'profile_picture': barber.profile_picture.url if barber.profile_picture else None,
            'full_name': barber.name,
            'email': barber.email,
            'description': barber.description,
            'barbershop_slug': barber.barbershop.slug if barber.barbershop else None,
            'barbershop_name': barber.barbershop.name if barber.barbershop else None,
            'barbershop_banner': barber.barbershop.banner.url if barber.barbershop and barber.barbershop.banner else None,
            'barbershop_logo': barber.barbershop.logo.url if barber.barbershop and barber.barbershop.logo else None,
        }
    elif hasattr(user, 'customer_profile'):
        profile_id = user.customer_profile.id
        role = 'customer'
        customer = user.customer_profile
        # Pega a barbearia mais recente associada como fallback através do modelo intermédio
        last_stat = customer.barbershop_stats.select_related('barbershop').first()
        extra_data = {
            'birth_date': customer.birth_date,
            'profile_picture': customer.profile_picture.url if customer.profile_picture else None,
            'phone': customer.phone,
            'full_name': customer.name,
            'barbershop_slug': last_stat.barbershop.slug if last_stat else None
        }
    
    return Response({
        'id': user.id,
        'username': user.username,
        'name': user.first_name,
        'role': role,
        'profile_id': profile_id,
        **extra_data
    })


class BarberViewSet(TenantModelViewSet):
    queryset = Barber.objects.all()
    serializer_class = BarberSerializer
    permission_classes = [AllowAny]


class ServiceViewSet(TenantModelViewSet):
    """ViewSet para gerenciar serviços"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar clientes (Global, mas vinculado ao Tenant)"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone']
    ordering_fields = ['name']

    def get_queryset(self):
        barbershop = getattr(self.request, 'barbershop', None)
        
        # Fallback para usuário autenticado (Barbeiro)
        if not barbershop and self.request.user.is_authenticated:
            if hasattr(self.request.user, 'barber_profile'):
                barbershop = self.request.user.barber_profile.barbershop
                self.request.barbershop = barbershop

        if not barbershop:
            return Customer.objects.none()
        
        # Filtra clientes que possuem vínculo com esta barbearia
        customer_ids = CustomerBarbershop.objects.filter(barbershop=barbershop).values_list('customer_id', flat=True)
        return Customer.objects.filter(id__in=customer_ids)

    @action(detail=True, methods=['post'])
    def redeem_points(self, request, pk=None):
        """Resgatar pontos de fidelidade na barbearia atual"""
        customer = self.get_object()
        barbershop = request.barbershop
        cb = CustomerBarbershop.objects.filter(customer=customer, barbershop=barbershop).first()
        
        if not cb:
            return Response({'success': False, 'error': 'Cliente não vinculado a esta barbearia'}, status=400)

        try:
            points_to_redeem = int(request.data.get('points', 0))
        except (ValueError, TypeError):
            return Response({'success': False, 'error': 'Valor de pontos inválido'}, status=400)
        
        if cb.points >= points_to_redeem:
            cb.points -= points_to_redeem
            cb.save()
            return Response({'success': True, 'remaining_points': cb.points})
        return Response({'success': False, 'error': 'Pontos insuficientes'}, status=400)


class LoyaltyRewardViewSet(TenantModelViewSet):
    """ViewSet para recompensas de fidelidade"""
    queryset = LoyaltyReward.objects.all()
    serializer_class = LoyaltyRewardSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['points_required', 'created_at']


class AppointmentViewSet(TenantModelViewSet):
    """ViewSet para gerenciar agendamentos"""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'platform', 'date']
    ordering_fields = ['date', 'created_at']

    def create(self, request, *args, **kwargs):
        barbershop = request.barbershop
        barber_id = request.data.get('barberId')
        
        if not barber_id and hasattr(request.user, 'barber_profile'):
            barber_id = request.user.barber_profile.id
            
        if not barber_id:
            first_barber = Barber.objects.filter(barbershop=barbershop).first()
            if first_barber:
                barber_id = first_barber.id
        
        service_id = request.data.get('serviceId')
        customer_id = request.data.get('customer')
        client_name = request.data.get('clientName')
        client_phone = request.data.get('clientPhone')
        date_str = request.data.get('date')
        platform = request.data.get('platform', 'manual')
        is_override = request.data.get('isOverride', False)

        if not all([barber_id, service_id, client_name, date_str]):
            return Response({"error": "MISSING_FIELDS"}, status=status.HTTP_400_BAD_REQUEST)

        # Se não tem customer_id mas tem telefone, tenta vincular ou criar cliente
        if not customer_id and client_phone:
            customer, _ = Customer.objects.get_or_create(
                phone=client_phone,
                defaults={'name': client_name}
            )
            customer_id = customer.id

        # Garantir vínculo do cliente com a barbearia
        if customer_id:
            CustomerBarbershop.objects.get_or_create(customer_id=customer_id, barbershop=barbershop)

        try:
            date_obj = parse_datetime(date_str)
            if not date_obj:
                return Response({"error": "INVALID_DATE_FORMAT"}, status=status.HTTP_400_BAD_REQUEST)
            
            if timezone.is_naive(date_obj):
                date_obj = timezone.make_aware(date_obj)

            appointment = BookingService.create_appointment(
                barbershop=barbershop,
                barber_id=barber_id,
                service_id=service_id,
                customer_id=customer_id,
                client_name=client_name,
                start_time=date_obj,
                platform=platform,
                is_override=is_override
            )
            serializer = self.get_serializer(appointment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            error_code = str(e.detail[0]) if hasattr(e, 'detail') else "INTERNAL_ERROR"
            status_code = status.HTTP_409_CONFLICT if error_code == "SLOT_UNAVAILABLE" else status.HTTP_400_BAD_REQUEST
            return Response({"error": error_code, "message": str(e)}, status=status_code)

    def destroy(self, request, *args, **kwargs):
        appointment = self.get_object()
        BookingService.cancel_appointment(appointment.id)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Marca um agendamento como concluído e gera transação"""
        appointment = BookingService.complete_appointment(pk)
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Retorna os agendamentos de hoje"""
        from datetime import date
        today_appointments = self.get_queryset().filter(date__date=date.today())
        serializer = self.get_serializer(today_appointments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        barbershop = request.barbershop
        barber_id = request.query_params.get('barberId')
        service_id = request.query_params.get('serviceId')
        date_str = request.query_params.get('date')

        if not all([barber_id, service_id, date_str]):
            return Response({"error": "MISSING_PARAMS"}, status=400)

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            slots = BookingService.get_available_slots(barbershop, barber_id, service_id, target_date)
            return Response([s.strftime('%H:%M') for s in slots])
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class AvailabilityViewSet(TenantModelViewSet):
    """ViewSet para disponibilidade semanal per-barbershop"""
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['day_of_week']

    @action(detail=False, methods=['post'])
    def sync(self, request):
        """Sincroniza todas as disponibilidades do barbeiro logado"""
        barber = request.user.barber_profile
        data = request.data  # Lista de novos horários
        
        # Remove horários atuais
        Availability.objects.filter(barber=barber).delete()
        
        # Cria novos
        created = []
        for item in data:
            serializer = self.get_serializer(data=item)
            if serializer.is_valid():
                serializer.save(barber=barber)
                created.append(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(created, status=status.HTTP_201_CREATED)


class ScheduleExceptionViewSet(TenantModelViewSet):
    """ViewSet para exceções na agenda"""
    queryset = ScheduleException.objects.all()
    serializer_class = ScheduleExceptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'date']
    ordering_fields = ['date', 'created_at']


class TransactionViewSet(TenantModelViewSet):
    """ViewSet para transações financeiras"""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'status', 'category', 'payment_method']
    ordering_fields = ['date', 'amount', 'created_at']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Retorna resumo financeiro"""
        from django.db.models import Sum
        from datetime import date, timedelta
        
        barbershop = request.barbershop
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_transactions = self.get_queryset().filter(date__gte=thirty_days_ago)
        
        total_income = recent_transactions.filter(
            type='income', status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_expense = recent_transactions.filter(
            type='expense', status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        pending_expense = recent_transactions.filter(
            type='expense', status='pending'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'total_income': float(total_income),
            'total_expense': float(total_expense),
            'pending_expense': float(pending_expense),
            'balance': float(total_income - total_expense)
        })


class PromotionViewSet(TenantModelViewSet):
    """ViewSet para promoções"""
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'target_audience', 'target_day']
    ordering_fields = ['created_at', 'reach']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Retorna promoções ativas"""
        active_promotions = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(active_promotions, many=True)
        return Response(serializer.data)


class ProductViewSet(TenantModelViewSet):
    """ViewSet para controle de estoque per-barbershop"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name']
    ordering_fields = ['name', 'stock', 'created_at']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Retorna produtos com estoque baixo"""
        from django.db.models import F
        low_stock_products = self.get_queryset().filter(stock__lte=F('min_stock'))
        serializer = self.get_serializer(low_stock_products, many=True)
        return Response(serializer.data)
