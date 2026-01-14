from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
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


class BarberViewSet(viewsets.ModelViewSet):
    queryset = Barber.objects.all()
    serializer_class = BarberSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar serviços"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar clientes"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone']
    ordering_fields = ['name', 'total_spent', 'points', 'last_visit']

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
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'platform', 'date']
    ordering_fields = ['date', 'created_at']

    def create(self, request, *args, **kwargs):
        barber_id = request.data.get('barberId')
        # Se não vier barberId, usa o primeiro (Willian Cut) para não quebrar o dashboard atual
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
            return Response({"slots": [s.isoformat() for s in slots]})
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
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['day_of_week']


class ScheduleExceptionViewSet(viewsets.ModelViewSet):
    """ViewSet para exceções na agenda"""
    queryset = ScheduleException.objects.all()
    serializer_class = ScheduleExceptionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'date']
    ordering_fields = ['date', 'created_at']


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet para transações financeiras"""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
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
