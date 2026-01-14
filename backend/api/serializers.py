from rest_framework import serializers
from .models import (
    Service, Customer, LoyaltyReward, Appointment, WaitingListEntry,
    Availability, ScheduleException, Transaction, Promotion, Product, Barber, TimeSlot
)

class BarberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Barber
        fields = '__all__'

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
        read_only_fields = ['id', 'created_at', 'updated_at']

class CustomerSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    lastVisit = serializers.CharField(source='last_visit')
    totalSpent = serializers.DecimalField(source='total_spent', max_digits=10, decimal_places=2, coerce_to_string=False)
    
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'lastVisit', 'totalSpent', 'notes', 'points', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class LoyaltyRewardSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    pointsRequired = serializers.IntegerField(source='points_required')
    
    class Meta:
        model = LoyaltyReward
        fields = ['id', 'name', 'pointsRequired', 'type', 'created_at']
        read_only_fields = ['id', 'created_at']

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
    slot = TimeSlotSerializer(read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['id', 'clientName', 'serviceId', 'barberId', 'date', 'status', 'platform', 'customer', 'slot', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'slot']

    def update(self, instance, validated_data):
        # Impedir alteração de horário ou serviço se já estiver confirmado
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


class WaitingListEntrySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    customerName = serializers.CharField(source='customer_name')
    customerPhone = serializers.CharField(source='customer_phone')
    serviceId = serializers.PrimaryKeyRelatedField(
        source='service', 
        queryset=Service.objects.all()
    )
    preferredPeriod = serializers.CharField(source='preferred_period')
    
    class Meta:
        model = WaitingListEntry
        fields = ['id', 'customerName', 'customerPhone', 'serviceId', 'date', 'preferredPeriod', 'created_at']
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if 'serviceId' in ret and ret['serviceId'] is not None:
            ret['serviceId'] = str(ret['serviceId'])
        return ret


class AvailabilitySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    dayOfWeek = serializers.IntegerField(source='day_of_week')
    startTime = serializers.TimeField(source='start_time', format='%H:%M')
    endTime = serializers.TimeField(source='end_time', format='%H:%M')
    lunchStart = serializers.TimeField(source='lunch_start', format='%H:%M', required=False, allow_null=True)
    lunchEnd = serializers.TimeField(source='lunch_end', format='%H:%M', required=False, allow_null=True)
    isActive = serializers.BooleanField(source='is_active')
    
    class Meta:
        model = Availability
        fields = ['id', 'dayOfWeek', 'startTime', 'endTime', 'lunchStart', 'lunchEnd', 'isActive']
        read_only_fields = ['id']


class ScheduleExceptionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    startTime = serializers.TimeField(source='start_time', format='%H:%M', required=False, allow_null=True)
    endTime = serializers.TimeField(source='end_time', format='%H:%M', required=False, allow_null=True)
    
    class Meta:
        model = ScheduleException
        fields = ['id', 'date', 'type', 'startTime', 'endTime', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    paymentMethod = serializers.CharField(source='payment_method', required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'description', 'amount', 'type', 'category', 'date', 'status', 'paymentMethod', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


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
        read_only_fields = ['id', 'created_at', 'updated_at']

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
        read_only_fields = ['id', 'created_at', 'updated_at']
