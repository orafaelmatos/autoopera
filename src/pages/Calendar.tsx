
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
  CheckCircle2
} from 'lucide-react';
import { waitingListApi, appointmentsApi, scheduleExceptionsApi } from '../api';

interface Props {
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
        date: `${aptDate}T${aptTime}:00`,
        status: 'confirmed',
        platform: 'manual',
        isOverride: aptOverride
      } as any);
      setAppointments([...appointments, entry]);
      
      // Mostrar animação de sucesso
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
        'SLOT_UNAVAILABLE': 'Este horário já está ocupado com outro cliente.',
        'LUNCH_BREAK': 'O barbeiro está em horário de almoço neste momento.',
        'DATE_IN_PAST': 'Não é possível agendar um horário no passado.',
        'DATE_NOT_ALLOWED': 'Data fora do período permitido para agendamentos.',
        'DATE_BLOCKED': 'Este dia está bloqueado para agendamentos.',
        'SERVICE_INACTIVE': 'Este serviço não está disponível no momento.'
      };

      setAptError(errorMessages[backendError] || 'Ocorreu um erro ao tentar agendar. Verifique os dados e tente novamente.');
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

  const handleAddException = async () => {
    if (!excDate || !excReason) return;
    try {
      const newExc = await scheduleExceptionsApi.create({
        date: excDate,
        type: excType,
        reason: excReason,
        ...(excType === 'extended' ? { startTime: excStart, endTime: excEnd } : {})
      });
      setExceptions([...exceptions, newExc]);
      setIsAddingNew(false);
      resetExcForm();
    } catch (error) {
      console.error("Erro ao adicionar exceção:", error);
    }
  };

  const handleRemoveException = async (id: string) => {
    try {
      await scheduleExceptionsApi.delete(id);
      setExceptions(exceptions.filter(e => e.id !== id));
    } catch (error) {
      console.error("Erro ao remover exceção:", error);
    }
  };

  const resetExcForm = () => {
    setExcDate('');
    setExcReason('');
    setExcType('blocked');
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Gestão de <span className="text-yellow-500">Agenda</span></h2>
          <p className="text-gray-400 mt-1">Sua lista de espera inteligente.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setIsAddingAppointment(true)}
            className="flex-1 sm:flex-none bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all font-oswald uppercase text-sm"
          >
            <CalendarIcon size={18} /> Agendar Horário
          </button>
           <button 
            onClick={() => setIsAddingWaiting(true)}
            className="flex-1 sm:flex-none bg-gray-900 border border-orange-500/30 text-orange-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-500/10 transition-all font-oswald uppercase text-sm"
          >
            <ListOrdered size={18} /> Lista de Espera
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Próximos Agendamentos */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-oswald font-bold uppercase flex items-center gap-2 text-white">
              <CalendarIcon className="text-yellow-500" size={20} /> Próximos Agendamentos
            </h3>
            <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase">{appointments.filter(a => a.status !== 'cancelled').length} Ativos</span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             {appointments
              .filter(a => a.status !== 'cancelled')
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(apt => (
               <div key={apt.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-black border border-gray-800 text-yellow-500">
                        <span className="text-[10px] font-bold uppercase">{new Date(apt.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                        <span className="text-sm font-bold font-oswald">{new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-white">{apt.clientName}</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                          {services.find(s => s.id === apt.serviceId)?.name || 'Serviço'} • {new Date(apt.date).toLocaleDateString('pt-BR')}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase ${apt.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {apt.status}
                     </span>
                  </div>
               </div>
             ))}
             {appointments.length === 0 && (
                <div className="text-center py-10 border border-dashed border-gray-800 rounded-2xl text-gray-600 text-sm">
                  Nenhum agendamento encontrado.
                </div>
             )}
          </div>
        </section>

        {/* Lista de Espera Visual */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-oswald font-bold uppercase flex items-center gap-2 text-white">
              <ListOrdered className="text-orange-500" size={20} /> Lista de Espera Hoje
            </h3>
            <span className="bg-orange-500/10 text-orange-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase">{waitingList.length} Clientes</span>
          </div>

          <div className="space-y-3">
             {waitingList.map(entry => (
               <div key={entry.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-orange-500 font-bold font-oswald border border-orange-500/20">
                        {entry.customerName.charAt(0)}
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-white">{entry.customerName}</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                          {services.find(s => s.id === (entry as any).service || s.id === entry.serviceId)?.name} • {entry.preferredPeriod === 'any' ? 'Qualquer horário' : entry.preferredPeriod}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all" title="Agendar Manualmente">
                        <Smartphone size={16} />
                     </button>
                     <button onClick={() => handleRemoveWaiting(entry.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
             ))}
             {waitingList.length === 0 && (
                <div className="text-center py-10 border border-dashed border-gray-800 rounded-2xl text-gray-600 text-sm">
                  Lista de espera vazia.
                </div>
             )}
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl flex gap-3">
             <Info className="text-orange-500 shrink-0" size={18} />
             <p className="text-[10px] text-gray-400 leading-relaxed uppercase font-bold tracking-tight">
                Se um horário for cancelado, o robô <span className="text-white">n8n</span> enviará mensagens para esses clientes seguindo a ordem de entrada.
             </p>
          </div>
        </section>
      </div>

      {/* Modal: Adicionar à Lista de Espera */}
      {isAddingWaiting && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
           <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scaleIn">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-oswald font-bold uppercase tracking-wide">Pôr na <span className="text-orange-500">Espera</span></h3>
                <button onClick={() => setIsAddingWaiting(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Nome do Cliente</label>
                    <input type="text" value={waitName} onChange={e => setWaitName(e.target.value)} placeholder="Ex: Lucas Ferreira" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none" />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">WhatsApp</label>
                    <input type="text" value={waitPhone} onChange={e => setWaitPhone(e.target.value)} placeholder="(11) 90000-0000" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Serviço</label>
                        <select value={waitService} onChange={e => setWaitService(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none">
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Período</label>
                        <select value={waitPeriod} onChange={e => setWaitPeriod(e.target.value as any)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none">
                            <option value="any">Qualquer um</option>
                            <option value="morning">Manhã</option>
                            <option value="afternoon">Tarde</option>
                            <option value="night">Noite</option>
                        </select>
                    </div>
                 </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={() => setIsAddingWaiting(false)} className="flex-1 py-4 border border-gray-800 rounded-2xl font-bold text-gray-400 hover:bg-gray-800 transition-all uppercase text-[10px] tracking-widest">Cancelar</button>
                <button onClick={handleAddWaiting} className="flex-1 py-4 bg-orange-500 text-black rounded-2xl font-bold hover:bg-orange-400 transition-all uppercase text-[10px] tracking-widest">Salvar na Lista</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal: Novo Agendamento */}
      {isAddingAppointment && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
           {showSuccess ? (
              <div className="flex flex-col items-center justify-center space-y-4 animate-scaleIn">
                <div className="bg-green-500 p-6 rounded-full shadow-lg shadow-green-500/20">
                  <CheckCircle2 size={64} className="text-black animate-bounce" />
                </div>
                <h3 className="text-3xl font-oswald font-bold uppercase text-white">Agendado com Sucesso!</h3>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Aguardamos o cliente no horário marcado.</p>
              </div>
           ) : (
              <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scaleIn relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-oswald font-bold uppercase tracking-wide">Novo <span className="text-yellow-500">Agendamento</span></h3>
                  <button onClick={() => { setIsAddingAppointment(false); setAptError(null); }} className="text-gray-500 hover:text-white"><X size={24} /></button>
                </div>

                {aptError && (
                  <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 animate-headShake">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <p className="text-xs font-bold text-red-500 uppercase tracking-tight">{aptError}</p>
                  </div>
                )}

                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Nome do Cliente</label>
                      <input type="text" value={aptName} onChange={e => { setAptName(e.target.value); setAptError(null); }} placeholder="Ex: João Silva" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                   </div>
                   <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Serviço</label>
                      <select value={aptService} onChange={e => { setAptService(e.target.value); setAptError(null); }} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none">
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Data</label>
                          <input type="date" value={aptDate} onChange={e => { setAptDate(e.target.value); setAptError(null); }} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                      </div>
                      <div>
                          <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Horário</label>
                          <input type="time" value={aptTime} onChange={e => { setAptTime(e.target.value); setAptError(null); }} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                      </div>
                   </div>
                   <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mt-4">
                      <input 
                        type="checkbox" 
                        id="override" 
                        checked={aptOverride} 
                        onChange={e => setAptOverride(e.target.checked)} 
                        className="w-5 h-5 accent-yellow-500 bg-black border-gray-800 rounded" 
                      />
                      <div>
                        <label htmlFor="override" className="text-xs font-bold text-yellow-500 uppercase cursor-pointer block">Criar Encaixe Manual</label>
                        <p className="text-[9px] text-gray-500 font-bold uppercase">Ignora validações de horário e conflitos.</p>
                      </div>
                   </div>
                </div>

                <div className="flex gap-3 mt-10">
                  <button onClick={() => { setIsAddingAppointment(false); setAptError(null); }} className="flex-1 py-4 border border-gray-800 rounded-2xl font-bold text-gray-400 hover:bg-gray-800 transition-all uppercase text-[10px] tracking-widest">Cancelar</button>
                  <button onClick={handleAddAppointment} className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl font-bold hover:bg-yellow-400 transition-all uppercase text-[10px] tracking-widest">Agendar Agora</button>
                </div>
              </div>
           )}
        </div>
      )}

      {/* Datas Especiais / Exceções */}
      <section className="space-y-4 pt-10 border-t border-gray-800/50">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-oswald font-bold uppercase flex items-center gap-2 text-white">
            <CalendarDays className="text-yellow-500" size={20} /> Datas Especiais (Exceções)
          </h3>
          <button onClick={() => setIsAddingNew(true)} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg font-bold flex items-center gap-1 transition-all">
            <Plus size={14} /> Adicionar Exceção
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {exceptions.map(exc => (
            <div key={exc.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full ${exc.type === 'blocked' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <div>
                  <span className="font-bold text-white block text-sm">{new Date(exc.date).toLocaleDateString('pt-BR')}</span>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">{exc.reason}</p>
                </div>
              </div>
              <button onClick={() => handleRemoveException(exc.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modal: Nova Exceção */}
      {isAddingException && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scaleIn">
            <h3 className="text-2xl font-oswald font-bold uppercase mb-8">Configurar <span className="text-yellow-500">Exceção</span></h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Data</label>
                  <input type="date" value={excDate} onChange={(e) => setExcDate(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Tipo</label>
                  <select value={excType} onChange={(e) => setExcType(e.target.value as any)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none">
                    <option value="blocked">Bloquear Dia</option>
                    <option value="extended">Jornada Especial</option>
                  </select>
                </div>
              </div>

              {excType === 'extended' && (
                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Início</label>
                    <input type="time" value={excStart} onChange={(e) => setExcStart(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Fim</label>
                    <input type="time" value={excEnd} onChange={(e) => setExcEnd(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Motivo</label>
                <input type="text" value={excReason} onChange={(e) => setExcReason(e.target.value)} placeholder="Ex: Feriado" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setIsAddingNew(false)} className="flex-1 py-4 border border-gray-800 rounded-2xl font-bold text-gray-400 hover:bg-gray-800 transition-all uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={handleAddException} className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl font-bold hover:bg-yellow-400 transition-all uppercase text-[10px] tracking-widest">Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
