from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User


class Barbershop(models.Model):
    """Representa uma empresa/estabelecimento (Tenant)"""
    PLAN_CHOICES = [
        ('trial', 'Teste Grátis'),
        ('BASIC', 'Básico'),
        ('TEAM', 'Equipe'),
        ('PRO', 'IA Pro'),
    ]
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_barbershops')
    plan = models.CharField(max_length=10, choices=PLAN_CHOICES, default='trial')
    logo = models.ImageField(upload_to='barbershops/logos/', null=True, blank=True)
    banner = models.ImageField(upload_to='barbershops/banners/', null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    instagram = models.CharField(max_length=100, blank=True, null=True)
    primary_color = models.CharField(max_length=7, default='#007AFF')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    """Extensão do User para controle de papéis no SaaS"""
    ROLE_CHOICES = [
        ('OWNER', 'Dono'),
        ('BARBER', 'Barbeiro'),
        ('CLIENT', 'Cliente'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='CLIENT')
    cpf = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Service(models.Model):
    """Serviços oferecidos pela barbearia"""
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='services', null=True)
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.IntegerField(help_text="Duração em minutos")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.barbershop.name if self.barbershop else 'Global'})"


class Barber(models.Model):
    """Barbeiros da barbearia"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='barber_profile', null=True, blank=True)
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='barbers', null=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    description = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='barbers/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    buffer_minutes = models.IntegerField(default=5)
    booking_horizon_days = models.IntegerField(default=30)
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.name} @ {self.barbershop.name if self.barbershop else 'N/A'}"


class Customer(models.Model):
    """Clientes da barbearia (Perfil Global)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile', null=True, blank=True)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    birth_date = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class CustomerBarbershop(models.Model):
    """Dados do cliente em uma barbearia específica (pontos, histórico local)"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='barbershop_stats')
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='customers')
    last_visit = models.CharField(max_length=100, default='Primeira vez')
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default='')
    points = models.IntegerField(default=0, help_text="Pontos de fidelidade")

    class Meta:
        unique_together = ['customer', 'barbershop']


class LoyaltyReward(models.Model):
    """Recompensas do programa de fidelidade"""
    TYPE_CHOICES = [
        ('service', 'Serviço'),
        ('product', 'Produto'),
    ]
    
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='loyalty_rewards', null=True)
    name = models.CharField(max_length=200)
    points_required = models.IntegerField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['points_required']

    def __str__(self):
        return f"{self.name} ({self.points_required} pts) - {self.barbershop.name if self.barbershop else 'Global'}"


class Appointment(models.Model):
    """Agendamentos"""
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('confirmed', 'Confirmado'),
        ('cancelled', 'Cancelado'),
        ('completed', 'Concluído'),
    ]
    
    PLATFORM_CHOICES = [
        ('manual', 'Manual'),
        ('whatsapp', 'WhatsApp'),
        ('web', 'Web'),
    ]
    
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='appointments', null=True)
    client_name = models.CharField(max_length=200)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='appointments')
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='manual')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.client_name} - {self.service.name} - {self.date}"


class TimeSlot(models.Model):
    """Representa o slot de tempo reservado para um agendamento"""
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='slot')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    class Meta:
        indexes = [
            models.Index(fields=['start_time', 'end_time']),
        ]

    def __str__(self):
        return f"Slot {self.start_time} - {self.end_time}"


class Availability(models.Model):
    """Disponibilidade semanal (Base para a agenda)"""
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='availabilities', null=True)
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE, related_name='availability', null=True)
    day_of_week = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(6)],
        help_text="0=Domingo, 6=Sábado"
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
        return f"{days[self.day_of_week]} - {self.start_time} às {self.end_time}"


class DailyAvailability(models.Model):
    """Disponibilidade para uma data específica (substitui/acompanha a jornada semanal)"""
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='daily_availabilities', null=True)
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE, related_name='daily_availability', null=True)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.date} - {self.start_time} às {self.end_time}"


class ScheduleException(models.Model):
    """Exceções na agenda (feriados, horários estendidos)"""
    TYPE_CHOICES = [
        ('extended', 'Horário Estendido'),
        ('blocked', 'Bloqueado'),
    ]
    
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='schedule_exceptions', null=True)
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE, related_name='exceptions', null=True)
    date = models.DateField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    reason = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.date} - {self.reason}"


class Transaction(models.Model):
    """Transações financeiras"""
    TYPE_CHOICES = [
        ('income', 'Receita'),
        ('expense', 'Despesa'),
    ]
    
    STATUS_CHOICES = [
        ('paid', 'Pago'),
        ('pending', 'Pendente'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Dinheiro'),
        ('card', 'Cartão'),
        ('pix', 'PIX'),
    ]
    
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='transactions', null=True)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    category = models.CharField(max_length=100)
    date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='paid')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.description} - R$ {self.amount} ({self.barbershop.name if self.barbershop else 'Global'})"


class Promotion(models.Model):
    """Promoções e campanhas de marketing"""
    STATUS_CHOICES = [
        ('active', 'Ativa'),
        ('scheduled', 'Agendada'),
        ('finished', 'Finalizada'),
    ]
    
    TARGET_CHOICES = [
        ('all', 'Todos'),
        ('vip', 'VIP'),
        ('inactive', 'Inativos'),
    ]
    
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='promotions', null=True)
    name = models.CharField(max_length=200)
    discount = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='promotions')
    target_day = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(6)]
    )
    target_audience = models.CharField(max_length=20, choices=TARGET_CHOICES, default='all')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    reach = models.IntegerField(default=0, help_text="Número de pessoas alcançadas")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.barbershop.name if self.barbershop else 'Global'}"


class Product(models.Model):
    """Produtos e estoque"""
    CATEGORY_CHOICES = [
        ('consumo', 'Consumo'),
        ('venda', 'Venda'),
        ('bar', 'Bar'),
    ]
    
    barbershop = models.ForeignKey(Barbershop, on_delete=models.CASCADE, related_name='products', null=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=5)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    last_restock = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.barbershop.name if self.barbershop else 'Global'})"
