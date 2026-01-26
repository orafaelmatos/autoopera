
import React from 'react';
import { Appointment, Service, Customer, Transaction } from '../types';
import { Clock, User, CheckCircle2, TrendingUp, Wallet, Megaphone, ArrowRight, ListOrdered, Trophy, ChevronRight, Check } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { appointmentsApi, transactionsApi } from '../api';
import toast from 'react-hot-toast';

const SwipeableAppointment: React.FC<{ apt: Appointment, index: number, serviceName: string, onFinish: () => void }> = ({ apt, index, serviceName, onFinish }) => {
  const x = useMotionValue(0);
  const background = useTransform(x, [0, 150], ['#FFFFFF', '#E67E22']);
  const checkColor = useTransform(x, [100, 150], ['rgba(255, 255, 255, 0)', '#FFFFFF']);
  const opacity = useTransform(x, [50, 150], [0, 1]);
  const scale = useTransform(x, [0, 150], [0.8, 1]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}
      exit={{ x: 500, opacity: 0 }}
      layout
      className="relative overflow-hidden rounded-[40px] bg-white border border-primary/5 shadow-[0_16px_32px_-8px_rgba(15,76,92,0.06)]"
    >
      <motion.div 
        style={{ background }}
        className="absolute inset-0 flex items-center pl-10 pointer-events-none"
      >
         <motion.div style={{ opacity, scale }}>
            <motion.div style={{ color: checkColor }}>
               <Check size={40} strokeWidth={3} />
            </motion.div>
         </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 250 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x > 180) {
            onFinish();
          }
        }}
        style={{ x }}
        className="relative bg-white p-8 flex items-center justify-between cursor-grab active:cursor-grabbing group"
      >
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-background rounded-[24px] border border-primary/5 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <User size={28} className="text-primary/40 relative z-10" strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-black italic text-primary text-xl font-title tracking-tight leading-none mb-3 uppercase">{apt.clientName}</h4>
            <div className="flex flex-wrap items-center gap-3 font-title">
               <span className="text-[10px] text-cta font-black italic uppercase tracking-widest bg-cta/5 px-4 py-1.5 rounded-full border border-cta/10 shadow-sm">{serviceName}</span>
               <div className="w-1.5 h-1.5 rounded-full bg-primary/10"></div>
               <span className="text-[10px] text-primary/40 font-black italic uppercase tracking-[0.2em]">{new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
        
        <div className="hidden sm:block">
            <div className="w-12 h-12 rounded-full border-2 border-primary/5 flex items-center justify-center text-primary/10 group-hover:text-cta group-hover:border-cta/20 group-hover:scale-110 transition-all">
                <ChevronRight size={24} strokeWidth={3} />
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, trend?: string, color?: 'primary' | 'cta' }> = ({ title, value, icon, trend, color = 'primary' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-primary/5 rounded-[48px] p-10 flex flex-col justify-between relative overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)] group hover:-translate-y-2 transition-all duration-500"
  >
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/[0.02] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
    
    <div className="flex items-center justify-between mb-8 relative z-10">
      <div className={`w-14 h-14 rounded-2xl ${color === 'primary' ? 'bg-primary' : 'bg-cta'} flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(15,76,92,0.4)] group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      {trend && (
        <span className="text-[10px] font-black italic text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-full">
            {trend}
        </span>
      )}
    </div>
    
    <div className="relative z-10">
      <h4 className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.3em] mb-2 font-title">{title}</h4>
      <p className="text-4xl font-black italic text-primary font-title tracking-tighter leading-none uppercase">{value}</p>
    </div>
  </motion.div>
);

const GoalCard: React.FC<{ label: string, current: number, target: number, color: string }> = ({ label, current, target, color }) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h5 className="text-[10px] font-black italic text-primary uppercase tracking-[0.2em] font-title">{label}</h5>
          <p className="text-2xl font-black italic text-primary font-title leading-none mt-2">
            {current} <span className="text-primary/10 text-sm">/ {target}</span>
          </p>
        </div>
        <span className="text-[10px] font-black italic text-primary/30 uppercase tracking-widest">{Math.round(percentage)}%</span>
      </div>
      <div className="h-4 bg-primary/[0.03] rounded-full overflow-hidden border border-primary/5 p-1">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} rounded-full shadow-[0_0_12px_rgba(15,76,92,0.2)]`}
        />
      </div>
    </div>
  );
};

interface Props {
  userName?: string;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  services: Service[];
  customers: Customer[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onNavigateToPromotions?: () => void;
}

const DashboardView: React.FC<Props> = ({ 
  userName,
  appointments, 
  setAppointments,
  services, 
  customers, 
  setTransactions,
  onNavigateToPromotions 
}) => {
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Serviço';
  const getServicePrice = (id: string) => services.find(s => s.id === id)?.price || 0;

  // Filtra apenas agendamentos de hoje (ignora cancelados e completados)
  const today = new Date().toLocaleDateString('en-CA');
  const todayAppointments = appointments.filter(a => 
    a.date.startsWith(today) && 
    a.status !== 'cancelled' && 
    a.status !== 'completed'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedApts = appointments.filter(a => a.status === 'completed');
  const totalRevenue = completedApts.reduce((acc, apt) => acc + getServicePrice(apt.serviceId), 0);
  
  // Estatísticas de serviços prestados
  const serviceStats = services.map(s => {
    const count = completedApts.filter(a => a.serviceId === s.id).length;
    return { name: s.name, count };
  }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  const handleFinishAppointment = async (apt: Appointment) => {
    try {
      const updated = await appointmentsApi.complete(apt.id);
      
      const price = getServicePrice(apt.serviceId);
      setAppointments(prev => prev.map(a => a.id === apt.id ? updated : a));
      
      // We don't need to manually create transaction here as backend does it
      // But we might want to refresh transactions if the parent component needs it
      // For now, let's just show success
      toast.success(`Serviço de ${apt.clientName} finalizado! +R$ ${price}`);
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      toast.error("Erro ao processar finalização.");
    }
  };

  return (
    <div className="space-y-12 sm:space-y-20 max-w-[1400px] mx-auto pb-20">
      {/* Header Elite */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-1 px-4 bg-cta rounded-full"></div>
             <span className="text-[10px] font-black italic text-cta uppercase tracking-[0.4em]">Intelligence Dashboard</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black italic uppercase text-primary font-title tracking-tighter leading-none">
            {new Date().getHours() < 12 ? 'Bom Dia,' : 'Boa Tarde,'} <span className="text-primary/20">{userName?.split(' ')[0] || 'Mestre'}</span>
          </h2>
          <p className="text-[10px] font-black italic text-primary/30 uppercase mt-4 tracking-[0.2em] ml-1">Performance consolidada de hoje</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-primary/5 p-2 rounded-[28px] shadow-sm">
            <div className="px-6 py-3 bg-primary/[0.02] rounded-[20px] border border-primary/5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black italic text-primary uppercase tracking-widest leading-none">Status: Operacional</span>
            </div>
        </div>
      </header>

      {/* Grid de Stats Elite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <StatCard title="Ganhos Acumulados" value={`R$ ${totalRevenue.toLocaleString()}`} icon={<Wallet className="text-white" size={24} />} trend="+12.5%" />
        <StatCard title="Cortes Finalizados" value={completedApts.length.toString()} icon={<CheckCircle2 className="text-white" size={24} />} trend="+3" />
        <div className="hidden lg:block">
            <StatCard title="Tempo Médio" value="45min" icon={<Clock className="text-white" size={24} />} color="cta" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-start">
        {/* Coluna Principal: Feed de Hoje */}
        <section className="col-span-1 lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <ListOrdered size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-primary font-title tracking-tight leading-none">
                  Fila de Atendimento
                </h3>
            </div>
            <div className="hidden sm:flex items-center gap-3 bg-cta/5 px-4 py-2 rounded-full border border-cta/10">
                <span className="text-[9px] font-black italic text-cta uppercase tracking-[0.2em]">Deslize para Concluir</span>
            </div>
          </div>
          
          <div className="space-y-6">
             <AnimatePresence mode="popLayout">
                {todayAppointments.length > 0 ? (
                   todayAppointments.map((apt, idx) => (
                      <SwipeableAppointment 
                        key={apt.id} 
                        apt={apt} 
                        index={idx}
                        serviceName={getServiceName(apt.serviceId)} 
                        onFinish={() => handleFinishAppointment(apt)} 
                      />
                   ))
                ) : (
                   <motion.div 
                     key="empty"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="bg-white border border-primary/5 rounded-[48px] p-24 text-center shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)]"
                   >
                      <div className="w-24 h-24 rounded-full bg-primary/[0.02] flex items-center justify-center mx-auto mb-10 border border-primary/5">
                        <CheckCircle2 size={48} className="text-primary/10" strokeWidth={1} />
                      </div>
                      <p className="text-primary font-black italic font-title text-3xl uppercase tracking-tighter">Fluxo Limpo</p>
                      <p className="text-primary/30 font-black italic uppercase text-[10px] tracking-[0.3em] mt-4">Todos os clientes foram atendidos com excelência</p>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
        </section>

        {/* Coluna Lateral: Metas e Insights */}
        <section className="col-span-1 lg:col-span-4 space-y-12">
          {/* Metas Pro */}
          <div className="bg-white border border-primary/5 rounded-[48px] p-10 sm:p-12 shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)]">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Trophy size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-primary/30 font-title">Metas do Ciclo</h3>
            </div>
            <div className="space-y-12">
              <GoalCard label="Total de Cortes" current={completedApts.length} target={15} color="bg-primary" />
              <GoalCard label="Faturamento" current={totalRevenue} target={1500} color="bg-cta" />
            </div>
          </div>

          {/* Ranking de Serviços */}
          <div className="bg-white border border-primary/5 rounded-[48px] p-10 sm:p-12 shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)] overflow-hidden relative">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-xl bg-cta/10 flex items-center justify-center text-cta">
                    <TrendingUp size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-primary/30 font-title">Mix de Performance</h3>
            </div>
            <div className="space-y-4">
              {serviceStats.slice(0, 4).map((stat, idx) => (
                <div key={stat.name} className="flex justify-between items-center bg-background p-6 rounded-[28px] border border-primary/5 group hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-primary/10 font-title italic">0{idx + 1}</span>
                    <span className="text-sm font-black italic uppercase text-primary font-title truncate max-w-[140px]">{stat.name}</span>
                  </div>
                  <div className="flex items-end gap-1.5 leading-none">
                    <span className="text-lg font-black italic text-primary font-title">{stat.count}</span>
                    <span className="text-[9px] font-black uppercase text-primary/20 tracking-tighter mb-1 font-title">pts</span>
                  </div>
                </div>
              ))}
              {serviceStats.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-primary/5 rounded-[32px]">
                   <p className="text-[10px] font-black italic text-primary/10 uppercase tracking-widest leading-relaxed">Aguardando registro de dados para análise de performance</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Insights Elite */}
          <div className="bg-primary border border-primary/10 rounded-[48px] p-10 sm:p-12 relative overflow-hidden group shadow-[0_32px_64px_-16px_rgba(15,76,92,0.3)]">
             <div className="absolute -top-10 -right-10 opacity-[0.05] group-hover:scale-110 transition-transform text-white">
                 <Megaphone size={160} />
             </div>
             <h4 className="text-white font-black italic text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center gap-3 relative z-10 font-title">
                <div className="w-1.5 h-1.5 rounded-full bg-cta shadow-[0_0_12px_rgba(230,126,34,1)] animate-pulse"></div>
                Dica Profissional
             </h4>
             <p className="text-lg text-white/80 leading-snug font-black italic uppercase tracking-tight relative z-10 font-title">
                "Seus clientes VIPs reduziram a frequência cardíaca na agenda. Reative o fluxo via WhatsApp VIP."
             </p>
             <button className="mt-8 flex items-center gap-3 text-cta text-[10px] font-black italic uppercase tracking-[0.2em] group/btn relative z-10">
                Gerar Link de Recontato <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" strokeWidth={3} />
             </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardView;

