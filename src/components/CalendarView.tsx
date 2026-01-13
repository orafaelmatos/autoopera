
import React, { useState } from 'react';
import { Availability, ScheduleException, WaitingListEntry, Service } from '../types';
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
  X
} from 'lucide-react';

interface Props {
  availability: Availability[];
  setAvailability: (a: Availability[]) => void;
  waitingList: WaitingListEntry[];
  setWaitingList: React.Dispatch<React.SetStateAction<WaitingListEntry[]>>;
  services: Service[];
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const CalendarView: React.FC<Props> = ({ availability, setAvailability, waitingList, setWaitingList, services }) => {
  const [exceptions, setExceptions] = useState<ScheduleException[]>([
    { id: '1', date: '2023-12-24', type: 'blocked', reason: 'Véspera de Natal' },
  ]);
  const [isAddingException, setIsAddingNew] = useState(false);
  const [isAddingWaiting, setIsAddingWaiting] = useState(false);

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

  const handleAddWaiting = () => {
    if (!waitName || !waitPhone) return;
    const entry: WaitingListEntry = {
      id: `w${Date.now()}`,
      customerName: waitName,
      customerPhone: waitPhone,
      serviceId: waitService,
      date: new Date().toISOString().split('T')[0],
      preferredPeriod: waitPeriod,
      createdAt: new Date().toISOString()
    };
    setWaitingList([...waitingList, entry]);
    setIsAddingWaiting(false);
    setWaitName('');
    setWaitPhone('');
  };

  const toggleDay = (index: number) => {
    const newAv = [...availability];
    newAv[index].isActive = !newAv[index].isActive;
    setAvailability(newAv);
  };

  const updateTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newAv = [...availability];
    newAv[index][field] = value;
    setAvailability(newAv);
  };

  const handleAddException = () => {
    if (!excDate || !excReason) return;
    const newExc: ScheduleException = {
      id: Date.now().toString(),
      date: excDate,
      type: excType,
      reason: excReason,
      ...(excType === 'extended' ? { startTime: excStart, endTime: excEnd } : {})
    };
    setExceptions([...exceptions, newExc]);
    setIsAddingNew(false);
    resetExcForm();
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
          <p className="text-gray-400 mt-1">Sua jornada, exceções e lista de espera inteligente.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setIsAddingWaiting(true)}
            className="flex-1 sm:flex-none bg-gray-900 border border-orange-500/30 text-orange-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-500/10 transition-all"
          >
            <ListOrdered size={18} /> Lista de Espera
          </button>
          <button className="flex-1 sm:flex-none bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10">
            <Save size={18} /> Salvar Tudo
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Jornada Semanal Fixa */}
        <section className="space-y-4">
          <h3 className="text-xl font-oswald font-bold uppercase flex items-center gap-2 text-white">
            <Clock className="text-yellow-500" size={20} /> Jornada Semanal
          </h3>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {availability.map((day, idx) => (
              <div key={idx} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 last:border-0 transition-all ${day.isActive ? 'bg-transparent' : 'bg-gray-800/10 opacity-50'}`}>
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={day.isActive} onChange={() => toggleDay(idx)} className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                  <span className={`font-bold w-20 text-sm ${day.isActive ? 'text-white' : 'text-gray-500'}`}>{DAYS[idx]}</span>
                </div>
                {day.isActive ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={day.startTime} onChange={(e) => updateTime(idx, 'startTime', e.target.value)} className="bg-black border border-gray-800 rounded-lg px-2 py-1 text-xs text-white" />
                    <span className="text-gray-600 text-[10px] font-bold uppercase">até</span>
                    <input type="time" value={day.endTime} onChange={(e) => updateTime(idx, 'endTime', e.target.value)} className="bg-black border border-gray-800 rounded-lg px-2 py-1 text-xs text-white" />
                  </div>
                ) : <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Off-line</span>}
              </div>
            ))}
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
                          {services.find(s => s.id === entry.serviceId)?.name} • {entry.preferredPeriod === 'any' ? 'Qualquer horário' : entry.preferredPeriod}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all" title="Agendar Manualmente">
                        <Smartphone size={16} />
                     </button>
                     <button onClick={() => setWaitingList(waitingList.filter(w => w.id !== entry.id))} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
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
              <button onClick={() => setExceptions(exceptions.filter(e => e.id !== exc.id))} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
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
