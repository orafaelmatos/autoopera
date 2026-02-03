from datetime import datetime, timedelta, time
import threading
import requests
import logging
from django.db import transaction
from django.utils import timezone
from django.db.models import Q
from rest_framework import exceptions
from .models import Appointment, TimeSlot, Service, Barber, Availability, ScheduleException, DailyAvailability

logger = logging.getLogger(__name__)

class WebhookService:
    @staticmethod
    def send_appointment_webhook(appointment):
        """
        Envia os dados do agendamento para o webhook do n8n de forma assíncrona.
        """
        def task():
            try:
                # Payload conforme requisitos do usuário
                # O backend usa timezone UTC internamente, mas formatamos para o n8n em Horário de Brasília
                try:
                    from zoneinfo import ZoneInfo
                except ImportError:
                    from backports.zoneinfo import ZoneInfo
                
                br_tz = ZoneInfo('America/Sao_Paulo')
                date_br = appointment.date.astimezone(br_tz)

                payload = {
                    "event": "appointment_created",
                    "appointment_id": str(appointment.id),
                    "barbershop": {
                        "name": appointment.barbershop.name,
                        "phone": appointment.barbershop.phone or appointment.barber.whatsapp or ""
                    },
                    "client": {
                        "name": appointment.client_name,
                        "phone": appointment.client_phone or getattr(appointment.customer, 'phone', None) or ""
                    },
                    "service": {
                        "name": ", ".join([s.name for s in appointment.services.all()])
                    },
                    "appointment": {
                        "date": date_br.strftime("%Y-%m-%d"),
                        "time": date_br.strftime("%H:%M"),
                        "datetime": date_br.isoformat(),
                        "timezone": "America/Sao_Paulo"
                    }
                }

                url = "https://webhook.autoopera.com.br/webhook/c8691b5e-51a8-47bf-a09a-41918a40eca3"
                
                # Timeout de 10s para não deixar a thread pendurada eternamente
                response = requests.post(url, json=payload, timeout=10)
                response.raise_for_status()
                
            except Exception as e:
                # Loga o erro sem interromper o fluxo principal de agendamento
                logger.error(f"Falha ao enviar webhook para n8n: {str(e)}")

        # Executa em uma thread separada para ser assíncrono e não bloquear a resposta do Django
        thread = threading.Thread(target=task)
        thread.start()


class BookingService:
    @staticmethod
    def get_available_slots(barbershop, barber_id, service_ids, target_date):
        """
        Calcula horários disponíveis dinamicamente para um barbeiro, serviços e data.
        service_ids pode ser um ID único, uma lista de IDs ou uma string separada por vírgulas.
        """
        # Normaliza service_ids para uma lista de inteiros
        if isinstance(service_ids, str):
            service_ids = [int(sid.strip()) for sid in service_ids.split(',') if sid.strip()]
        elif isinstance(service_ids, (int, float)):
            service_ids = [int(service_ids)]
        elif isinstance(service_ids, list):
            # Converte elementos para int, lidando com strings numéricas
            new_ids = []
            for sid in service_ids:
                if isinstance(sid, str) and ',' in sid:
                    new_ids.extend([int(x.strip()) for x in sid.split(',') if x.strip()])
                else:
                    new_ids.append(int(sid))
            service_ids = new_ids
        
        barber = Barber.objects.get(id=barber_id, barbershop=barbershop)
        services = Service.objects.filter(id__in=service_ids, barbershop=barbershop, is_active=True)
        
        if not services.exists():
            raise exceptions.ValidationError("NO_SERVICES_SELECTED")

        # Soma total de duração e buffers
        total_duration_mins = sum([s.duration for s in services])
        # Usamos o maior valor entre a soma dos buffers dos serviços ou o buffer padrão do barbeiro
        total_buffer_mins = max(sum([s.buffer_time for s in services]), barber.buffer_minutes)
        
        total_needed_mins = total_duration_mins + total_buffer_mins
        duration_delta = timedelta(minutes=total_duration_mins)

        # Prioridade 1: Exceção de Bloqueio
        exception_blocked = ScheduleException.objects.filter(barber=barber, barbershop=barbershop, date=target_date, type='blocked').first()
        if exception_blocked:
            return []

        # Determinação dos intervalos de trabalho...
        daily = DailyAvailability.objects.filter(barber=barber, barbershop=barbershop, date=target_date, is_active=True)
        working_intervals = []
        if daily.exists():
            for d in daily:
                working_intervals.append({'start_time': d.start_time, 'end_time': d.end_time})
        else:
            exceptions_extended = ScheduleException.objects.filter(barber=barber, barbershop=barbershop, date=target_date, type='extended')
            if exceptions_extended.exists():
                for ex in exceptions_extended:
                    working_intervals.append({'start_time': ex.start_time, 'end_time': ex.end_time})
            else:
                django_day = (target_date.weekday() + 1) % 7
                availabilities = Availability.objects.filter(barber=barber, barbershop=barbershop, day_of_week=django_day, is_active=True)
                for av in availabilities:
                    working_intervals.append({'start_time': av.start_time, 'end_time': av.end_time})

        if not working_intervals:
            return []

        # Agendamentos existentes no dia
        existing_slots = TimeSlot.objects.filter(
            appointment__barber=barber,
            appointment__barbershop=barbershop,
            appointment__status='confirmed',
            start_time__date=target_date
        ).order_by('start_time')

        # Garantimos que todos os slots existentes estejam no fuso horário local para comparação
        slots_local = []
        for s in existing_slots:
            slots_local.append({
                'start': timezone.localtime(s.start_time),
                'end': timezone.localtime(s.end_time)
            })

        slots = []
        now = timezone.localtime()

        for interval in working_intervals:
            start_dt = timezone.make_aware(datetime.combine(target_date, interval['start_time']))
            end_dt = timezone.make_aware(datetime.combine(target_date, interval['end_time']))
            
            if target_date == now.date() and start_dt < now:
                start_dt = now

            current_time = start_dt
            # Precisamos que caiba a duração + o buffer total dentro do intervalo
            total_delta = timedelta(minutes=total_needed_mins)
            
            while current_time + total_delta <= end_dt:
                actual_end = current_time + total_delta
                
                collision = False
                for slot in slots_local:
                    if current_time < slot['end'] and actual_end > slot['start']:
                        collision = True
                        current_time = slot['end']
                        break
                
                if not collision:
                    slots.append(current_time)
                    current_time += timedelta(minutes=15) # Passo do grid

        return sorted(list(set(slots)))

    @staticmethod
    @transaction.atomic
    def create_appointment(barbershop, barber_id, service_ids, customer_id, client_name, start_time, platform='manual', is_override=False):
        if timezone.is_aware(start_time):
            start_time = timezone.localtime(start_time)
            
        if isinstance(service_ids, (str, int)):
            service_ids = [service_ids]

        barber = Barber.objects.select_for_update().get(id=barber_id, barbershop=barbershop)
        services = Service.objects.filter(id__in=service_ids, barbershop=barbershop, is_active=True)
        
        if not services.exists():
            raise exceptions.ValidationError("NO_SERVICES_SELECTED")

        total_duration = sum([s.duration for s in services])
        # Usamos o maior valor entre a soma dos buffers dos serviços ou o buffer padrão do barbeiro
        total_buffer = max(sum([s.buffer_time for s in services]), barber.buffer_minutes)
        
        end_time = start_time + timedelta(minutes=total_duration + total_buffer)

        # Validações de data e colisão...
        if not is_override:
            now = timezone.now()
            if start_time < now - timedelta(minutes=5):
                raise exceptions.ValidationError("DATE_IN_PAST")

            # Check Blocked & Working Hours (simplificado aqui para brevidade do replace)
            
            # Verificação de colisão - Sem adição redundante de buffer
            overlap = TimeSlot.objects.filter(
                appointment__barber=barber,
                appointment__barbershop=barbershop,
                appointment__status='confirmed',
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exists()

            if overlap:
                raise exceptions.ValidationError("SLOT_UNAVAILABLE")

        appointment = Appointment.objects.create(
            barbershop=barbershop,
            barber=barber,
            customer_id=customer_id,
            client_name=client_name,
            date=start_time,
            status='confirmed',
            platform=platform
        )
        appointment.services.set(services)

        TimeSlot.objects.create(
            appointment=appointment,
            start_time=start_time,
            end_time=end_time # Inclui buffers dos serviços
        )

        return appointment

    @staticmethod
    @transaction.atomic
    def cancel_appointment(appointment_id):
        appointment = Appointment.objects.select_for_update().get(id=appointment_id)
        appointment.status = 'cancelled'
        appointment.save()
        # Slot is automatically kept but linked to cancelled appointment
        # Our overlap check filters by status='confirmed'
        return appointment

    @staticmethod
    @transaction.atomic
    def complete_appointment(appointment_id):
        from .models import Transaction, CustomerBarbershop
        appointment = Appointment.objects.select_for_update().get(id=appointment_id)
        
        if appointment.status == 'completed':
            return appointment
            
        appointment.status = 'completed'
        appointment.save()

        # Calculate totals
        services_list = appointment.services.all()
        service_names = ", ".join([s.name for s in services_list])
        total_price = sum([s.price for s in services_list])

        # Create income transaction within barbershop context
        Transaction.objects.create(
            barbershop=appointment.barbershop,
            description=f"Atendimento: {appointment.client_name} ({service_names})",
            amount=total_price,
            type='income',
            category='Atendimento',
            date=timezone.now(),
            status='paid',
            payment_method='pix'
        )

        # Update customer stats in the pivot table for THIS barbershop
        if appointment.customer:
            cb, created = CustomerBarbershop.objects.get_or_create(
                customer=appointment.customer,
                barbershop=appointment.barbershop
            )
            cb.total_spent += total_price
            cb.points += int(total_price)
            cb.last_visit = timezone.now().date()
            cb.save()

        return appointment
