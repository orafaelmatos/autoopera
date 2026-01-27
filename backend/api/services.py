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
                        "phone": appointment.barbershop.phone or appointment.barber.phone or ""
                    },
                    "client": {
                        "name": appointment.client_name,
                        "phone": getattr(appointment.customer, 'phone', None) or ""
                    },
                    "service": {
                        "name": appointment.service.name
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
    def get_available_slots(barbershop, barber_id, service_id, target_date):
        """
        Calcula horários disponíveis dinamicamente para um barbeiro, serviço e data.
        Considera Jornada Semanal e Exceções (Bloqueios e Horários Estendidos).
        """
        barber = Barber.objects.get(id=barber_id, barbershop=barbershop)
        service = Service.objects.get(id=service_id, barbershop=barbershop)
        
        if not service.is_active:
            raise exceptions.ValidationError("SERVICE_INACTIVE")

        # Prioridade 1: Exceção de Bloqueio
        exception_blocked = ScheduleException.objects.filter(barber=barber, barbershop=barbershop, date=target_date, type='blocked').first()
        if exception_blocked:
            return []

        # Prioridade 2: DailyAvailability (configuração pontual do barbeiro)
        daily = DailyAvailability.objects.filter(barber=barber, barbershop=barbershop, date=target_date, is_active=True)
        working_intervals = []

        if daily.exists():
            for d in daily:
                working_intervals.append({
                    'start_time': d.start_time,
                    'end_time': d.end_time
                })
        else:
            # Em seguida, exceções de Horário Estendido (substituem a jornada semanal para este dia)
            exceptions_extended = ScheduleException.objects.filter(
                barber=barber, barbershop=barbershop, date=target_date, type='extended'
            )
            if exceptions_extended.exists():
                for ex in exceptions_extended:
                    working_intervals.append({
                        'start_time': ex.start_time,
                        'end_time': ex.end_time
                    })
            else:
                # Caso não haja horário estendido, busca blocos da jornada semanal padrão
                django_day = (target_date.weekday() + 1) % 7
                availabilities = Availability.objects.filter(
                    barber=barber, barbershop=barbershop, day_of_week=django_day, is_active=True
                )
                for av in availabilities:
                    working_intervals.append({
                        'start_time': av.start_time,
                        'end_time': av.end_time
                    })

        if not working_intervals:
            return []

        # Existing appointments
        existing_slots = TimeSlot.objects.filter(
            appointment__barber=barber,
            appointment__barbershop=barbershop,
            appointment__status='confirmed',
            start_time__date=target_date
        ).order_by('start_time')

        slots = []
        duration = timedelta(minutes=service.duration)
        buffer = timedelta(minutes=barber.buffer_minutes)
        now = timezone.localtime()

        # Process each working interval
        for interval in working_intervals:
            start_dt = timezone.make_aware(datetime.combine(target_date, interval['start_time']))
            end_dt = timezone.make_aware(datetime.combine(target_date, interval['end_time']))
            
            # If today, don't show past times
            if target_date == now.date():
                if start_dt < now:
                    start_dt = now

            current_time = start_dt
            while current_time + duration <= end_dt:
                actual_end = current_time + duration
                
                # Check overlap with existing slots
                collision = False
                for slot in existing_slots:
                    if current_time < slot.end_time + buffer and actual_end + buffer > slot.start_time:
                        collision = True
                        current_time = slot.end_time + buffer
                        break
                
                if not collision:
                    slots.append(current_time)
                    current_time += timedelta(minutes=15) # Step for grid

        return sorted(list(set(slots))) # Ensure unique sorted slots

    @staticmethod
    @transaction.atomic
    def create_appointment(barbershop, barber_id, service_id, customer_id, client_name, start_time, platform='manual', is_override=False):
        # Ensure we are working with local time for day of week and working hours logic
        if timezone.is_aware(start_time):
            start_time = timezone.localtime(start_time)
            
        # 1. Select for update barber to avoid concurrency
        barber = Barber.objects.select_for_update().get(id=barber_id, barbershop=barbershop)
        service = Service.objects.get(id=service_id, barbershop=barbershop)
        
        if not service.is_active:
            raise exceptions.ValidationError("SERVICE_INACTIVE")

        # 2. Basic date check (cannot book in the past unless override?)
        now = timezone.now()
        if not is_override and start_time < now - timedelta(minutes=5): # 5 min grace
            raise exceptions.ValidationError("DATE_IN_PAST")

        # 3. Calculate end time
        duration = timedelta(minutes=service.duration)
        buffer = timedelta(minutes=barber.buffer_minutes)
        end_time = start_time + duration

        # 4. Jornada e Exceções (Skip if is_override)
        if not is_override:
            # Check Blocked
            exception_blocked = ScheduleException.objects.filter(barber=barber, barbershop=barbershop, date=start_time.date(), type='blocked').exists()
            if exception_blocked:
                raise exceptions.ValidationError("DATE_BLOCKED")

            # Determine working hours for the day
            # Primeiro, ver se há DailyAvailability para a data (sobrescreve jornada semanal)
            daily = DailyAvailability.objects.filter(barber=barber, barbershop=barbershop, date=start_time.date(), is_active=True)
            working_intervals = []
            if daily.exists():
                for d in daily:
                    working_intervals.append({
                        'start': timezone.make_aware(datetime.combine(start_time.date(), d.start_time)),
                        'end': timezone.make_aware(datetime.combine(start_time.date(), d.end_time))
                    })
            else:
                exceptions_extended = ScheduleException.objects.filter(
                    barber=barber, barbershop=barbershop, date=start_time.date(), type='extended'
                )
                if exceptions_extended.exists():
                    for ex in exceptions_extended:
                        working_intervals.append({
                            'start': timezone.make_aware(datetime.combine(start_time.date(), ex.start_time)),
                            'end': timezone.make_aware(datetime.combine(start_time.date(), ex.end_time))
                        })
                else:
                    django_day = (start_time.date().weekday() + 1) % 7
                    availabilities = Availability.objects.filter(
                        barber=barber, barbershop=barbershop, day_of_week=django_day, is_active=True
                    )
                    for av in availabilities:
                        working_intervals.append({
                            'start': timezone.make_aware(datetime.combine(start_time.date(), av.start_time)),
                            'end': timezone.make_aware(datetime.combine(start_time.date(), av.end_time))
                        })

            if not working_intervals:
                raise exceptions.ValidationError("NOT_WORKING_DAY")

            # Check if appointment fits in any of the working intervals
            fits = False
            for interval in working_intervals:
                if start_time >= interval['start'] and end_time <= interval['end']:
                    fits = True
                    break
            
            if not fits:
                raise exceptions.ValidationError("OUTSIDE_WORKING_HOURS")

        # 5. Check Overlap (Critical)
        if not is_override:
            overlap = TimeSlot.objects.filter(
                appointment__barber=barber,
                appointment__barbershop=barbershop,
                appointment__status='confirmed',
                start_time__lt=end_time + buffer,
                end_time__gt=start_time - buffer
            ).exists()

            if overlap:
                raise exceptions.ValidationError("SLOT_UNAVAILABLE")

        # 6. Create Appointment and Slot
        appointment = Appointment.objects.create(
            barbershop=barbershop,
            barber=barber,
            service=service,
            customer_id=customer_id,
            client_name=client_name,
            date=start_time,
            status='confirmed',
            platform=platform
        )

        TimeSlot.objects.create(
            appointment=appointment,
            start_time=start_time,
            end_time=end_time
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

        # Create income transaction within barbershop context
        Transaction.objects.create(
            barbershop=appointment.barbershop,
            description=f"Atendimento: {appointment.client_name} ({appointment.service.name})",
            amount=appointment.service.price,
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
            cb.total_spent += appointment.service.price
            cb.points += int(appointment.service.price)
            cb.last_visit = timezone.now().date()
            cb.save()

        return appointment
