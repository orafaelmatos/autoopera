from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Service, Customer, LoyaltyReward, Appointment, WaitingListEntry,
    Availability, ScheduleException, Transaction, Promotion, Product, Barber
)
from .serializers import (
    ServiceSerializer, CustomerSerializer, LoyaltyRewardSerializer,
    AppointmentSerializer, WaitingListEntrySerializer, AvailabilitySerializer,
    ScheduleExceptionSerializer, TransactionSerializer, PromotionSerializer,
    ProductSerializer, BarberSerializer
)
from .services import BookingService
from datetime import datetime
from django.utils import timezone
from django.utils.dateparse import parse_datetime


@api_view(['POST'])
@permission_classes([AllowAny])
def whatsapp_login(request):
    phone = request.data.get('phone')
    password = request.data.get('password')
    name = request.data.get('name')  # Opcional, para cadastro

    if not phone or not password:
        return Response({"error": "Telefone e senha são obrigatórios"}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=phone, password=password)

    if user:
        refresh = RefreshToken.for_user(user)
        role = 'customer'
        if hasattr(user, 'barber_profile'):
            role = 'barber'
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': role,
            'name': user.first_name or user.username,
            'phone': user.username
        })

    # Se o usuário não existe, verifica se deve criar
    if not User.objects.filter(username=phone).exists():
        if not name:
            return Response({
                "error": "USER_NOT_FOUND", 
                "message": "Usuário não encontrado. Por favor, informe seu nome para cadastro."
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Criar novo usuário (cliente)
        user = User.objects.create_user(username=phone, password=password, first_name=name)
        customer, created = Customer.objects.get_or_create(phone=phone, defaults={'name': name, 'user': user})
        if not created:
            customer.user = user
            customer.save()
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': 'customer',
            'name': name,
            'phone': phone
        }, status=status.HTTP_201_CREATED)

    return Response({"error": "Credenciais inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request):
    user = request.user
    role = 'customer'
    profile_id = None
    if hasattr(user, 'barber_profile'):
        role = 'barber'
        profile_id = user.barber_profile.id
    elif hasattr(user, 'customer_profile'):
        profile_id = user.customer_profile.id
        role = 'customer'
    
    return Response({
        'id': user.id,
        'username': user.username,
        'name': user.first_name,
        'role': role,
        'profile_id': profile_id
    })


class BarberViewSet(viewsets.ModelViewSet):
    queryset = Barber.objects.all()
    serializer_class = BarberSerializer
    permission_classes = [IsAuthenticated]


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar serviços"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar clientes"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone', 'email', 'cpf']
    ordering_fields = ['name', 'total_spent', 'points', 'last_visit']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'barber_profile'):
            return Customer.objects.all()
        elif hasattr(user, 'customer_profile'):
            return Customer.objects.filter(id=user.customer_profile.id)
        return Customer.objects.none()

    @action(detail=True, methods=['post'])
    def redeem_points(self, request, pk=None):
        """Resgatar pontos de fidelidade"""
        customer = self.get_object()
        points_to_redeem = request.data.get('points', 0)
        
        if customer.points >= points_to_redeem:
            customer.points -= points_to_redeem
            customer.save()
            return Response({'success': True, 'remaining_points': customer.points})
        return Response({'success': False, 'error': 'Pontos insuficientes'}, status=400)


class LoyaltyRewardViewSet(viewsets.ModelViewSet):
    """ViewSet para recompensas de fidelidade"""
    queryset = LoyaltyReward.objects.all()
    serializer_class = LoyaltyRewardSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['points_required', 'created_at']


class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar agendamentos"""
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'platform', 'date']
    ordering_fields = ['date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'barber_profile'):
            return Appointment.objects.filter(barber=user.barber_profile)
        elif hasattr(user, 'customer_profile'):
            return Appointment.objects.filter(customer=user.customer_profile)
        return Appointment.objects.none()

    def create(self, request, *args, **kwargs):
        barber_id = request.data.get('barberId')
        # Se for barbeiro e não enviou ID, usa o dele
        if not barber_id and hasattr(request.user, 'barber_profile'):
            barber_id = request.user.barber_profile.id
            
        # Fallback para o primeiro
        if not barber_id:
            first_barber = Barber.objects.first()
            if first_barber:
                barber_id = first_barber.id
        
        service_id = request.data.get('serviceId')
        customer_id = request.data.get('customer')
        client_name = request.data.get('clientName')
        date_str = request.data.get('date')
        platform = request.data.get('platform', 'manual')
        is_override = request.data.get('isOverride', False)

        if not all([barber_id, service_id, client_name, date_str]):
            return Response({"error": "MISSING_FIELDS"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            date_obj = parse_datetime(date_str)
            if not date_obj:
                return Response({"error": "INVALID_DATE_FORMAT"}, status=status.HTTP_400_BAD_REQUEST)
            
            if timezone.is_naive(date_obj):
                date_obj = timezone.make_aware(date_obj)

            appointment = BookingService.create_appointment(
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

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Retorna os agendamentos de hoje"""
        from datetime import date
        today_appointments = self.queryset.filter(date__date=date.today())
        serializer = self.get_serializer(today_appointments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        barber_id = request.query_params.get('barberId')
        service_id = request.query_params.get('serviceId')
        date_str = request.query_params.get('date')

        if not all([barber_id, service_id, date_str]):
            return Response({"error": "MISSING_PARAMS"}, status=400)

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            slots = BookingService.get_available_slots(barber_id, service_id, target_date)
            return Response([s.strftime('%H:%M') for s in slots])
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class WaitingListEntryViewSet(viewsets.ModelViewSet):
    """ViewSet para lista de espera"""
    queryset = WaitingListEntry.objects.all()
    serializer_class = WaitingListEntrySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['date', 'preferred_period']
    ordering_fields = ['created_at', 'date']


class AvailabilityViewSet(viewsets.ModelViewSet):
    """ViewSet para disponibilidade semanal"""
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['day_of_week']

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'barber_profile'):
            return Availability.objects.none()
        
        barber = user.barber_profile
        
        # Garante que os 7 dias existam
        default_work = [
            {'day': 0, 'start': '09:00', 'end': '12:00', 'l_start': None, 'l_end': None, 'active': False}, # Dom
            {'day': 1, 'start': '09:00', 'end': '19:00', 'l_start': '12:00', 'l_end': '13:00', 'active': True}, # Seg
            {'day': 2, 'start': '09:00', 'end': '19:00', 'l_start': '12:00', 'l_end': '13:00', 'active': True}, # Ter
            {'day': 3, 'start': '09:00', 'end': '19:00', 'l_start': '12:00', 'l_end': '13:00', 'active': True}, # Qua
            {'day': 4, 'start': '09:00', 'end': '19:00', 'l_start': '12:00', 'l_end': '13:00', 'active': True}, # Qui
            {'day': 5, 'start': '09:00', 'end': '19:00', 'l_start': '12:00', 'l_end': '13:00', 'active': True}, # Sex
            {'day': 6, 'start': '09:00', 'end': '17:00', 'l_start': '12:00', 'l_end': '13:00', 'active': True}, # Sab
        ]
        
        for dw in default_work:
            Availability.objects.get_or_create(
                barber=barber,
                day_of_week=dw['day'],
                defaults={
                    'start_time': dw['start'],
                    'end_time': dw['end'],
                    'lunch_start': dw['l_start'],
                    'lunch_end': dw['l_end'],
                    'is_active': dw['active']
                }
            )
            
        return Availability.objects.filter(barber=barber)

    def perform_create(self, serializer):
        serializer.save(barber=self.request.user.barber_profile)


class ScheduleExceptionViewSet(viewsets.ModelViewSet):
    """ViewSet para exceções na agenda"""
    serializer_class = ScheduleExceptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'date']
    ordering_fields = ['date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'barber_profile'):
            return ScheduleException.objects.none()
        return ScheduleException.objects.filter(barber=user.barber_profile)

    def perform_create(self, serializer):
        serializer.save(barber=self.request.user.barber_profile)


class TransactionViewSet(viewsets.ModelViewSet):
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
        from django.db.models import Sum, Q
        from datetime import date, timedelta
        
        # Últimos 30 dias
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_transactions = self.queryset.filter(date__gte=thirty_days_ago)
        
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


class PromotionViewSet(viewsets.ModelViewSet):
    """ViewSet para promoções"""
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'target_audience', 'target_day']
    ordering_fields = ['created_at', 'reach']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Retorna promoções ativas"""
        active_promotions = self.queryset.filter(status='active')
        serializer = self.get_serializer(active_promotions, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet para produtos"""
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
        low_stock_products = self.queryset.filter(stock__lte=F('min_stock'))
        serializer = self.get_serializer(low_stock_products, many=True)
        return Response(serializer.data)
