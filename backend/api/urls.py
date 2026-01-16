from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet, CustomerViewSet, LoyaltyRewardViewSet,
    AppointmentViewSet, AvailabilityViewSet,
    ScheduleExceptionViewSet, TransactionViewSet, PromotionViewSet,
    ProductViewSet, BarberViewSet, whatsapp_login, get_me
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'barbers', BarberViewSet, basename='barber')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'loyalty-rewards', LoyaltyRewardViewSet, basename='loyalty-reward')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'availability', AvailabilityViewSet, basename='availability')
router.register(r'schedule-exceptions', ScheduleExceptionViewSet, basename='schedule-exception')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'promotions', PromotionViewSet, basename='promotion')
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('auth/login/', whatsapp_login, name='whatsapp-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', get_me, name='get-me'),
    path('', include(router.urls)),
]
