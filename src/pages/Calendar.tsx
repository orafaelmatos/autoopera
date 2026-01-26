
import React, { useState, useEffect } from 'react';
import { Availability, ScheduleException, Service, Appointment, DailyAvailability } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CalendarDays, 
  MessageCircle, 
  Smartphone,
  Info,
  X,
  CheckCircle2,
  ChevronRight,
  User,
  Scissors,
  Check
} from 'lucide-react';
import { appointmentsApi, scheduleExceptionsApi, transactionsApi, dailyAvailabilityApi } from '../api';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  barberId?: string;
  availability: Availability[];
  setAvailability: (a: Availability[]) => void;
  services: Service[];
  appointments: Appointment[];
  setAppointments: (a: Appointment[]) => void;
  exceptions: ScheduleException[];
  setExceptions: (e: ScheduleException[]) => void;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const AppointmentCard: React.FC<{ 
  apt: Appointment, 
  services: Service[], 
  onComplete: (id: string) => void,
  getStatusLabel: (s: string) => string
}> = ({ apt, services, onComplete, getStatusLabel }) => {
  const x = useMotionValue(0);
  const background = useTransform(x, [0, 100], ["rgba(15, 76, 92, 0)", "#E67E22"]);
  const opacity = useTransform(x, [0, 100], [0, 1]);
  const scale = useTransform(x, [0, 100], [0.8, 1]);

  return (
    <div className="relative group overflow-hidden rounded-[28px] bg-[#F5F5F5] shadow-sm">
      {/* Background Action */}
      <motion.div 
        style={{ background, opacity }}
        className="absolute inset-0 flex items-center pl-8 text-white font-black italic uppercase gap-3 z-0"
      >
        <motion.div style={{ scale }}>
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-cta shadow-xl">
            <Check size={24} strokeWidth={3} />
          </div>
        </motion.div>
        <span className="text-xs tracking-widest font-title">Finalizar Elite</span>
      </motion.div>

      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 140 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) {
            onComplete(apt.id);
          }
        }}
        style={{ x }}
        className="relative z-10 bg-white border border-[#E5E5E5] p-5 sm:p-6 flex items-center justify-between hover:bg-white/80 transition-all cursor-grab active:cursor-grabbing shadow-[0_4px_20px_-4px_rgba(15,76,92,0.05)] rounded-[28px]"
      >
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-primary text-white shadow-lg shadow-primary/20">
            <span className="text-[8px] sm:text-[9px] font-black uppercase mb-0.5 opacity-60 font-title tracking-wider">{new Date(apt.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
            <span className="text-base sm:text-lg font-black italic tracking-tight leading-none font-title">{new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div>
            <h4 className="text-lg sm:text-xl font-black italic uppercase text-primary tracking-tight font-title">{apt.clientName}</h4>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-2 text-primary/40 font-black italic text-[9px] sm:text-[10px] uppercase tracking-wider font-title">
              <span className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 whitespace-nowrap">
                <Scissors size={12} className="text-primary/60" /> 
                {services.find(s => s.id === apt.serviceId)?.name || 'Serviço'}
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap opacity-80">
                <CalendarDays size={12} className="text-primary/60" /> 
                {new Date(apt.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className={`px-4 sm:px-6 py-2 rounded-full text-[9px] sm:text-[10px] font-black italic uppercase tracking-[0.15em] border font-title transition-all ${
            apt.status === 'confirmed' 
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
              : 'bg-background text-text/30 border-border'
          }`}>
            {getStatusLabel(apt.status)}
          </span>
          <div className="p-2.5 bg-background rounded-full text-primary/20 group-hover:text-cta group-hover:bg-cta/5 transition-all">
            <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const CalendarView: React.FC<Props> = ({ 
  barberId,
  availability, 
  setAvailability, 
  services, 
  appointments, 
  setAppointments,
  exceptions,
  setExceptions
}) => {
  const [isAddingException, setIsAddingNew] = useState(false);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [aptError, setAptError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Daily availability (per-date shifts)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [dailyShifts, setDailyShifts] = useState<Array<{startTime:string,endTime:string,isActive:boolean,id?:string}>>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);

  useEffect(() => {
    // load daily availability for selected date
    let mounted = true;
    const load = async () => {
      setLoadingDaily(true);
      try {
        const res = await dailyAvailabilityApi.getForDate(selectedDate);
        if (!mounted) return;
        setDailyShifts(res.map((d: DailyAvailability) => ({ startTime: d.startTime, endTime: d.endTime, isActive: d.isActive, id: d.id })));
      } catch (e) {
        setDailyShifts([]);
      } finally {
        setLoadingDaily(false);
      }
    };
    load();
    return () => { mounted = false };
  }, [selectedDate]);

  // Estados para nova exceção
  const [excDate, setExcDate] = useState('');
  const [excType, setExcType] = useState<'extended' | 'blocked'>('blocked');
  const [excStart, setExcStart] = useState('08:00');
  const [excEnd, setExcEnd] = useState('22:00');
  const [excReason, setExcReason] = useState('');

  // Estados para novo agendamento
  const [aptName, setAptName] = useState('');
  const [aptPhone, setAptPhone] = useState('');
  const [aptService, setAptService] = useState(services[0]?.id || '');
  const [aptDate, setAptDate] = useState(new Date().toLocaleDateString('en-CA')); // Formato YYYY-MM-DD local
  const [aptTime, setAptTime] = useState('09:00');
  const [aptOverride, setAptOverride] = useState(false);

  const handleAddAppointment = async () => {
    if (!aptName || !aptService || !aptDate || !aptTime) return;
    setAptError(null);
    try {
      const entry = await appointmentsApi.create({
        clientName: aptName,
        clientPhone: aptPhone,
        serviceId: aptService,
        barberId: barberId,
        date: `${aptDate}T${aptTime}:00`,
        status: 'confirmed',
        platform: 'manual',
        isOverride: aptOverride
      } as any);
      setAppointments([...appointments, entry]);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsAddingAppointment(false);
        setAptName('');
        setAptPhone('');
        setAptOverride(false);
      }, 2000);

    } catch (error: any) {
      console.error("Erro ao adicionar agendamento:", error);
      const backendError = error.response?.data?.error;
      const errorMessages: Record<string, string> = {
        'OUT_OF_WORKING_HOURS': 'O barbeiro não atende neste horário ou dia.',
        'SLOT_UNAVAILABLE': 'Este horário já está ocupado.',
        'LUNCH_BREAK': 'O barbeiro está em horário de almoço.',
        'DATE_IN_PAST': 'Não é possível agendar no passado.',
        'DATE_BLOCKED': 'Este dia está bloqueado.',
      };
      setAptError(errorMessages[backendError] || 'Erro ao agendar. Verifique os dados.');
    }
  };

const handleCompleteAppointment = async (id: string) => {
    try {
      const updated = await appointmentsApi.complete(id);
      setAppointments(appointments.map(a => a.id === id ? updated : a));
      toast.success("Atendimento concluído e saldo registrado!");
    } catch (error) {
      console.error("Erro ao concluir:", error);
      toast.error("Erro ao concluir atendimento.");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const activeAppointments = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-12 animate-fadeIn max-w-[1200px] mx-auto pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-primary font-title mb-2">
            Minha <span className="text-cta">Agenda</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-12 bg-cta/30 rounded-full" />
            <p className="text-primary/60 font-black italic text-xs sm:text-sm uppercase tracking-widest font-title">Fluxo de Elite</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:flex gap-4">
          <button 
            onClick={() => setIsAddingAppointment(true)}
            className="bg-cta text-white px-8 sm:px-10 py-5 sm:py-6 rounded-[24px] text-xs sm:text-sm font-black italic uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#D35400] transition-all shadow-[0_20px_40px_-10px_rgba(230,126,34,0.3)] active:scale-95 font-title group"
          >
            <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12 px-4">
        {/* Main Column: Appointments */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-primary font-title flex items-center gap-3">
              <div className="w-2 h-8 bg-cta rounded-full" />
              Próximos Horários
            </h3>
            <span className="text-[10px] font-black italic uppercase tracking-[0.2em] text-white bg-primary px-5 py-2.5 rounded-full border border-primary shadow-lg shadow-primary/20 font-title">
              {activeAppointments.length} Ativos
            </span>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {activeAppointments.map(apt => (
              <AppointmentCard 
                key={apt.id}
                apt={apt}
                services={services}
                onComplete={handleCompleteAppointment}
                getStatusLabel={getStatusLabel}
              />
            ))}
            {activeAppointments.length === 0 && (
              <div className="text-center py-28 bg-white border-2 border-dashed border-primary/10 rounded-[40px] text-primary/30 text-sm font-black italic uppercase tracking-widest font-title flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
                  <CalendarDays size={40} className="text-primary/10" />
                </div>
                Nenhum agendamento ativo
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingAppointment && (
          <div className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              className="bg-white border border-primary/10 w-full max-w-lg rounded-[48px] p-8 sm:p-12 shadow-[0_32px_64px_-12px_rgba(15,76,92,0.5)] relative max-h-[95vh] overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => setIsAddingAppointment(false)}
                className="absolute top-8 right-8 p-3 bg-background rounded-full text-primary/40 hover:text-cta hover:bg-cta/5 transition-all"
              >
                <X size={24} strokeWidth={3} />
              </button>

              {showSuccess ? (
                <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-[40px] flex items-center justify-center text-cta mb-8 border border-primary/10 shadow-inner">
                    <CheckCircle2 size={56} className="animate-bounce" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black italic uppercase text-primary mb-3 font-title tracking-tighter">Agendado!</h3>
                  <p className="text-primary/40 font-black italic uppercase text-[10px] tracking-[0.2em] font-title">Reserva Confirmada no Fluxo</p>
                </div>
              ) : (
                <>
                  <div className="mb-10 text-center sm:text-left">
                    <h3 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-primary mb-3 font-title">Novo <span className="text-cta">Horário</span></h3>
                    <p className="text-primary/40 text-xs font-black italic uppercase tracking-widest font-title">Entrada manual no sistema de elite</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black italic text-primary/40 tracking-[0.2em] ml-4 font-title">Nome do Cliente</label>
                      <div className="relative">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20" size={20} strokeWidth={2.5} />
                        <input type="text" value={aptName} onChange={e => setAptName(e.target.value)} placeholder="JOÃO SILVA" className="w-full bg-background border-2 border-transparent rounded-[24px] pl-14 pr-6 py-4 sm:py-5 text-primary focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 font-black italic uppercase text-sm font-title" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black italic text-primary/40 tracking-[0.2em] ml-4 font-title">WhatsApp Especial</label>
                      <div className="relative">
                        <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20" size={20} strokeWidth={2.5} />
                        <input type="text" value={aptPhone} onChange={e => setAptPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full bg-background border-2 border-transparent rounded-[24px] pl-14 pr-6 py-4 sm:py-5 text-primary focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 font-black italic uppercase text-sm font-title" />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black italic text-primary/40 tracking-[0.2em] ml-4 font-title">Serviço Selecionado</label>
                       <select value={aptService} onChange={e => setAptService(e.target.value)} className="w-full bg-background border-2 border-transparent rounded-[24px] px-6 py-4 sm:py-5 text-primary focus:border-cta/20 focus:bg-white outline-none transition-all font-black italic uppercase text-sm font-title appearance-none cursor-pointer">
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} — R$ {s.price}</option>)}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black italic text-primary/40 tracking-[0.2em] ml-4 font-title">Data Elite</label>
                        <input type="date" value={aptDate} onChange={e => setAptDate(e.target.value)} className="w-full bg-background border-2 border-transparent rounded-[24px] px-6 py-4 sm:py-5 text-primary focus:border-cta/20 focus:bg-white outline-none transition-all font-black italic uppercase text-xs font-title" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black italic text-primary/40 tracking-[0.2em] ml-4 font-title">Horário</label>
                        <input type="time" value={aptTime} onChange={e => setAptTime(e.target.value)} className="w-full bg-background border-2 border-transparent rounded-[24px] px-6 py-4 sm:py-5 text-primary focus:border-cta/20 focus:bg-white outline-none transition-all font-black italic uppercase text-xs font-title" />
                      </div>
                    </div>

                    {aptError && (
                      <div className="bg-red-50 border border-red-100 p-5 rounded-[24px] flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                          <AlertCircle size={20} strokeWidth={3} />
                        </div>
                        <p className="text-[11px] text-red-500 font-black italic uppercase tracking-wider font-title leading-tight">{aptError}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 mt-12">
                    <button 
                      onClick={handleAddAppointment} 
                      className="w-full py-5 sm:py-6 bg-cta text-white rounded-[24px] font-black italic uppercase tracking-[0.3em] hover:bg-[#D35400] transition-all shadow-[0_20px_40px_-10px_rgba(230,126,34,0.3)] active:scale-[0.98] font-title text-xs"
                    >
                      Confirmar Agenda
                    </button>
                    <button 
                      onClick={() => setIsAddingAppointment(false)} 
                      className="w-full py-4 text-primary/40 hover:text-primary font-black italic uppercase tracking-[0.2em] transition-all text-[10px] font-title"
                    >
                      Cancelar Operação
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
