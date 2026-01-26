
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
  const background = useTransform(x, [0, 100], ["rgba(28, 28, 30, 0)", "rgba(52, 199, 89, 0.2)"]);
  const opacity = useTransform(x, [0, 100], [0, 1]);
  const scale = useTransform(x, [0, 100], [0.5, 1]);

  return (
    <div className="relative group overflow-hidden rounded-[24px] sm:rounded-[32px] bg-black/20">
      {/* Background Action */}
      <motion.div 
        style={{ background, opacity }}
        className="absolute inset-0 flex items-center pl-8 text-[#34C759] font-bold gap-3"
      >
        <motion.div style={{ scale }}>
          <div className="w-10 h-10 rounded-full bg-[#34C759] flex items-center justify-center text-black">
            <Check size={20} strokeWidth={3} />
          </div>
        </motion.div>
        <span className="text-xs uppercase tracking-widest font-black">Concluir Atendimento</span>
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
        className="relative z-10 bg-[#1c1c1e] border border-white/5 p-3 sm:p-4 flex items-center justify-between hover:bg-[#232326] transition-colors cursor-grab active:cursor-grabbing backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-[18px] bg-black/60 border border-white/5 text-white/60 shadow-inner">
            <span className="text-[7px] sm:text-[8px] font-black uppercase mb-0.5 opacity-60">{new Date(apt.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
            <span className="text-sm sm:text-base font-bold tracking-tight leading-none">{new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">{apt.clientName}</h4>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1 text-white/40 font-bold text-[8px] sm:text-[9px] uppercase tracking-wider">
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 whitespace-nowrap shadow-sm">
                <Scissors size={10} className="text-white/20" /> 
                {services.find(s => s.id === apt.serviceId)?.name || 'Serviço'}
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap opacity-80">
                <CalendarDays size={10} className="text-white/20" /> 
                {new Date(apt.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className={`px-3 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${
            apt.status === 'confirmed' 
              ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20 shadow-[0_0_15px_rgba(52,199,89,0.1)]' 
              : 'bg-white/5 text-white/40 border-white/5'
          }`}>
            {getStatusLabel(apt.status)}
          </span>
          <div className="p-2 text-white/10 group-hover:text-white/30 transition-colors">
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
    <div className="space-y-8 animate-fadeIn max-w-[1200px] mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-1">Minha <span className="text-gray-500">Agenda</span></h2>
          <p className="text-gray-500 font-medium text-xs sm:text-base">Gerencie seus horários e atendimentos.</p>
        </div>
        <div className="grid grid-cols-1 sm:flex gap-3">
          <button 
            onClick={() => setIsAddingAppointment(true)}
            className="bg-accent text-white px-4 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-[11px] sm:text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0063CC] transition-all shadow-xl shadow-accent/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Agendar</span>
          </button>
        </div>
      </header>
      

      <div className="grid grid-cols-1 gap-8">
        {/* Main Column: Appointments */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">Próximos</h3>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-accent bg-accent/10 px-3 py-1 rounded-full">
              {activeAppointments.length} Ativos
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4">
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
              <div className="text-center py-20 bg-[#1c1c1e] border border-dashed border-white/5 rounded-[32px] text-gray-600 text-sm font-medium">
                Nenhum agendamento para os próximos dias.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals with AnimatePresence */}
      <AnimatePresence>
        {isAddingAppointment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-md rounded-[32px] p-6 sm:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsAddingAppointment(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              {showSuccess ? (
                <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/30">
                    <CheckCircle2 size={40} className="animate-bounce" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Agendado com Sucesso!</h3>
                  <p className="text-gray-500 font-medium">O cliente receberá uma confirmação.</p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">Novo Horário</h3>
                    <p className="text-gray-500 text-sm font-medium">Marque um horário manualmente na sua agenda.</p>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Nome do Cliente</label>
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                        <input type="text" value={aptName} onChange={e => setAptName(e.target.value)} placeholder="Ex: João Silva" className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all placeholder:text-gray-700 font-medium text-base" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">WhatsApp / Telefone</label>
                      <div className="relative">
                        <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                        <input type="text" value={aptPhone} onChange={e => setAptPhone(e.target.value)} placeholder="Ex: (11) 99999-9999" className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all placeholder:text-gray-700 font-medium text-base" />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Serviço</label>
                       <select value={aptService} onChange={e => setAptService(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all font-medium text-base">
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Data</label>
                        <input type="date" value={aptDate} onChange={e => setAptDate(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all font-medium text-base" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Horário</label>
                        <input type="time" value={aptTime} onChange={e => setAptTime(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all font-medium text-base" />
                      </div>
                    </div>

                    {aptError && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 items-center">
                        <AlertCircle className="text-red-500" size={16} />
                        <p className="text-[11px] text-red-500 font-bold uppercase">{aptError}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 mt-10">
                    <button 
                      onClick={handleAddAppointment} 
                      className="w-full py-4 sm:py-5 bg-accent text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-accent/20 active:scale-[0.98]"
                    >
                      Confirmar Horário
                    </button>
                    <button 
                      onClick={() => setIsAddingAppointment(false)} 
                      className="w-full py-3 text-gray-500 hover:text-white font-bold transition-colors text-sm uppercase tracking-[0.2em]"
                    >
                      Cancelar
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
