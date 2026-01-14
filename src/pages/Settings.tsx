
import React, { useState, useEffect } from 'react';
import { Settings, Shield, Link2, Bell, Smartphone, ExternalLink, Trophy, Star, Plus, Trash2, Clock, Save, Calendar, AlertCircle } from 'lucide-react';
import { Availability, ScheduleException } from '../types';
import { availabilityApi, scheduleExceptionsApi } from '../api';
import toast from 'react-hot-toast';

interface Props {
  availability: Availability[];
  setAvailability: (a: Availability[]) => void;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const SettingsView: React.FC<Props> = ({ availability, setAvailability }) => {
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [newException, setNewException] = useState<Partial<ScheduleException>>({
    type: 'blocked',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '19:00'
  });

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = async () => {
    try {
      const data = await scheduleExceptionsApi.getAll();
      setExceptions(data);
    } catch (error) {
      console.error("Erro ao carregar exceções:", error);
    }
  };

  const toggleDay = (index: number) => {
    const newAv = [...availability];
    newAv[index].isActive = !newAv[index].isActive;
    setAvailability(newAv);
  };

  const updateTime = (index: number, field: 'startTime' | 'endTime' | 'lunchStart' | 'lunchEnd', value: string) => {
    const newAv = [...availability];
    (newAv[index] as any)[field] = value;
    setAvailability(newAv);
  };

  const handleSaveAvailability = async () => {
    try {
      await Promise.all(
        availability.map(day => availabilityApi.update(day.id, day))
      );
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar disponibilidade:", error);
      toast.error("Erro ao salvar");
    }
  };

  const handleAddException = async () => {
    if (!newException.reason || !newException.date) {
      toast.error("Preencha o motivo e a data");
      return;
    }
    try {
      await scheduleExceptionsApi.create(newException);
      setNewException({
        ...newException,
        reason: ''
      });
      loadExceptions();
    } catch (error) {
      console.error("Erro ao criar exceção:", error);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      await scheduleExceptionsApi.delete(id);
      loadExceptions();
    } catch (error) {
      console.error("Erro ao excluir exceção:", error);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Configurações <span className="text-yellow-500">do Sistema</span></h2>
          <p className="text-gray-400 mt-1">Gerencie seu perfil, integrações e fidelidade.</p>
        </div>
      </header>

      <div className="grid gap-6">

        {/* Jornada Semanal Fixa */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500"><Clock size={20} /></div>
              <h3 className="text-xl font-oswald font-bold uppercase text-white">
                Jornada Semanal
              </h3>
            </div>
            <button 
              onClick={handleSaveAvailability}
              className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all text-xs"
            >
              <Save size={16} /> Salvar Alterações
            </button>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-xl overflow-hidden">
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
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                       <span className="text-gray-400 text-[9px] font-bold uppercase">Expediente:</span>
                       <input type="time" value={day.startTime} onChange={(e) => updateTime(idx, 'startTime', e.target.value)} className="bg-black border border-gray-800 rounded-lg px-2 py-1 text-xs text-white w-20" />
                       <span className="text-gray-600 text-[9px] font-bold uppercase">até</span>
                       <input type="time" value={day.endTime} onChange={(e) => updateTime(idx, 'endTime', e.target.value)} className="bg-black border border-gray-800 rounded-lg px-2 py-1 text-xs text-white w-20" />
                    </div>
                    <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
                       <span className="text-gray-400 text-[9px] font-bold uppercase">Almoço:</span>
                       <input type="time" value={day.lunchStart || ''} onChange={(e) => updateTime(idx, 'lunchStart', e.target.value)} className="bg-black border border-gray-800 rounded-lg px-2 py-1 text-xs text-white w-20" />
                       <span className="text-gray-600 text-[9px] font-bold uppercase">até</span>
                       <input type="time" value={day.lunchEnd || ''} onChange={(e) => updateTime(idx, 'lunchEnd', e.target.value)} className="bg-black border border-gray-800 rounded-lg px-2 py-1 text-xs text-white w-20" />
                    </div>
                  </div>
                ) : <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Off-line</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Exceções e Jornadas Especiais */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-red-500/20 p-2 rounded-lg text-red-500"><Calendar size={20} /></div>
            <h3 className="text-xl font-oswald font-bold uppercase text-white">
              Exceções e Jornadas Especiais
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form de Nova Exceção */}
            <div className="lg:col-span-1 bg-black/40 border border-gray-800 rounded-xl p-4 space-y-4">
              <h4 className="text-sm font-bold uppercase text-gray-400 flex items-center gap-2">
                <Plus size={14} /> Adicionar Exceção
              </h4>
              
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Tipo</label>
                <select 
                  value={newException.type}
                  onChange={(e) => setNewException({...newException, type: e.target.value as any})}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="blocked">Bloqueio total (Folga/Feriado)</option>
                  <option value="extended">Jornada Específica (Encaixes/Extra)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Data</label>
                  <input 
                    type="date" 
                    value={newException.date}
                    onChange={(e) => setNewException({...newException, date: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                {newException.type === 'extended' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Início</label>
                      <input 
                        type="time" 
                        value={newException.startTime}
                        onChange={(e) => setNewException({...newException, startTime: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Fim</label>
                      <input 
                        type="time" 
                        value={newException.endTime}
                        onChange={(e) => setNewException({...newException, endTime: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Motivo / Descrição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Feriado Local, Curso, Atendimento VIP..."
                  value={newException.reason}
                  onChange={(e) => setNewException({...newException, reason: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <button 
                onClick={handleAddException}
                className="w-full bg-white text-black font-bold py-2 rounded-lg text-xs hover:bg-yellow-500 transition-colors"
              >
                Configurar Período
              </button>
            </div>

            {/* Listagem de Exceções */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-sm font-bold uppercase text-gray-400">Exceções Agendadas</h4>
              {exceptions.length === 0 ? (
                <div className="bg-black/20 border border-dashed border-gray-800 rounded-xl p-8 text-center">
                  <p className="text-gray-500 text-sm">Nenhuma exceção configurada para os próximos dias.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exceptions.map((ex) => (
                    <div key={ex.id} className="bg-black/40 border border-gray-800 rounded-xl p-4 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${ex.type === 'blocked' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            {ex.type === 'blocked' ? 'Bloqueado' : 'Especial'}
                          </span>
                          <span className="text-white font-bold text-sm">
                            {new Date(ex.date + "T00:00:00").toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs font-medium">{ex.reason}</p>
                        {ex.type === 'extended' && (
                          <p className="text-gray-500 text-[10px] mt-1 flex items-center gap-1">
                            <Clock size={10} /> {ex.startTime} às {ex.endTime}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDeleteException(ex.id)}
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500 p-2">
                <AlertCircle size={14} className="text-yellow-500" />
                <p className="text-[10px] italic">Exceções de período têm prioridade sobre a jornada semanal padrão.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Loyalty Program Config */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500"><Trophy size={20} /></div>
            <h3 className="font-bold text-xl font-oswald uppercase">Programa de Fidelidade</h3>
          </div>
          
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-black border border-gray-800 rounded-xl">
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2">Regra de Acúmulo</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">R$ 1,00 gasto =</span>
                  <input type="number" defaultValue={1} className="w-16 bg-gray-900 border border-gray-800 rounded px-2 py-1 text-center text-yellow-500 font-bold outline-none focus:border-yellow-500" />
                  <span className="text-sm font-bold">Ponto(s)</span>
                </div>
              </div>
              <div className="p-4 bg-black border border-gray-800 rounded-xl flex items-center gap-3">
                 <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400"><Star size={20} /></div>
                 <div>
                    <p className="text-xs font-bold">Acúmulo Automático</p>
                    <p className="text-[10px] text-gray-500">Pontos são creditados ao finalizar o pagamento no n8n ou manual.</p>
                 </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs text-gray-400 font-bold uppercase">Catálogo de Prêmios (Resgates)</label>
                <button className="text-[10px] bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 transition-all flex items-center gap-1">
                  <Plus size={12} /> Adicionar Prêmio
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { name: 'Corte Social Grátis', points: 450 },
                  { name: 'Barba Grátis', points: 350 },
                  { name: 'Pomada Matte', points: 300 }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-yellow-500 text-xs font-bold border border-gray-800">
                        {item.points}
                      </div>
                      <span className="text-sm text-gray-300 font-bold">{item.name}</span>
                    </div>
                    <button className="text-gray-600 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gray-800 p-2 rounded-lg text-yellow-500"><Smartphone size={20} /></div>
            <h3 className="font-bold text-xl font-oswald uppercase">Dados da Barbearia</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-bold uppercase">Nome Comercial</label>
              <div className="bg-black border border-gray-800 rounded-xl px-4 py-2 text-gray-300">Willian Cut & Co</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-bold uppercase">Endereço</label>
              <div className="bg-black border border-gray-800 rounded-xl px-4 py-2 text-gray-300">Av. Central, 123 - Centro</div>
            </div>
          </div>
        </div>

        {/* Integration */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Link2 size={20} /></div>
              <h3 className="font-bold text-xl font-oswald uppercase">Integração n8n</h3>
            </div>
            <span className="flex items-center gap-1 text-xs text-green-400 font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Conectado
            </span>
          </div>
          
          <div className="p-4 bg-black border border-gray-800 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-gray-500">API_ENDPOINT_WEBHOOK</span>
              <button className="text-blue-400 text-xs flex items-center gap-1 hover:underline">
                Copiar <ExternalLink size={10} />
              </button>
            </div>
            <div className="text-sm font-mono text-gray-400 break-all">
              https://seu-n8n.com/webhook/barber-flow-v1
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><Bell size={20} /></div>
            <h3 className="font-bold text-xl font-oswald uppercase">Notificações</h3>
          </div>
          <div className="space-y-4">
            <ToggleOption label="Novo agendamento no WhatsApp" checked={true} />
            <ToggleOption label="Cancelamento de cliente" checked={true} />
            <ToggleOption label="Alerta de pontos a expirar" checked={true} />
            <ToggleOption label="Relatório diário de faturamento" checked={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleOption: React.FC<{ label: string, checked: boolean }> = ({ label, checked }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-300 text-sm">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} readOnly className="sr-only peer" />
      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
    </label>
  </div>
);

export default SettingsView;
