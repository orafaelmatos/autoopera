
import React, { useState } from 'react';
import { Settings, Shield, Link2, Bell, Smartphone, ExternalLink, Trophy, Star, Plus, Trash2, Clock, Save } from 'lucide-react';
import { Availability } from '../types';

interface Props {
  availability: Availability[];
  setAvailability: (a: Availability[]) => void;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const SettingsView: React.FC<Props> = ({ availability, setAvailability }) => {
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
            <button className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all text-xs">
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
