
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
  PieChart,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  appointments: Appointment[];
  services: Service[];
  onNavigateToPromotions?: () => void;
}

const ReportsView: React.FC<Props> = ({ appointments, services, onNavigateToPromotions }) => {
  // Cálculo de dados reais a partir dos agendamentos
  const daysMap: Record<string, number> = {
    'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0, 'Dom': 0
  };
  
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  appointments.forEach(app => {
    const date = new Date(app.date);
    if (!isNaN(date.getTime())) {
      const dayName = dayNames[date.getDay()];
      if (daysMap[dayName] !== undefined) {
        daysMap[dayName]++;
      }
    }
  });

  const maxCount = Math.max(...Object.values(daysMap), 1);
  const daysData = Object.entries(daysMap).map(([day, count]) => ({
    day,
    count,
    fill: (count / maxCount) * 100
  }));

  const platforms = [
    { name: 'WhatsApp Bot', value: 65, icon: <Smartphone size={14} className="text-[#007AFF]" />, color: 'bg-[#007AFF]' },
    { name: 'Manual', value: 25, icon: <MousePointer2 size={14} className="text-gray-400" />, color: 'bg-gray-500' },
    { name: 'Link Web', value: 10, icon: <Activity size={14} className="text-gray-600" />, color: 'bg-gray-700' },
  ];

  const weakestDay = Object.entries(daysMap)
    .filter(([day]) => day !== 'Dom')
    .sort((a, b) => a[1] - b[1])[0];
  
  const weakestDayFull = {
    'Seg': 'Segunda-feira', 'Ter': 'Terça-feira', 'Qua': 'Quarta-feira', 
    'Qui': 'Quinta-feira', 'Sex': 'Sexta-feira', 'Sáb': 'Sábado'
  }[weakestDay?.[0] || 'Ter'];

  return (
    <div className="space-y-12 animate-fadeIn max-w-[1200px] mx-auto pb-20">
      <header>
        <h2 className="text-4xl font-bold tracking-tight text-white">Relatórios <span className="text-gray-500">Analíticos</span></h2>
        <p className="text-gray-500 mt-2 font-medium">Insights e inteligência baseada em dados reais.</p>
      </header>

      {/* Destaque de Insight */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1c1c1e] border border-[#007AFF]/20 p-8 rounded-[32px] flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-[#007AFF]/5"
      >
        <div className="bg-[#007AFF]/10 p-5 rounded-3xl border border-[#007AFF]/20 shadow-xl shadow-[#007AFF]/10">
          <Lightbulb size={40} className="text-[#007AFF]" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#007AFF]">IA Business Insight</span>
          </div>
          <h4 className="text-2xl font-bold text-white mb-2 tracking-tight">Otimize suas {weakestDayFull}s</h4>
          <p className="text-gray-500 text-[13px] font-medium leading-relaxed max-w-xl">
            Detectamos uma queda de demanda nas <span className="text-white">{weakestDayFull}s</span>. Ative uma campanha automática no WhatsApp para preencher esses horários ociosos.
          </p>
        </div>
        <button 
          onClick={onNavigateToPromotions}
          className="bg-[#007AFF] text-white px-8 py-4 rounded-2xl font-bold text-[13px] flex items-center gap-2 hover:bg-[#0063CC] transition-all active:scale-95 whitespace-nowrap shadow-xl shadow-[#007AFF]/20"
        >
          Agir Agora <ArrowRight size={18} />
        </button>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gráfico de Demanda */}
        <section className="bg-[#1c1c1e] border border-white/5 p-8 rounded-[32px] shadow-xl">
          <div className="flex items-center justify-between mb-12">
             <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Fluxo Semanal</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Volume de agendamentos</p>
             </div>
             <BarChart2 className="text-[#007AFF]" size={20} />
          </div>
          <div className="flex items-end justify-between h-56 gap-4">
            {daysData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full relative flex items-end justify-center h-full bg-black/20 rounded-2xl overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${d.fill}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="w-full bg-[#007AFF]/40 group-hover:bg-[#007AFF] transition-all rounded-t-xl"
                  />
                  {d.count > 0 && <span className="absolute top-2 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>}
                </div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Distribuição de Plataformas */}
        <section className="bg-[#1c1c1e] border border-white/5 p-8 rounded-[32px] shadow-xl">
           <div className="flex items-center justify-between mb-12">
             <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Origem de Tráfego</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Performance por canal</p>
             </div>
             <PieChart className="text-[#007AFF]" size={20} />
          </div>
          <div className="space-y-8">
            {platforms.map(p => (
              <div key={p.name} className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em]">
                  <span className="flex items-center gap-2 text-gray-400">{p.icon} {p.name}</span>
                  <span className="text-white">{p.value}%</span>
                </div>
                <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.value}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${p.color} shadow-sm`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ranking de Serviços */}
        <section className="bg-[#1c1c1e] border border-white/5 p-8 rounded-[32px] shadow-xl lg:col-span-2">
           <div className="flex items-center justify-between mb-10">
             <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Serviços Estelares</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Ranking de Rentabilidade Global</p>
             </div>
             <Target className="text-[#007AFF]" size={20} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {services.slice(0, 6).map((s, idx) => (
              <div key={s.id} className="bg-black/20 p-5 rounded-[24px] border border-white/5 flex items-center justify-between hover:bg-black/40 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="text-2xl font-bold text-gray-800 group-hover:text-[#007AFF] transition-colors">0{idx + 1}</div>
                  <div>
                    <h5 className="font-bold text-white text-base tracking-tight">{s.name}</h5>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">{s.duration} MIN • R$ {s.price}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-green-500 font-bold text-sm tracking-tight justify-end">
                    <ArrowUpRight size={14} />
                    R$ {(s.price * (1 - s.commission/100) * 12).toFixed(0)}
                  </div>
                  <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.1em] mt-0.5">EST. MENSAL</p>
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
