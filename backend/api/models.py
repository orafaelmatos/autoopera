from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User


class Service(models.Model):
    """Serviços oferecidos pela barbearia"""
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
        return self.name


class Barber(models.Model):
    """Barbeiros da barbearia"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='barber_profile', null=True, blank=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    buffer_minutes = models.IntegerField(default=5)
    booking_horizon_days = models.IntegerField(default=30)

    def __str__(self):
        return self.name


class Customer(models.Model):
    """Clientes da barbearia"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile', null=True, blank=True)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    cpf = models.CharField(max_length=14, blank=True, null=True)
    last_visit = models.CharField(max_length=100, default='Primeira vez')
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default='')
    points = models.IntegerField(default=0, help_text="Pontos de fidelidade")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_spent']

    def __str__(self):
        return self.name


class LoyaltyReward(models.Model):
    """Recompensas do programa de fidelidade"""
    TYPE_CHOICES = [
        ('service', 'Serviço'),
        ('product', 'Produto'),
    ]
    
    name = models.CharField(max_length=200)
    points_required = models.IntegerField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['points_required']

    def __str__(self):
        return f"{self.name} ({self.points_required} pts)"


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


class WaitingListEntry(models.Model):
    """Lista de espera"""
    PERIOD_CHOICES = [
        ('morning', 'Manhã'),
        ('afternoon', 'Tarde'),
        ('night', 'Noite'),
        ('any', 'Qualquer'),
    ]
    
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=20)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='waiting_entries')
    date = models.DateField()
    preferred_period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='any')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.customer_name} - {self.date}"


class Availability(models.Model):
    """Disponibilidade semanal"""
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE, related_name='availability', null=True)
    day_of_week = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(6)],
        help_text="0=Domingo, 6=Sábado"
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    lunch_start = models.TimeField(null=True, blank=True, help_text="Início do almoço")
    lunch_end = models.TimeField(null=True, blank=True, help_text="Fim do almoço")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['day_of_week']
        unique_together = ['barber', 'day_of_week']

    def __str__(self):
        days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
        return f"{days[self.day_of_week]} - {self.start_time} às {self.end_time} (Almoço: {self.lunch_start}-{self.lunch_end})"


class ScheduleException(models.Model):
    """Exceções na agenda (feriados, horários estendidos)"""
    TYPE_CHOICES = [
        ('extended', 'Horário Estendido'),
        ('blocked', 'Bloqueado'),
    ]
    
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
        return f"{self.description} - R$ {self.amount}"


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
        return self.name


class Product(models.Model):
    """Produtos e estoque"""
    CATEGORY_CHOICES = [
        ('consumo', 'Consumo'),
        ('venda', 'Venda'),
        ('bar', 'Bar'),
    ]
    
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
        return self.name
