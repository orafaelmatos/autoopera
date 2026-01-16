from datetime import datetime, timedelta, time
from django.db import transaction
from django.utils import timezone
from django.db.models import Q
from rest_framework import exceptions
from .models import Appointment, TimeSlot, Service, Barber, Availability, ScheduleException

class BookingService:
    @staticmethod
    def get_available_slots(barber_id, service_id, target_date):
        """
        Calcula horários disponíveis dinamicamente para um barbeiro, serviço e data.
        Considera Jornada Semanal e Exceções (Bloqueios e Horários Estendidos).
        """
        barber = Barber.objects.get(id=barber_id)
        service = Service.objects.get(id=service_id)
        
        if not service.is_active:
            raise exceptions.ValidationError("SERVICE_INACTIVE")

        # Prioridade 1: Exceção de Bloqueio
        exception_blocked = ScheduleException.objects.filter(barber=barber, date=target_date, type='blocked').first()
        if exception_blocked:
            return []

        # Prioridade 2: Exceção de Horário Estendido (Substitui a jornada semanal)
        exception_extended = ScheduleException.objects.filter(barber=barber, date=target_date, type='extended').first()
        
        start_time = None
        end_time = None
        lunch_start = None
        lunch_end = None

        if exception_extended:
            start_time = exception_extended.start_time
            end_time = exception_extended.end_time
        else:
            # Caso não haja horário estendido, busca jornada semanal padrão
            django_day = (target_date.weekday() + 1) % 7
            availability = Availability.objects.filter(barber=barber, day_of_week=django_day, is_active=True).first()
            if not availability:
                return []
            start_time = availability.start_time
            end_time = availability.end_time
            lunch_start = availability.lunch_start
            lunch_end = availability.lunch_end

        # Working range definitions
        start_datetime = timezone.make_aware(datetime.combine(target_date, start_time))
        end_datetime = timezone.make_aware(datetime.combine(target_date, end_time))
        
        # If today, don't show past times
        now = timezone.localtime()
        if target_date == now.date():
            if start_datetime < now:
                start_datetime = now

        # Lunch break (only if using standard availability or if extended journey doesn't explicitly override it)
        lunch_start_dt = None
        lunch_end_dt = None
        if lunch_start and lunch_end:
            lunch_start_dt = timezone.make_aware(datetime.combine(target_date, lunch_start))
            lunch_end_dt = timezone.make_aware(datetime.combine(target_date, lunch_end))

        # Existing appointments
        existing_slots = TimeSlot.objects.filter(
            appointment__barber=barber,
            appointment__status='confirmed',
            start_time__date=target_date
        ).order_by('start_time')

        slots = []
        current_time = start_datetime
        
        duration = timedelta(minutes=service.duration)
        buffer = timedelta(minutes=barber.buffer_minutes)

        while current_time + duration <= end_datetime:
            actual_end = current_time + duration
            
            # Check overlap with lunch
            overlaps_lunch = False
            if lunch_start_dt and lunch_end_dt:
                if current_time < lunch_end_dt and actual_end > lunch_start_dt:
                    overlaps_lunch = True
            
            if overlaps_lunch:
                current_time = lunch_end_dt
                continue

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

        return slots

    @staticmethod
    @transaction.atomic
    def create_appointment(barber_id, service_id, customer_id, client_name, start_time, platform='manual', is_override=False):
        # Ensure we are working with local time for day of week and working hours logic
        if timezone.is_aware(start_time):
            start_time = timezone.localtime(start_time)
            
        # 1. Select for update barber to avoid concurrency
        barber = Barber.objects.select_for_update().get(id=barber_id)
        service = Service.objects.get(id=service_id)
        
        if not service.is_active:
            raise exceptions.ValidationError("SERVICE_INACTIVE")

        # 2. Basic date check (cannot book in the past unless override?)
        # Let's keep past check even with override for data integrity, 
        # but maybe the user wants to log something that happened 10 mins ago.
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
            exception_blocked = ScheduleException.objects.filter(barber=barber, date=start_time.date(), type='blocked').exists()
            if exception_blocked:
                raise exceptions.ValidationError("DATE_BLOCKED")

            # Determine working hours for the day
            exception_extended = ScheduleException.objects.filter(barber=barber, date=start_time.date(), type='extended').first()
            
            work_start = None
            work_end = None
            lunch_start = None
            lunch_end = None

            if exception_extended:
                work_start = timezone.make_aware(datetime.combine(start_time.date(), exception_extended.start_time))
                work_end = timezone.make_aware(datetime.combine(start_time.date(), exception_extended.end_time))
            else:
                django_day = (start_time.date().weekday() + 1) % 7
                availability = Availability.objects.filter(barber=barber, day_of_week=django_day, is_active=True).first()
                if not availability:
                    raise exceptions.ValidationError("OUT_OF_WORKING_HOURS")
                
                work_start = timezone.make_aware(datetime.combine(start_time.date(), availability.start_time))
                work_end = timezone.make_aware(datetime.combine(start_time.date(), availability.end_time))
                lunch_start = availability.lunch_start
                lunch_end = availability.lunch_end

            # Validate against range
            if start_time < work_start or end_time > work_end:
                raise exceptions.ValidationError("OUT_OF_WORKING_HOURS")

            # Lunch check
            if lunch_start and lunch_end:
                lunch_start_dt = timezone.make_aware(datetime.combine(start_time.date(), lunch_start))
                lunch_end_dt = timezone.make_aware(datetime.combine(start_time.date(), lunch_end))
                if start_time < lunch_end_dt and end_time > lunch_start_dt:
                    raise exceptions.ValidationError("LUNCH_BREAK")

        # 5. Check Overlap (Critical)
        # Even with override, overlap check is safer, but "encaixe" sometimes means purposeful overlap.
        # User said "criar encaixes" - usually this means ignoring the overlap error.
        if not is_override:
            overlap = TimeSlot.objects.filter(
                appointment__barber=barber,
                appointment__status='confirmed',
                start_time__lt=end_time + buffer,
                end_time__gt=start_time - buffer
            ).exists()

            if overlap:
                raise exceptions.ValidationError("SLOT_UNAVAILABLE")

        # 6. Create Appointment and Slot
        appointment = Appointment.objects.create(
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
        from .models import Transaction
        appointment = Appointment.objects.select_for_update().get(id=appointment_id)
        
        if appointment.status == 'completed':
            return appointment
            
        appointment.status = 'completed'
        appointment.save()

        # Create income transaction
        Transaction.objects.create(
            description=f"Atendimento: {appointment.client_name} ({appointment.service.name})",
            amount=appointment.service.price,
            type='income',
            category='Atendimento',
            date=timezone.now(),
            status='paid',
            payment_method='pix' # Defaulting to pix, can be updated later if needed
        )

        # Update customer stats if possible
        if appointment.customer:
            customer = appointment.customer
            customer.total_spent += appointment.service.price
            # Add points: R$ 1,00 = 1 point (simple rule for now)
            customer.points += int(appointment.service.price)
            customer.save()

        return appointment
