
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
  Check,
  QrCode
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
  onCancel: (id: string) => void,
  onConfirmPayment: (id: string) => void,
  getStatusLabel: (s: string) => string
}> = ({ apt, services, onComplete, onCancel, onConfirmPayment, getStatusLabel }) => {
  const x = useMotionValue(0);

  const handleWhatsAppReminder = () => {
    const dateObj = new Date(apt.date);
    const dateStr = dateObj.toLocaleDateString('pt-BR');
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const message = `Olá ${apt.clientName}!\n\nEste é um lembrete do seu horário na barbearia.\n\nData: ${dateStr}\nHorário: ${timeStr}\n\nQualquer imprevisto é só avisar.\nTe esperamos!`;
    
    const rawPhone = apt.clientPhone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    
    if (!cleanPhone) {
      toast.error("Este agendamento não possui telefone do cliente.");
      return;
    }

    const finalPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const url = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
    
    toast.success("Abrindo WhatsApp...");
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const bgComplete = useTransform(x, [0, 100], ["rgba(39, 174, 96, 0)", "#27AE60"]);
  const bgCancel = useTransform(x, [0, -100], ["rgba(231, 76, 60, 0)", "#E74C3C"]);

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-primary/5">
      {/* Ações de Swipe de fundo */}
      <motion.div style={{ backgroundColor: bgComplete }} className="absolute inset-x-0 inset-y-0 flex items-center pl-8 text-white z-0">
        <Check size={28} strokeWidth={3} />
      </motion.div>
      <motion.div style={{ backgroundColor: bgCancel }} className="absolute inset-x-0 inset-y-0 flex items-center justify-end pr-8 text-white z-0">
        <Trash2 size={28} strokeWidth={3} />
      </motion.div>

      <motion.div 
        drag="x"
        dragConstraints={{ left: -140, right: 140 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) onComplete(apt.id);
          else if (info.offset.x < -100) onCancel(apt.id);
        }}
        style={{ x }}
        className="relative z-10 bg-white p-5 sm:p-7 flex items-center gap-4 sm:gap-6 cursor-grab active:cursor-grabbing"
      >
        {/* Horário e Dia */}
        <div className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[90px] h-[70px] sm:h-[90px] rounded-3xl bg-primary/5 border border-primary/5">
          <span className="text-[10px] font-black uppercase text-primary/40 font-title tracking-wider mb-1">
            {new Date(apt.date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
          </span>
          <span className="text-xl sm:text-2xl font-black italic text-primary leading-none font-title">
            {new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Informações Centrais */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="text-base sm:text-xl font-black italic uppercase text-primary truncate font-title tracking-tight">
              {apt.clientName}
            </h4>
            {apt.payment_status === 'PAID' && (
               <div className="w-2 h-2 rounded-full bg-green-500" title="Pago" />
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary/60 text-[9px] font-black italic uppercase font-title border border-primary/5">
              <Scissors size={10} />
              {apt.service_names || 'Serviço'}
            </span>
            
            {apt.payment_status === 'WAITING_PAYMENT' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cta/10 text-cta text-[9px] font-black italic uppercase font-title border border-cta/10">
                <QrCode size={10} />
                Pendente Pix
              </span>
            )}
          </div>
        </div>

        {/* Ações Visíveis */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleWhatsAppReminder}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-95"
            title="Lembrete WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>
          
          <div className="hidden sm:flex items-center gap-2 border-l border-primary/5 pl-2 ml-2">
            {apt.payment_status === 'WAITING_PAYMENT' && (
               <button onClick={() => onConfirmPayment(apt.id)} className="p-3 text-cta hover:bg-cta/5 rounded-xl transition-all" title="Confirmar Pix">
                 <CheckCircle2 size={20} />
               </button>
            )}
            <button onClick={() => onComplete(apt.id)} className="p-3 text-[#27AE60] hover:bg-green-50 rounded-xl transition-all" title="Concluir">
              <Check size={22} strokeWidth={3} />
            </button>
          </div>

          {/* Indicador de Swipe (Mobile Only) */}
          <div className="sm:hidden flex flex-col gap-1 items-center opacity-20">
             <ChevronRight size={14} strokeWidth={4} className="animate-pulse" />
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
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
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
  const [aptServices, setAptServices] = useState<string[]>([]);
  const [aptDate, setAptDate] = useState(new Date().toLocaleDateString('en-CA')); // Formato YYYY-MM-DD local
  const [aptTime, setAptTime] = useState('09:00');
  const [aptOverride, setAptOverride] = useState(false);

  const handleAddAppointment = async () => {
    if (!aptName || aptServices.length === 0 || !aptDate || !aptTime) return;
    setAptError(null);
    try {
      const entry = await appointmentsApi.create({
        clientName: aptName,
        clientPhone: aptPhone,
        serviceIds: aptServices,
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
        setAptServices([]);
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
      toast.success("Atendimento concluído!");
    } catch (error) {
      console.error("Erro ao concluir:", error);
      toast.error("Erro ao concluir.");
    }
  };

  const handleConfirmPayment = async (id: string) => {
    try {
      const updated = await appointmentsApi.confirmPayment(id);
      setAppointments(appointments.map(a => a.id === id ? updated : a));
      toast.success("Pagamento confirmado!");
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      toast.error("Erro ao confirmar.");
    }
  };

  const handleCancelAppointment = (id: string) => {
    setConfirmCancelId(id);
  };

  const confirmCancel = async () => {
    if (!confirmCancelId) return;
    try {
      await appointmentsApi.delete(confirmCancelId);
      setAppointments(appointments.filter(a => a.id !== confirmCancelId));
      toast.success("Cancelado.");
      setConfirmCancelId(null);
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      toast.error("Erro ao cancelar.");
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
    <div className="space-y-10 sm:space-y-16 animate-fadeIn max-w-[1200px] mx-auto pb-32 pt-4 px-4">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter text-primary font-title leading-none">
              Minha <span className="text-cta">Agenda</span>
            </h2>
            <p className="text-primary/30 font-black italic text-[9px] sm:text-xs uppercase tracking-widest font-title mt-2 flex items-center gap-2">
              <span className="w-6 h-[1px] bg-primary/20" /> Gestão de Fluxo
            </p>
          </div>
          
          <button 
            onClick={() => setIsAddingAppointment(true)}
            className="w-14 h-14 sm:w-auto sm:px-8 sm:h-16 rounded-[22px] bg-cta text-white flex items-center justify-center gap-3 hover:bg-cta/90 transition-all shadow-xl shadow-cta/20 active:scale-95 group"
          >
            <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            <span className="hidden sm:inline text-sm font-black italic uppercase tracking-wider font-title">Novo Horário</span>
          </button>
        </div>

        <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-2 rounded-[28px] border border-primary/5">
           <div className="flex items-center gap-4 pl-4">
              <div className="w-1.5 h-6 bg-cta rounded-full" />
              <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-primary font-title">
                Próximos Clientes
              </h3>
           </div>
           <div className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black italic uppercase font-title tracking-widest shadow-lg shadow-primary/10">
              {activeAppointments.length} Ativos
           </div>
        </div>
      </header>

      <div className="space-y-4 sm:space-y-6">
        {activeAppointments.map(apt => (
          <AppointmentCard 
            key={apt.id}
            apt={apt}
            services={services}
            onComplete={handleCompleteAppointment}
            onCancel={handleCancelAppointment}
            onConfirmPayment={handleConfirmPayment}
            getStatusLabel={getStatusLabel}
          />
        ))}
        
        {activeAppointments.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[40px] border-2 border-dashed border-primary/5">
            <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary/10 mb-4">
              <CalendarDays size={40} />
            </div>
            <p className="text-primary/30 text-xs font-black italic uppercase tracking-widest font-title">Agenda Vazia hoje</p>
          </div>
        )}
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
                    <p className="text-primary/40 text-xs font-black italic uppercase tracking-widest font-title">Entrada manual no sistema profissional</p>
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

                    <div className="space-y-3">
                       <label className="text-[10px] uppercase font-black italic text-primary/40 tracking-[0.2em] ml-4 font-title">Serviços Selecionados</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                          {services.map(s => {
                            const isSelected = aptServices.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setAptServices(aptServices.filter(id => id !== s.id));
                                  } else {
                                    setAptServices([...aptServices, s.id]);
                                  }
                                }}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                                  isSelected 
                                    ? 'bg-primary border-primary text-white shadow-lg' 
                                    : 'bg-background border-transparent text-primary hover:border-primary/10'
                                }`}
                              >
                                <span className="text-[10px] font-black italic uppercase tracking-tight font-title truncate mr-2">{s.name}</span>
                                <span className={`text-[10px] font-black italic font-title ${isSelected ? 'text-white' : 'text-cta'}`}>R$ {s.price}</span>
                              </button>
                            );
                          })}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black italic text-primary/40 tracking-[0.2em] ml-4 font-title">Data Selecionada</label>
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

        {/* Modal Profissional de Confirmação de Cancelamento */}
        {confirmCancelId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setConfirmCancelId(null)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[400px] bg-white rounded-[32px] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-primary/5"
            >
              {/* Decorativo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16" />
              
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center text-red-500 mx-auto mb-6">
                  <AlertCircle size={40} strokeWidth={2.5} />
                </div>
                
                <h3 className="text-2xl font-black italic uppercase text-primary font-title tracking-tighter mb-2">Cancelar Horário?</h3>
                <p className="text-primary/40 text-xs font-black italic uppercase tracking-widest font-title mb-8 leading-relaxed">
                  Esta ação irá liberar o slot na agenda e não pode ser desfeita.
                </p>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmCancel}
                    className="w-full py-5 bg-red-500 text-white rounded-[20px] font-black italic uppercase tracking-[0.2em] text-xs hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] font-title"
                  >
                    Confirmar Cancelamento
                  </button>
                  <button 
                    onClick={() => setConfirmCancelId(null)}
                    className="w-full py-4 text-primary/40 hover:text-primary font-black italic uppercase tracking-[0.2em] text-[10px] transition-all font-title"
                  >
                    Voltar / Manter Agenda
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
