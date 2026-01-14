
import React, { useState } from 'react';
import { Availability, ScheduleException, WaitingListEntry, Service, Appointment } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CalendarDays, 
  ListOrdered, 
  MessageCircle, 
  Smartphone,
  Info,
  X,
  CheckCircle2,
  ChevronRight,
  User,
  Scissors
} from 'lucide-react';
import { waitingListApi, appointmentsApi, scheduleExceptionsApi } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  barberId?: string;
  availability: Availability[];
  setAvailability: (a: Availability[]) => void;
  waitingList: WaitingListEntry[];
  setWaitingList: React.Dispatch<React.SetStateAction<WaitingListEntry[]>>;
  services: Service[];
  appointments: Appointment[];
  setAppointments: (a: Appointment[]) => void;
  exceptions: ScheduleException[];
  setExceptions: (e: ScheduleException[]) => void;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const CalendarView: React.FC<Props> = ({ 
  barberId,
  availability, 
  setAvailability, 
  waitingList, 
  setWaitingList, 
  services, 
  appointments, 
  setAppointments,
  exceptions,
  setExceptions
}) => {
  const [isAddingException, setIsAddingNew] = useState(false);
  const [isAddingWaiting, setIsAddingWaiting] = useState(false);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [aptError, setAptError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Estados para nova exceção
  const [excDate, setExcDate] = useState('');
  const [excType, setExcType] = useState<'extended' | 'blocked'>('blocked');
  const [excStart, setExcStart] = useState('08:00');
  const [excEnd, setExcEnd] = useState('22:00');
  const [excReason, setExcReason] = useState('');

  // Estados para lista de espera
  const [waitName, setWaitName] = useState('');
  const [waitPhone, setWaitPhone] = useState('');
  const [waitService, setWaitService] = useState(services[0]?.id || '');
  const [waitPeriod, setWaitPeriod] = useState<'morning' | 'afternoon' | 'night' | 'any'>('any');

  // Estados para novo agendamento
  const [aptName, setAptName] = useState('');
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

  const handleAddWaiting = async () => {
    if (!waitName || !waitPhone) return;
    try {
      const entry = await waitingListApi.create({
        customerName: waitName,
        customerPhone: waitPhone,
        serviceId: waitService,
        date: new Date().toISOString().split('T')[0],
        preferredPeriod: waitPeriod,
      });
      setWaitingList([...waitingList, entry]);
      setIsAddingWaiting(false);
      setWaitName('');
      setWaitPhone('');
    } catch (error) {
      console.error("Erro ao adicionar na lista de espera:", error);
    }
  };

  const handleRemoveWaiting = async (id: string) => {
    try {
      await waitingListApi.delete(id);
      setWaitingList(waitingList.filter(w => w.id !== id));
    } catch (error) {
      console.error("Erro ao remover da lista de espera:", error);
    }
  };

  const activeAppointments = appointments
    .filter(a => a.status !== 'cancelled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-12 animate-fadeIn max-w-[1200px] mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white">Gestão de <span className="text-gray-500">Agenda</span></h2>
          <p className="text-gray-500 mt-2 font-medium">Controle seus horários e lista de espera inteligente.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAddingWaiting(true)}
            className="px-6 py-4 bg-white/5 text-gray-400 rounded-2xl border border-white/5 font-bold text-[13px] hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <ListOrdered size={18} />
            <span>Lista de Espera</span>
          </button>
          <button 
            onClick={() => setIsAddingAppointment(true)}
            className="bg-[#007AFF] text-white px-8 py-4 rounded-2xl text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#0063CC] transition-all shadow-xl shadow-[#007AFF]/20 active:scale-95"
          >
            <CalendarIcon size={18} />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column: Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold tracking-tight text-white">Próximos Agendamentos</h3>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#007AFF] bg-[#007AFF]/10 px-3 py-1 rounded-full">
              {activeAppointments.length} Ativos
            </span>
          </div>

          <div className="space-y-4">
            {activeAppointments.map(apt => (
              <motion.div 
                key={apt.id}
                whileHover={{ y: -2 }}
                className="bg-[#1c1c1e] border border-white/5 p-6 rounded-[32px] flex items-center justify-between group hover:bg-[#2c2c2e] transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-[20px] bg-black/40 border border-white/5 text-[#007AFF]">
                    <span className="text-[10px] font-black uppercase mb-1">{new Date(apt.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                    <span className="text-lg font-bold tracking-tight leading-none">{new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white tracking-tight">{apt.clientName}</h4>
                    <div className="flex items-center gap-3 mt-1 text-gray-500 font-medium text-[11px] uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Scissors size={12} /> {services.find(s => s.id === apt.serviceId)?.name || 'Serviço'}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700" />
                      <span className="flex items-center gap-1.5"><CalendarDays size={12} /> {new Date(apt.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    apt.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-[#007AFF]/10 text-[#007AFF]'
                  }`}>
                    {apt.status}
                  </span>
                  <button className="p-2 text-gray-600 hover:text-white transition-all bg-white/5 rounded-xl opacity-0 group-hover:opacity-100">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
            {activeAppointments.length === 0 && (
              <div className="text-center py-20 bg-[#1c1c1e] border border-dashed border-white/5 rounded-[32px] text-gray-600 text-sm font-medium">
                Nenhum agendamento para os próximos dias.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Waiting List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold tracking-tight text-white">Lista de Espera</h3>
          </div>

          <div className="space-y-4">
            {waitingList.map(entry => (
              <div key={entry.id} className="bg-[#1c1c1e] border border-white/5 p-5 rounded-[24px] flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                    {entry.customerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{entry.customerName}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                      {entry.preferredPeriod === 'any' ? 'Qualquer horário' : entry.preferredPeriod}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleRemoveWaiting(entry.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-[24px]">
              <div className="flex gap-3 items-center mb-3">
                <Info size={16} className="text-orange-500" />
                <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">Inteligência</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                A lista de espera é monitorada automaticamente. Se um horário surgir, notificaremos os clientes prioritários.
              </p>
            </div>
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
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-md rounded-[32px] p-10 shadow-2xl relative"
            >
              {showSuccess ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/30">
                    <CheckCircle2 size={40} className="animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Agendado com Sucesso!</h3>
                  <p className="text-gray-500 font-medium">O cliente receberá uma confirmação.</p>
                </div>
              ) : (
                <>
                  <div className="mb-10">
                    <h3 className="text-3xl font-bold tracking-tight text-white mb-2">Novo Agendamento</h3>
                    <p className="text-gray-500 font-medium">Marque um horário manualmente na sua agenda.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Nome do Cliente</label>
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                        <input type="text" value={aptName} onChange={e => setAptName(e.target.value)} placeholder="Ex: João Silva" className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all placeholder:text-gray-700 font-medium" />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Serviço</label>
                       <select value={aptService} onChange={e => setAptService(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium">
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Data</label>
                        <input type="date" value={aptDate} onChange={e => setAptDate(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Horário</label>
                        <input type="time" value={aptTime} onChange={e => setAptTime(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium" />
                      </div>
                    </div>

                    {aptError && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 items-center">
                        <AlertCircle className="text-red-500" size={16} />
                        <p className="text-[11px] text-red-500 font-bold uppercase">{aptError}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 mt-12">
                    <button 
                      onClick={handleAddAppointment} 
                      className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-[#007AFF]/20 active:scale-[0.98]"
                    >
                      Confirmar Horário
                    </button>
                    <button 
                      onClick={() => setIsAddingAppointment(false)} 
                      className="w-full py-4 text-gray-500 hover:text-white font-bold transition-colors text-sm uppercase tracking-[0.2em]"
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
