from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
from datetime import datetime, time, timedelta
from .models import Barber, Service, Customer, Availability, Appointment, TimeSlot
from .services import BookingService

class BookingTestCase(TestCase):
    def setUp(self):
        # 1. Criar Barbeiro
        self.user = User.objects.create_user(username='barber1', password='password')
        self.barber = Barber.objects.create(user=self.user, name='Barbeiro Teste', email='barber@teste.com')
        
        # 2. Criar Serviços
        self.corte = Service.objects.create(name='Corte', price=50.00, duration=30)
        self.barba = Service.objects.create(name='Barba', price=30.00, duration=30)
        
        # 3. Configurar Disponibilidade
        # Nossa Availability model usa: django_day = (start_time.date().weekday() + 1) % 7
        # Se start_time é uma Segunda (weekday=0), django_day = 1.
        Availability.objects.create(
            barber=self.barber,
            day_of_week=1,
            start_time=time(8, 0),
            end_time=time(18, 0),
            is_active=True
        )
        
        # Data de teste: Uma segunda-feira (ex: 2026-01-19)
        self.test_date = datetime(2026, 1, 19).date()
        self.start_at_10 = timezone.make_aware(datetime.combine(self.test_date, time(10, 0)))

    def test_create_simple_appointment(self):
        """Teste de agendamento básico"""
        apt = BookingService.create_appointment(
            barber_id=self.barber.id,
            service_id=self.corte.id,
            customer_id=None,
            client_name='Cliente Teste',
            start_time=self.start_at_10
        )
        self.assertEqual(apt.status, 'confirmed')
        self.assertEqual(TimeSlot.objects.count(), 1)
        slot = TimeSlot.objects.first()
        self.assertEqual(slot.start_time, self.start_at_10)
        self.assertEqual(slot.end_time, self.start_at_10 + timedelta(minutes=30))

    def test_prevent_double_booking(self):
        """Não pode ter dois agendamentos no mesmo horário"""
        # Primeiro agendamento
        BookingService.create_appointment(
            barber_id=self.barber.id,
            service_id=self.corte.id,
            customer_id=None,
            client_name='Cliente 1',
            start_time=self.start_at_10
        )
        
        # Segundo agendamento no mesmo horário deve falhar
        with self.assertRaises(ValidationError) as cm:
            BookingService.create_appointment(
                barber_id=self.barber.id,
                service_id=self.corte.id,
                customer_id=None,
                client_name='Cliente 2',
                start_time=self.start_at_10
            )
        self.assertEqual(cm.exception.detail[0], 'SLOT_UNAVAILABLE')

    def test_out_of_working_hours(self):
        """Só poder agendar horários que estão disponíveis"""
        # Antes do expediente (7:00)
        early_time = timezone.make_aware(datetime.combine(self.test_date, time(7, 0)))
        with self.assertRaises(ValidationError) as cm:
            BookingService.create_appointment(
                barber_id=self.barber.id,
                service_id=self.corte.id,
                customer_id=None,
                client_name='Cliente Cedo',
                start_time=early_time
            )
        self.assertEqual(cm.exception.detail[0], 'OUT_OF_WORKING_HOURS')

    def test_duration_logic(self):
        """O horário ocupado deve respeitar a duração do serviço"""
        # Se eu agendar um serviço de 60 min
        servico_longo = Service.objects.create(name='Combo', price=80.00, duration=60)
        start_time = timezone.make_aware(datetime.combine(self.test_date, time(14, 0)))
        BookingService.create_appointment(
            barber_id=self.barber.id,
            service_id=servico_longo.id,
            customer_id=None,
            client_name='Cliente Combo',
            start_time=start_time
        )
        
        # Tentar agendar algo às 14:30 deve falhar (está dentro da 1h do combo)
        mid_time = start_time + timedelta(minutes=30)
        with self.assertRaises(ValidationError) as cm:
            BookingService.create_appointment(
                barber_id=self.barber.id,
                service_id=self.corte.id,
                customer_id=None,
                client_name='Tentativa Meio',
                start_time=mid_time
            )
        self.assertEqual(cm.exception.detail[0], 'SLOT_UNAVAILABLE')

    def test_appointment_completion_and_finance(self):
        """Teste de conclusão de agendamento e entrada de saldo"""
        apt = BookingService.create_appointment(
            barber_id=self.barber.id,
            service_id=self.corte.id,
            customer_id=None,
            client_name='Cliente Financeiro',
            start_time=self.start_at_10
        )
        
        from .models import Transaction
        initial_transactions = Transaction.objects.count()
        BookingService.complete_appointment(apt.id)
        
        apt.refresh_from_db()
        self.assertEqual(apt.status, 'completed')
        self.assertEqual(Transaction.objects.count(), initial_transactions + 1)
        transaction = Transaction.objects.last()
        self.assertEqual(transaction.amount, self.corte.price)

class PermissionTestCase(TestCase):
    def test_barber_can_manage_appointments(self):
        """O barbeiro deve poder acessar a API de agendamentos"""
        user = User.objects.create_user(username='barber_p', password='password')
        Barber.objects.create(user=user, name='Barbeiro Perm', email='barberp@t.com')
        
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=user)
        
        response = client.get('/api/appointments/')
        self.assertEqual(response.status_code, 200)

class AuthAndProfileTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()

    def test_whatsapp_login_registration(self):
        """Teste de login/cadastro via WhatsApp"""
        # 1. Tentar logar com usuário inexistente sem nome deve falhar
        response = self.client.post('/api/auth/login/', {
            'phone': '11999999999',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['error'], 'USER_NOT_FOUND')

        # 2. Cadastro com nome
        response = self.client.post('/api/auth/login/', {
            'phone': '11999999999',
            'password': 'password123',
            'name': 'João Silva'
        })
        self.assertEqual(response.status_code, 201)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['name'], 'João Silva')

    def test_get_me(self):
        """Teste do endpoint /api/auth/me/"""
        user = User.objects.create_user(username='11988888888', password='password123', first_name='Carlos')
        customer = Customer.objects.create(user=user, phone='11988888888', name='Carlos')
        
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], '11988888888')
        self.assertEqual(response.data['profile_id'], customer.id)
        self.assertEqual(response.data['role'], 'customer')

class CustomerTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.user = User.objects.create_user(username='barber_test_cust', password='password')
        self.barber = Barber.objects.create(user=self.user, name='Barbeiro Cliente', email='barbercust@t.com')
        self.client.force_authenticate(user=self.user)

    def test_customer_crud(self):
        """Teste CRUD de Clientes via API"""
        # Criar
        response = self.client.post('/api/customers/', {
            'name': 'Novo Cliente',
            'phone': '11977777777',
            'email': 'novo@cliente.com',
            'notes': 'Cliente VIP'
        })
        self.assertEqual(response.status_code, 201)
        customer_id = response.data['id']

        # Listar
        response = self.client.get('/api/customers/')
        self.assertEqual(response.status_code, 200)
        # Se for barbeiro, vê todos
        self.assertTrue(any(c['name'] == 'Novo Cliente' for c in response.data))

        # Atualizar
        response = self.client.patch(f'/api/customers/{customer_id}/', {'notes': 'Cliente muito VIP'})
        self.assertEqual(response.status_code, 200)
        from .models import Customer
        self.assertEqual(Customer.objects.get(id=customer_id).notes, 'Cliente muito VIP')

class FinancialTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin', password='password', email='admin@test.com')
        self.client.force_authenticate(user=self.admin)
        from .models import Transaction

    def test_transaction_api(self):
        """Teste de criação e listagem de transações"""
        from .models import Transaction
        from django.utils import timezone
        
        # Criar Transação (Receita)
        response = self.client.post('/api/transactions/', {
            'description': 'Corte Avulso',
            'amount': 50.00,
            'type': 'income',
            'category': 'Serviço',
            'date': timezone.now().isoformat(),
            'paymentMethod': 'pix'
        })
        self.assertEqual(response.status_code, 201)

        # Criar Transação (Despesa)
        self.client.post('/api/transactions/', {
            'description': 'Aluguel',
            'amount': 1500.00,
            'type': 'expense',
            'category': 'Infraestrutura',
            'date': timezone.now().isoformat(),
            'paymentMethod': 'pix'
        })

        # Listar e Filtrar
        response = self.client.get('/api/transactions/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

class InventoryTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin', password='password', email='admin@test.com')
        self.client.force_authenticate(user=self.admin)

    def test_product_crud(self):
        """Teste CRUD de estoque"""
        # Criar Produto
        response = self.client.post('/api/products/', {
            'name': 'Pomada Modeladora',
            'category': 'venda',
            'stock': 10,
            'minStock': 5,
            'costPrice': 15.00,
            'salePrice': 35.00
        })
        self.assertEqual(response.status_code, 201)
        product_id = response.data['id']

        # Atualizar estoque
        response = self.client.patch(f'/api/products/{product_id}/', {'stock': 15})
        self.assertEqual(response.status_code, 200)
        from .models import Product
        self.assertEqual(Product.objects.get(id=product_id).stock, 15)

class AppointmentLifecycleTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.barber_user = User.objects.create_user(username='barber_life', password='password')
        self.barber = Barber.objects.create(user=self.barber_user, name='Barbeiro Ciclo', email='barberlife@t.com')
        self.service = Service.objects.create(name='Corte', price=50.00, duration=30)
        
        # Test date: tomorrow (using localtime to avoid 7am UTC vs SP issues)
        self.test_date_dt = timezone.localtime() + timedelta(days=1)
        
        # Disponibilidade for all days (easier for testing)
        for i in range(7):
            Availability.objects.create(
                barber=self.barber, day_of_week=i, 
                start_time=time(8,0), end_time=time(20,0)
            )
        
        self.client.force_authenticate(user=self.barber_user)

    def test_complete_appointment_via_api(self):
        """Teste de completar agendamento via endpoint action"""
        # 1. Criar agendamento às 10h da manhã (dentro do horário 8-20)
        test_date = self.test_date_dt.replace(hour=10, minute=0, second=0, microsecond=0)
        
        from .services import BookingService
        apt = BookingService.create_appointment(
            barber_id=self.barber.id,
            service_id=self.service.id,
            customer_id=None,
            client_name='Cliente Ciclo',
            start_time=test_date
        )

        # 2. Chamar action de completar
        response = self.client.post(f'/api/appointments/{apt.id}/complete/')
        self.assertEqual(response.status_code, 200)
        
        # 3. Verificar status e financeiro
        apt.refresh_from_db()
        self.assertEqual(apt.status, 'completed')
        from .models import Transaction
        self.assertTrue(Transaction.objects.filter(description__icontains=apt.client_name).exists())

class ExtraFeatureTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.user = User.objects.create_user(username='extra_user', password='password')
        self.barber = Barber.objects.create(user=self.user, name='Extra Barbeiro', email='extra@t.com')
        self.service = Service.objects.create(name='Corte', price=50.00, duration=30)
        self.client.force_authenticate(user=self.user)

    def test_availability_auto_generation(self):
        """Teste se os 7 dias de disponibilidade são gerados ao listar"""
        response = self.client.get('/api/availability/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 7) # Deve gerar dom-sab

    def test_low_stock_action(self):
        """Teste da listagem de estoque baixo"""
        from .models import Product
        Product.objects.create(name='Prod OK', category='venda', stock=10, min_stock=5, cost_price=10)
        Product.objects.create(name='Prod Baixo', category='venda', stock=2, min_stock=5, cost_price=10)
        
        response = self.client.get('/api/products/low_stock/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Prod Baixo')

    def test_redeem_points(self):
        """Teste de resgate de pontos"""
        from .models import Customer
        customer = Customer.objects.create(name='Pontuado', phone='11955554444', points=100)
        
        response = self.client.post(f'/api/customers/{customer.id}/redeem_points/', {'points': 30})
        self.assertEqual(response.status_code, 200)
        customer.refresh_from_db()
        self.assertEqual(customer.points, 70)

    def test_financial_summary(self):
        """Teste do resumo financeiro"""
        from .models import Transaction
        from django.utils import timezone
        Transaction.objects.create(description='Ganho', amount=100, type='income', status='paid', date=timezone.now(), category='S')
        Transaction.objects.create(description='Gasto', amount=40, type='expense', status='paid', date=timezone.now(), category='S')
        
        response = self.client.get('/api/transactions/summary/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['balance'], 60.0)

    def test_available_slots_api(self):
        """Teste da API de horários disponíveis"""
        # Configurar segunda-feira
        for i in range(7):
            Availability.objects.create(barber=self.barber, day_of_week=i, start_time=time(9,0), end_time=time(10,0))
            
        test_date = '2026-01-26' # Segunda
        response = self.client.get(f'/api/appointments/available_slots/?barberId={self.barber.id}&serviceId={self.service.id}&date={test_date}')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data) > 0)
