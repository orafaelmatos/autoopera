
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
    { name: 'WhatsApp Bot', value: 65, icon: <Smartphone size={14} className="text-cta" />, color: 'bg-cta' },
    { name: 'Manual', value: 25, icon: <MousePointer2 size={14} className="text-text/20" />, color: 'bg-text/20' },
    { name: 'Link Web', value: 10, icon: <Activity size={14} className="text-primary/40" />, color: 'bg-primary/40' },
  ];

  const weakestDay = Object.entries(daysMap)
    .filter(([day]) => day !== 'Dom')
    .sort((a, b) => a[1] - b[1])[0];
  
  const weakestDayFull = {
    'Seg': 'Segunda-feira', 'Ter': 'Terça-feira', 'Qua': 'Quarta-feira', 
    'Qui': 'Quinta-feira', 'Sex': 'Sexta-feira', 'Sáb': 'Sábado'
  }[weakestDay?.[0] || 'Ter'];

  return (
    <div className="space-y-16 sm:space-y-24 animate-fadeIn max-w-[1400px] mx-auto px-6 sm:px-12 pb-32">
      <header className="flex flex-col sm:flex-row justify-between items-end gap-10">
        <div>
          <h2 className="text-4xl sm:text-6xl font-black italic uppercase text-primary font-title leading-none">Inteligência <span className="text-primary/20">Analítica</span></h2>
          <p className="text-[10px] sm:text-xs text-primary/40 mt-6 font-black italic uppercase tracking-[0.4em] font-title italic">Insights transformados em decisões estratégicas de alto impacto.</p>
        </div>
        <div className="hidden sm:flex gap-4">
            {[1, 2, 3].map(i => <div key={i} className={`h-2 rounded-full transition-all duration-700 ${i === 1 ? 'w-16 bg-cta' : 'w-4 bg-primary/10'}`} />)}
        </div>
      </header>

      {/* Destaque de Insight IA */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary p-10 sm:p-16 rounded-[48px] flex flex-col md:flex-row items-center gap-10 sm:gap-16 shadow-[0_48px_96px_-12px_rgba(15,76,92,0.3)] relative overflow-hidden group"
      >
        {/* Background Decorativo */}
        <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000 pointer-events-none text-white">
            <TrendingUp size={240} strokeWidth={1} />
        </div>

        <div className="bg-white/10 p-8 sm:p-10 rounded-[32px] border border-white/10 shadow-2xl shrink-0 backdrop-blur-xl group-hover:rotate-6 transition-transform duration-500">
          <Lightbulb size={48} className="text-cta sm:w-14 sm:h-14" strokeWidth={2.5} />
        </div>
        <div className="flex-1 text-center md:text-left relative z-10">
          <div className="flex items-center gap-3 justify-center md:justify-start mb-6">
            <span className="text-[10px] sm:text-xs font-black italic uppercase tracking-[0.5em] text-cta font-title">Barber Flow AI Business</span>
          </div>
          <h4 className="text-3xl sm:text-5xl font-black italic text-white mb-6 tracking-tighter font-title uppercase leading-none">Otimize suas {weakestDayFull}s</h4>
          <p className="text-white/60 text-base sm:text-lg font-black italic uppercase tracking-tight leading-relaxed max-w-2xl font-title">
            Identificamos baixa ocupação nas <span className="text-cta">{weakestDayFull}s</span>. Ative uma campanha promocional para converter clientes e preencher sua agenda.
          </p>
        </div>
        <button 
          onClick={onNavigateToPromotions}
          className="w-full md:w-auto bg-cta text-white px-12 py-8 rounded-[28px] font-black italic text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-6 hover:scale-105 transition-all active:scale-95 whitespace-nowrap shadow-2xl shadow-black/20 font-title"
        >
          Executar Campanha <ArrowRight size={24} strokeWidth={3} />
        </button>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-10 sm:gap-16">
        {/* Gráfico de Demanda */}
        <section className="bg-white/80 backdrop-blur-xl border border-primary/5 p-10 sm:p-16 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(15,76,92,0.1)] group">
          <div className="flex items-center justify-between mb-16">
             <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-black italic text-primary font-title uppercase tracking-tight">Fluxo Semanal</h3>
                <p className="text-[10px] sm:text-xs text-primary/30 font-black italic uppercase tracking-[0.4em] font-title">Volume de agendamentos consolidado</p>
             </div>
             <div className="w-16 h-16 bg-background rounded-[24px] flex items-center justify-center text-primary/20 group-hover:text-cta transition-colors duration-500 border border-primary/5">
                <BarChart2 size={32} strokeWidth={2.5} />
             </div>
          </div>
          <div className="flex items-end justify-between h-64 sm:h-80 gap-3 sm:gap-6 px-4">
            {daysData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-6 group/bar">
                <div className="w-full relative flex items-end justify-center h-full bg-background/50 rounded-[24px] overflow-hidden border border-primary/5 shadow-inner group-hover/bar:border-cta/20 transition-all duration-500">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${d.fill}%` }}
                    transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full bg-primary/10 group-hover/bar:bg-cta transition-all rounded-t-[16px]"
                  />
                  {d.count > 0 && (
                    <span className="absolute top-4 text-[11px] font-black italic text-primary opacity-0 group-hover/bar:opacity-100 transition-opacity font-title uppercase">
                        {d.count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black italic text-primary/20 uppercase tracking-[0.2em] group-hover/bar:text-cta transition-colors font-title">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Distribuição de Plataformas */}
        <section className="bg-white/80 backdrop-blur-xl border border-primary/5 p-10 sm:p-16 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(15,76,92,0.1)] group">
           <div className="flex items-center justify-between mb-16">
             <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-black italic text-primary font-title uppercase tracking-tight">Canais de Entrada</h3>
                <p className="text-[10px] sm:text-xs text-primary/30 font-black italic uppercase tracking-[0.4em] font-title">Conversão por ecossistema</p>
             </div>
             <div className="w-16 h-16 bg-background rounded-[24px] flex items-center justify-center text-primary/20 group-hover:text-cta transition-colors duration-500 border border-primary/5">
                <PieChart size={32} strokeWidth={2.5} />
             </div>
          </div>
          <div className="space-y-12 sm:space-y-16 px-4">
            {platforms.map(p => (
              <div key={p.name} className="group/item">
                <div className="flex justify-between items-center text-[10px] sm:text-xs font-black italic uppercase tracking-[0.3em] font-title mb-6">
                  <span className="flex items-center gap-6 text-primary/30 group-hover:text-primary transition-colors">
                    <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center border border-primary/5">{p.icon}</div>
                    {p.name}
                  </span>
                  <span className="text-cta font-black italic tracking-widest">{p.value}%</span>
                </div>
                <div className="w-full bg-background h-5 sm:h-6 rounded-full overflow-hidden border border-primary/5 p-1.5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.value}%` }}
                    transition={{ duration: 2, ease: "circOut" }}
                    className={`h-full rounded-full ${p.color === 'bg-cta' ? 'bg-cta' : 'bg-primary/20'} shadow-xl shadow-black/5`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ranking de Serviços */}
        <section className="bg-white/80 backdrop-blur-xl border border-primary/5 p-10 sm:p-16 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(15,76,92,0.1)] lg:col-span-2 group">
           <div className="flex items-center justify-between mb-12 sm:mb-16">
             <div className="space-y-3">
                <h3 className="text-2xl sm:text-4xl font-black italic text-primary font-title uppercase tracking-tight">Ranking de Performance</h3>
                <p className="text-[10px] sm:text-xs text-primary/30 font-black italic uppercase tracking-[0.4em] font-title">Serviços com maior ROI operacional e aceitação</p>
             </div>
             <Target className="text-primary/10 group-hover:text-cta transition-colors duration-700" size={48} strokeWidth={1} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.slice(0, 6).map((s, idx) => (
              <div key={s.id} className="bg-background/50 p-10 rounded-[40px] border border-primary/5 flex items-center justify-between hover:border-cta/20 hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group/card cursor-default relative overflow-hidden">
                <div className="flex items-center gap-8 relative z-10">
                  <div className="text-3xl sm:text-4xl font-black italic text-primary/10 group-hover/card:text-cta/10 transition-colors font-title uppercase">0{idx + 1}</div>
                  <div className="space-y-2">
                    <h5 className="font-black italic text-primary text-sm sm:text-lg tracking-tight uppercase leading-none font-title">{s.name}</h5>
                    <p className="text-[10px] text-primary/30 font-black italic uppercase tracking-[0.2em] font-title">{s.duration} MIN • R$ {s.price}</p>
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <div className="flex items-center gap-2 text-primary font-black italic text-xs sm:text-lg tracking-tighter justify-end font-title">
                    <ArrowUpRight size={20} className="text-cta" strokeWidth={3} />
                    R$ {(s.price * 12).toFixed(0)}
                  </div>
                  <p className="text-[9px] text-primary/30 font-black italic uppercase tracking-widest mt-1 font-title">PROJEÇÃO</p>
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
