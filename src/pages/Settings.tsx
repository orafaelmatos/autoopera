
import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Link2, Bell, Smartphone, ExternalLink, 
  Trophy, Star, Plus, Trash2, Clock, Save, Calendar, 
  AlertCircle, ChevronRight, Check, History, Wifi,
  Coffee, Globe, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      toast.success("Configurações salvas!");
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
      toast.success("Exceção adicionada");
    } catch (error) {
      console.error("Erro ao criar exceção:", error);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      await scheduleExceptionsApi.delete(id);
      loadExceptions();
      toast.success("Exceção removida");
    } catch (error) {
      console.error("Erro ao excluir exceção:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 sm:space-y-12 pb-20 px-4 sm:px-0"
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2">Ajustes</h2>
          <p className="text-xs sm:text-sm text-white/50 font-medium">Controle sua operação e conexões externas.</p>
        </div>
        <button 
          onClick={handleSaveAvailability}
          className="w-full sm:w-auto bg-[#007AFF] text-white px-6 py-3.5 rounded-xl sm:rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#007AFF]/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#007AFF]/20 text-sm"
        >
          <Save size={18} />
          Salvar Tudo
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Lado Esquerdo - Configurações de Tempo */}
        <div className="xl:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Jornada Semanal */}
          <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] overflow-hidden">
            <div className="p-5 sm:p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
                  <Clock size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Jornada Semanal</h3>
                  <p className="text-[10px] sm:text-sm text-white/40">Horários de funcionamento por dia</p>
                </div>
              </div>
            </div>

            <div className="p-1 sm:p-2">
              {availability.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 transition-all rounded-2xl ${day.isActive ? 'hover:bg-white/[0.01]' : 'opacity-40'}`}
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={day.isActive} 
                        onChange={() => toggleDay(idx)} 
                        className="sr-only peer" 
                      />
                      <div className="w-12 h-7 sm:w-14 sm:h-8 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-5 sm:after:h-6 after:w-5 sm:after:w-6 after:transition-all peer-checked:bg-[#34C759]"></div>
                    </label>
                    <div className="w-20 sm:w-24">
                      <span className={`text-base sm:text-lg font-bold ${day.isActive ? 'text-white' : 'text-white/30'}`}>
                        {DAYS[idx]}
                      </span>
                    </div>
                  </div>

                  {day.isActive ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6"
                    >
                      <div className="flex items-center justify-between sm:justify-start gap-4 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Expediente</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={day.startTime} 
                            onChange={(e) => updateTime(idx, 'startTime', e.target.value)} 
                            className="bg-transparent text-sm text-white font-bold outline-none [color-scheme:dark]" 
                          />
                          <span className="text-white/20">-</span>
                          <input 
                            type="time" 
                            value={day.endTime} 
                            onChange={(e) => updateTime(idx, 'endTime', e.target.value)} 
                            className="bg-transparent text-sm text-white font-bold outline-none [color-scheme:dark]" 
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-4 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wider">Almoço</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={day.lunchStart || ''} 
                            onChange={(e) => updateTime(idx, 'lunchStart', e.target.value)} 
                            className="bg-transparent text-sm text-white font-bold outline-none [color-scheme:dark]" 
                          />
                          <span className="text-white/20">-</span>
                          <input 
                            type="time" 
                            value={day.lunchEnd || ''} 
                            onChange={(e) => updateTime(idx, 'lunchEnd', e.target.value)} 
                            className="bg-transparent text-sm text-white font-bold outline-none [color-scheme:dark]" 
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Dia de descanso</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Exceções */}
          <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30]">
                <Calendar size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Bloqueios & Horários Especiais</h3>
                <p className="text-[10px] sm:text-sm text-white/40">Feriados, cursos ou atendimentos VIP</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Form de Nova Exceção */}
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/5 h-fit">
                <h4 className="text-xs sm:text-sm font-bold text-white mb-5 sm:mb-6 flex items-center gap-2">
                  <Plus size={14} className="text-[#007AFF] sm:w-4 sm:h-4" />
                  Configurar Novo Período
                </h4>
                
<div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Tipo de Registro</label>
                  <select 
                    value={newException.type}
                    onChange={(e) => setNewException({...newException, type: e.target.value as any})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#007AFF] appearance-none"
                  >
                    <option value="blocked" className="bg-[#1c1c1e]">Bloqueio total (Folga/Feriado)</option>
                    <option value="extended" className="bg-[#1c1c1e]">Jornada Específica (Encaixes)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Data</label>
                    <input 
                      type="date" 
                      value={newException.date}
                      onChange={(e) => setNewException({...newException, date: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#007AFF] [color-scheme:dark]"
                    />
                  </div>
                  {newException.type === 'extended' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Início</label>
                        <input 
                          type="time" 
                          value={newException.startTime}
                          onChange={(e) => setNewException({...newException, startTime: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-[#007AFF] [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Fim</label>
                        <input 
                          type="time" 
                          value={newException.endTime}
                          onChange={(e) => setNewException({...newException, endTime: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-[#007AFF] [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Motivo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Feriado Local"
                    value={newException.reason}
                    onChange={(e) => setNewException({...newException, reason: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#007AFF] placeholder:text-white/10"
                  />
                </div>

                <button 
                  onClick={handleAddException}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm hover:bg-[#007AFF] hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
                >
                  Ativar Exceção
                </button>
              </div>
            </div>

            {/* Listagem de Exceções */}
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold text-white/40 flex items-center justify-between">
                  Próximas Datas <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px] text-white/30">{exceptions.length}</span>
                </h4>
                
                <AnimatePresence mode="popLayout">
                  {exceptions.length === 0 ? (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-12 text-center"
                    >
                      <p className="text-white/20 text-sm font-medium">Nenhum bloqueio agendado.</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {exceptions.map((ex) => (
                        <motion.div 
                          layout
                          key={ex.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-white/5 border border-white/5 rounded-2xl p-5 flex justify-between items-center group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${ex.type === 'blocked' ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'}`}></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">
                                  {new Date(ex.date + "T00:00:00").toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ex.type === 'blocked' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 'bg-[#007AFF]/10 text-[#007AFF]'}`}>
                                  {ex.type === 'blocked' ? 'Bloqueio' : 'Especial'}
                                </span>
                              </div>
                              <p className="text-white/40 text-[11px] font-medium mt-0.5">{ex.reason}</p>
                              {ex.type === 'extended' && (
                                <p className="text-[#007AFF] text-[10px] mt-1 font-bold flex items-center gap-1">
                                  <Clock size={10} /> {ex.startTime} — {ex.endTime}
                                </p>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteException(ex.id)}
                            className="bg-white/0 hover:bg-[#FF3B30]/10 p-2 rounded-lg text-white/10 group-hover:text-[#FF3B30] transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-start gap-2 bg-[#FF9500]/5 border border-[#FF9500]/10 rounded-2xl p-4">
                  <AlertCircle size={16} className="text-[#FF9500] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#FF9500]/80 font-medium leading-relaxed">
                    Ateção: Estes horários sobrescrevem automaticamente a jornada fixa para as datas selecionadas.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Lado Direito - Perfil, Fidelidade e Integração */}
        <div className="xl:col-span-4 space-y-6 sm:space-y-8">
          
          {/* Perfil */}
          <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center text-white/50">
                <Building2 size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Barbearia</h3>
                <p className="text-[10px] sm:text-sm text-white/40">Dados públicos do perfil</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] text-white/30 font-bold uppercase tracking-widest pl-1">Nome Comercial</label>
                <div className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl p-4 text-white font-medium flex items-center justify-between text-sm sm:text-base">
                  Willian Cut & Co
                  <Check size={14} className="text-[#34C759]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] text-white/30 font-bold uppercase tracking-widest pl-1">Endereço</label>
                <div className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl p-4 text-white/60 text-xs sm:text-sm leading-relaxed">
                  Av. Central, 123 - Centro <br /> Cep: 01000-000
                </div>
              </div>
            </div>
          </section>

          {/* Integrações */}
          <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#34C759]/10 flex items-center justify-center text-[#34C759]">
                  <Wifi size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Integração</h3>
                  <p className="text-[10px] sm:text-sm text-white/40">WhatsApp & n8n</p>
                </div>
              </div>
              <span className="w-fit flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#34C759] font-bold bg-[#34C759]/10 px-3 py-1 rounded-full uppercase">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#34C759] animate-pulse"></span> Ativo
              </span>
            </div>
            
            <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/5 rounded-2xl sm:rounded-3xl space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-[9px] sm:text-[10px] font-mono text-white/20 select-none">API_WEBHOOK_V1</span>
                <button className="text-[#007AFF] text-[9px] sm:text-[10px] font-bold flex items-center gap-1 hover:underline">
                  Copiar Link
                </button>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="text-[9px] sm:text-[10px] font-mono text-white/40 break-all leading-relaxed">
                  https://seu-n8n.com/webhook/barber-flow-v1
                </div>
              </div>
            </div>
          </section>

          {/* Notificações */}
          <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500]">
                <Bell size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Notificações</h3>
                <p className="text-[10px] sm:text-sm text-white/40">Alertas do sistema</p>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <ToggleOption label="Novos Agendamentos" checked={true} />
              <ToggleOption label="Cancelamentos" checked={true} />
              <ToggleOption label="Pontos Expirando" checked={true} />
              <ToggleOption label="Relatório Diário" checked={false} />
            </div>
          </section>

        </div>
      </div>
    </motion.div>
  );
};

const ToggleOption: React.FC<{ label: string, checked: boolean }> = ({ label, checked }) => (
  <div className="flex items-center justify-between group">
    <span className="text-white/60 text-sm font-medium group-hover:text-white transition-colors">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} readOnly className="sr-only peer" />
      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
    </label>
  </div>
);

export default SettingsView;

