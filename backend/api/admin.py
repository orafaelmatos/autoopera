from django.contrib import admin
from .models import (
    Barber, Service, Customer, LoyaltyReward, Appointment,
    Availability, ScheduleException, Transaction, Promotion, Product
)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration']
    search_fields = ['name']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'total_spent', 'points', 'last_visit']
    search_fields = ['name', 'phone']
    list_filter = ['last_visit']


@admin.register(LoyaltyReward)
class LoyaltyRewardAdmin(admin.ModelAdmin):
    list_display = ['name', 'points_required', 'type']
    list_filter = ['type']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'service', 'date', 'status', 'platform']
    list_filter = ['status', 'platform', 'date']
    search_fields = ['client_name']


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ['day_of_week', 'start_time', 'end_time', 'lunch_start', 'lunch_end', 'is_active']
    list_filter = ['is_active']


@admin.register(ScheduleException)
class ScheduleExceptionAdmin(admin.ModelAdmin):
    list_display = ['date', 'type', 'reason']
    list_filter = ['type', 'date']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'type', 'category', 'date', 'status']
    list_filter = ['type', 'status', 'category', 'payment_method']
    search_fields = ['description']


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ['name', 'discount', 'service', 'status', 'reach']
    list_filter = ['status', 'target_audience']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'stock', 'min_stock', 'cost_price', 'sale_price']
    list_filter = ['category']
    search_fields = ['name']

@admin.register(Barber)
class BarberAdmin(admin.ModelAdmin):
    list_display = ['name', 'email']
    search_fields = ['name']
