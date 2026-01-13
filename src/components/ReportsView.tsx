
import React from 'react';
import { Appointment, Service } from '../types';
import { 
  TrendingUp, 
  BarChart2, 
  Clock, 
  Calendar, 
  Smartphone, 
  MousePointer2, 
  Lightbulb,
  ArrowRight,
  PieChart
} from 'lucide-react';

interface Props {
  appointments: Appointment[];
  services: Service[];
  onNavigateToPromotions?: () => void;
}

const ReportsView: React.FC<Props> = ({ appointments, services, onNavigateToPromotions }) => {
  // Simulação de dados para os gráficos
  const daysData = [
    { day: 'Seg', count: 12, fill: 40 },
    { day: 'Ter', count: 8, fill: 25 },
    { day: 'Qua', count: 15, fill: 55 },
    { day: 'Qui', count: 22, fill: 80 },
    { day: 'Sex', count: 28, fill: 100 },
    { day: 'Sáb', count: 30, fill: 100 },
    { day: 'Dom', count: 5, fill: 15 },
  ];

  const platforms = [
    { name: 'WhatsApp (n8n)', value: 65, icon: <Smartphone size={14} className="text-green-500" /> },
    { name: 'Manual', value: 25, icon: <MousePointer2 size={14} className="text-blue-500" /> },
    { name: 'Web/Link', value: 10, icon: <MousePointer2 size={14} className="text-purple-500" /> },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <header>
        <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Relatórios <span className="text-yellow-500">Gerenciais</span></h2>
        <p className="text-gray-400 mt-1">Conhecimento estratégico para sua tomada de decisão.</p>
      </header>

      {/* Insight Automático - Destaque */}
      <div className="bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6">
        <div className="bg-yellow-500 p-4 rounded-2xl shadow-lg shadow-yellow-500/20">
          <Lightbulb size={32} className="text-black" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-xl font-bold text-white mb-1">Oportunidade Detectada!</h4>
          <p className="text-gray-400 text-sm">
            Suas <span className="text-white font-bold">Terças-feiras</span> possuem 40% menos agendamentos que a média semanal. 
            Que tal enviar uma promoção de "Corte + Barba com 20% OFF" para seus clientes via WhatsApp?
          </p>
        </div>
        <button 
          onClick={onNavigateToPromotions}
          className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all active:scale-95 whitespace-nowrap"
        >
          Criar Promoção <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-oswald font-bold uppercase flex items-center gap-2">
              <BarChart2 className="text-yellow-500" size={18} /> Demanda por Dia
            </h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase">Últimos 30 dias</span>
          </div>
          <div className="flex items-end justify-between h-48 gap-2">
            {daysData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex items-end justify-center h-full bg-gray-800/20 rounded-t-lg overflow-hidden">
                  <div 
                    className="w-full bg-yellow-500/40 group-hover:bg-yellow-500 transition-all duration-500 rounded-t-lg"
                    style={{ height: `${d.fill}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-oswald font-bold uppercase flex items-center gap-2">
              <PieChart className="text-yellow-500" size={18} /> Origem dos Agendamentos
            </h3>
          </div>
          <div className="space-y-6">
            {platforms.map(p => (
              <div key={p.name} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase">
                  <span className="flex items-center gap-2 text-gray-400">{p.icon} {p.name}</span>
                  <span className="text-white">{p.value}%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      p.name.includes('WhatsApp') ? 'bg-green-500' : p.name.includes('Manual') ? 'bg-blue-500' : 'bg-purple-500'
                    }`} 
                    style={{ width: `${p.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 p-6 rounded-3xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-oswald font-bold uppercase flex items-center gap-2">
              <TrendingUp className="text-yellow-500" size={18} /> Ranking de Rentabilidade
            </h3>
          </div>
          <div className="grid gap-4">
            {services.map((s, idx) => (
              <div key={s.id} className="bg-black/30 p-4 rounded-2xl flex items-center justify-between hover:bg-black/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-oswald font-bold text-gray-700">#{idx + 1}</div>
                  <div>
                    <h5 className="font-bold text-white text-sm">{s.name}</h5>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{s.duration} min • R$ {s.price}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-green-500">+ R$ {(s.price * (1 - s.commission/100) * 45).toFixed(0)} <span className="text-gray-600 text-[10px]">Lucro Est.</span></p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportsView;
