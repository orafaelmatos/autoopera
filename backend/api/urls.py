from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BarbershopViewSet, BarberViewSet, ServiceViewSet, CustomerViewSet, 
    LoyaltyRewardViewSet, AppointmentViewSet, AvailabilityViewSet,
    ScheduleExceptionViewSet, TransactionViewSet, PromotionViewSet,
    ProductViewSet, whatsapp_login, get_me, current_barbershop,
    n8n_today_summary, n8n_next_appointments, barber_register, owner_login, DailyAvailabilityViewSet,
    check_cpf, pwa_manifest
)
from .webhooks import cacto_webhook
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'barbers', BarberViewSet, basename='barber')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'loyalty-rewards', LoyaltyRewardViewSet, basename='loyalty-reward')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'availability', AvailabilityViewSet, basename='availability')
router.register(r'dailyavailability', DailyAvailabilityViewSet, basename='dailyavailability')
router.register(r'schedule-exceptions', ScheduleExceptionViewSet, basename='schedule-exception')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'promotions', PromotionViewSet, basename='promotion')
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('auth/login/', whatsapp_login, name='whatsapp-login'),
    path('auth/owner-login/', owner_login, name='owner-login'),
    path('auth/register-barber/', barber_register, name='barber-register'),
    path('auth/check-cpf/', check_cpf, name='check-cpf'),
    path('pwa-manifest/', pwa_manifest, name='pwa-manifest-default'),
    path('pwa-manifest/<str:slug>/', pwa_manifest, name='pwa-manifest'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', get_me, name='get-me'),
    
    # n8n / AI Endpoints
    path('n8n/today-summary/', n8n_today_summary, name='n8n-today-summary'),
    path('n8n/next-appointments/', n8n_next_appointments, name='n8n-next-appointments'),
    
    # Webhooks
    path('webhooks/cacto/', cacto_webhook, name='cacto-webhook'),
    
    path('config/', current_barbershop, name='current-barbershop'),
    path('', include(router.urls)),
]
