from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Barbershop, UserProfile, Service, Customer, CustomerBarbershop, LoyaltyReward, Appointment,
    Availability, ScheduleException, Transaction, Promotion, Product, Barber, TimeSlot, DailyAvailability
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class BarbershopSerializer(serializers.ModelSerializer):
    trial_days_left = serializers.SerializerMethodField()

    class Meta:
        model = Barbershop
        fields = ['id', 'name', 'slug', 'description', 'address', 'phone', 'logo', 'banner', 'primary_color', 'is_active', 'created_at', 'trial_days_left', 'plan']

    def get_trial_days_left(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.created_at
        days_left = 15 - delta.days
        return max(0, days_left)

class BarberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Barber
        fields = '__all__'
        read_only_fields = ['barbershop']

class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['start_time', 'end_time']

class ServiceSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = Service
        fields = ['id', 'name', 'price', 'duration', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'barbershop']

class CustomerSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    lastVisit = serializers.SerializerMethodField()
    totalSpent = serializers.SerializerMethodField()
    points = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'birth_date', 'profile_picture', 'lastVisit', 'totalSpent', 'notes', 'points', 'created_at', 'updated_at', 'user']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_lastVisit(self, obj):
        barbershop = self.context.get('request').barbershop if self.context.get('request') else None
        if not barbershop: return None
        cb = CustomerBarbershop.objects.filter(customer=obj, barbershop=barbershop).first()
        return cb.last_visit if cb else None

    def get_totalSpent(self, obj):
        barbershop = self.context.get('request').barbershop if self.context.get('request') else None
        if not barbershop: return 0
        cb = CustomerBarbershop.objects.filter(customer=obj, barbershop=barbershop).first()
        return float(cb.total_spent) if cb else 0

    def get_points(self, obj):
        barbershop = self.context.get('request').barbershop if self.context.get('request') else None
        if not barbershop: return 0
        cb = CustomerBarbershop.objects.filter(customer=obj, barbershop=barbershop).first()
        return cb.points if cb else 0

    def get_notes(self, obj):
        barbershop = self.context.get('request').barbershop if self.context.get('request') else None
        if not barbershop: return ""
        cb = CustomerBarbershop.objects.filter(customer=obj, barbershop=barbershop).first()
        return cb.notes if cb else ""

class LoyaltyRewardSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    pointsRequired = serializers.IntegerField(source='points_required')
    
    class Meta:
        model = LoyaltyReward
        fields = ['id', 'name', 'pointsRequired', 'type', 'created_at']
        read_only_fields = ['id', 'created_at', 'barbershop']

class AppointmentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    clientName = serializers.CharField(source='client_name')
    serviceId = serializers.PrimaryKeyRelatedField(
        source='service', 
        queryset=Service.objects.all()
    )
    barberId = serializers.PrimaryKeyRelatedField(
        source='barber',
        queryset=Barber.objects.all()
    )
    service_name = serializers.ReadOnlyField(source='service.name')
    barber_name = serializers.ReadOnlyField(source='barber.name')
    service_price = serializers.ReadOnlyField(source='service.price')
    slot = TimeSlotSerializer(read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'clientName', 'serviceId', 'barberId', 
            'service_name', 'barber_name', 'service_price',
            'date', 'status', 'platform', 'customer', 'slot', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'slot', 'barbershop']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'barbershop'):
            self.fields['serviceId'].queryset = Service.objects.filter(barbershop=request.barbershop)
            self.fields['barberId'].queryset = Barber.objects.filter(barbershop=request.barbershop)

    def update(self, instance, validated_data):
        if instance.status == 'confirmed' and ('date' in validated_data or 'service' in validated_data or 'barber' in validated_data):
            raise serializers.ValidationError("Não é permitido alterar horário ou serviço de um agendamento confirmado. Cancele e crie um novo.")
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if 'serviceId' in ret and ret['serviceId'] is not None:
            ret['serviceId'] = str(ret['serviceId'])
        if 'barberId' in ret and ret['barberId'] is not None:
            ret['barberId'] = str(ret['barberId'])
        if 'customer' in ret and ret['customer'] is not None:
            ret['customer'] = str(ret['customer'])
        return ret


class AvailabilitySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    dayOfWeek = serializers.IntegerField(source='day_of_week')
    startTime = serializers.TimeField(source='start_time', format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    endTime = serializers.TimeField(source='end_time', format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    isActive = serializers.BooleanField(source='is_active')
    
    class Meta:
        model = Availability
        fields = ['id', 'dayOfWeek', 'startTime', 'endTime', 'isActive']
        read_only_fields = ['id', 'barbershop']


class DailyAvailabilitySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    date = serializers.DateField()
    startTime = serializers.TimeField(source='start_time', format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    endTime = serializers.TimeField(source='end_time', format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    isActive = serializers.BooleanField(source='is_active')

    class Meta:
        model = DailyAvailability
        fields = ['id', 'date', 'startTime', 'endTime', 'isActive']
        read_only_fields = ['id', 'barbershop']


class ScheduleExceptionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    startTime = serializers.TimeField(source='start_time', format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'], required=False, allow_null=True)
    endTime = serializers.TimeField(source='end_time', format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'], required=False, allow_null=True)
    
    class Meta:
        model = ScheduleException
        fields = ['id', 'date', 'type', 'startTime', 'endTime', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at', 'barbershop']


class TransactionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    paymentMethod = serializers.CharField(source='payment_method', required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'description', 'amount', 'type', 'category', 'date', 'status', 'paymentMethod', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'barbershop']


class PromotionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    discount = serializers.DecimalField(max_digits=5, decimal_places=2, coerce_to_string=False)
    serviceId = serializers.PrimaryKeyRelatedField(
        source='service', 
        queryset=Service.objects.all()
    )
    targetDay = serializers.IntegerField(source='target_day', required=False, allow_null=True)
    targetAudience = serializers.CharField(source='target_audience')
    
    class Meta:
        model = Promotion
        fields = ['id', 'name', 'discount', 'serviceId', 'targetDay', 'targetAudience', 'status', 'reach', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'barbershop']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'barbershop'):
            self.fields['serviceId'].queryset = Service.objects.filter(barbershop=request.barbershop)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if 'serviceId' in ret and ret['serviceId'] is not None:
            ret['serviceId'] = str(ret['serviceId'])
        return ret


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    minStock = serializers.IntegerField(source='min_stock')
    costPrice = serializers.DecimalField(source='cost_price', max_digits=10, decimal_places=2, coerce_to_string=False)
    salePrice = serializers.DecimalField(source='sale_price', max_digits=10, decimal_places=2, required=False, allow_null=True, coerce_to_string=False)
    expiryDate = serializers.DateField(source='expiry_date', required=False, allow_null=True)
    lastRestock = serializers.DateField(source='last_restock', required=False, allow_null=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'stock', 'minStock', 'costPrice', 'salePrice', 'expiryDate', 'lastRestock', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'barbershop']
