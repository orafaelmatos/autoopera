from django.contrib import admin
from .models import (
    Barbershop, UserProfile, Barber, Service, Customer, CustomerBarbershop, LoyaltyReward, Appointment,
    Availability, ScheduleException, Transaction, Promotion, Product
)

@admin.register(Barbershop)
class BarbershopAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'owner', 'is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role']
    list_filter = ['role']

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'barbershop', 'price', 'duration']
    list_filter = ['barbershop']
    search_fields = ['name']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone']
    search_fields = ['name', 'phone']

@admin.register(CustomerBarbershop)
class CustomerBarbershopAdmin(admin.ModelAdmin):
    list_display = ['customer', 'barbershop', 'total_spent', 'points', 'last_visit']
    list_filter = ['barbershop', 'last_visit']


@admin.register(LoyaltyReward)
class LoyaltyRewardAdmin(admin.ModelAdmin):
    list_display = ['name', 'barbershop', 'points_required', 'type']
    list_filter = ['barbershop', 'type']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'barbershop', 'service', 'date', 'status', 'platform']
    list_filter = ['barbershop', 'status', 'platform', 'date']
    search_fields = ['client_name']


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ['barbershop', 'barber', 'day_of_week', 'start_time', 'end_time']
    list_filter = ['barbershop', 'is_active']


@admin.register(ScheduleException)
class ScheduleExceptionAdmin(admin.ModelAdmin):
    list_display = ['barbershop', 'barber', 'date', 'type', 'reason']
    list_filter = ['barbershop', 'type', 'date']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['description', 'barbershop', 'amount', 'type', 'category', 'date', 'status']
    list_filter = ['barbershop', 'type', 'status', 'category', 'payment_method']
    search_fields = ['description']


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ['name', 'barbershop', 'discount', 'service', 'status', 'reach']
    list_filter = ['barbershop', 'status', 'target_audience']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'barbershop', 'category', 'stock', 'min_stock', 'cost_price', 'sale_price']
    list_filter = ['barbershop', 'category']
    search_fields = ['name']

@admin.register(Barber)
class BarberAdmin(admin.ModelAdmin):
    list_display = ['name', 'barbershop', 'email']
    list_filter = ['barbershop']
    search_fields = ['name']
