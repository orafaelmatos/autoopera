
import React, { useState } from 'react';
import { Service, Customer, Promotion } from '../types';
import { 
  Megaphone, 
  Plus, 
  Users, 
  Calendar, 
  Percent, 
  MessageSquare, 
  Send, 
  History,
  CheckCircle,
  X,
  Smartphone,
  Info,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { promotionsApi } from '../api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  services: Service[];
  customers: Customer[];
}

const PromotionsView: React.FC<Props> = ({ services, customers }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [history, setHistory] = useState<Promotion[]>([]);

  // Carregar histórico ao abrir
  React.useEffect(() => {
    promotionsApi.getAll().then(setHistory).catch(console.error);
  }, []);

  // Form State
  const [promoName, setPromoName] = useState('');
  const [discount, setDiscount] = useState(10);
  const [selectedService, setSelectedService] = useState(services[0]?.id || '');
  const [audience, setAudience] = useState<'all' | 'vip' | 'inactive'>('all');

  const handleLaunch = async () => {
    try {
      const newPromo = await promotionsApi.create({
        name: promoName,
        discount: discount,
        serviceId: selectedService,
        targetAudience: audience,
        status: 'active',
        reach: Math.floor(Math.random() * 100) + 1 // Mock de alcance
      });
      setHistory([newPromo, ...history]);
      toast.success(`Promoção "${promoName}" lançada com sucesso!`);
      setIsCreating(false);
    } catch (error) {
      console.error("Erro ao lançar promoção:", error);
      toast.error("Erro ao lançar promoção");
    }
  };

  const activePromos = history.filter(p => p.status === 'active');

  return (
    <div className="space-y-12 animate-fadeIn max-w-[1200px] mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white">Marketing & <span className="text-gray-500">Promoções</span></h2>
          <p className="text-gray-500 mt-2 font-medium">Automatize suas campanhas e atraia mais clientes.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-accent text-white px-8 py-4 rounded-2xl text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#0063CC] transition-all shadow-xl shadow-accent/20 active:scale-95"
        >
          <Plus size={18} />
          <span>Nova Campanha</span>
        </button>
      </header>

      {/* Campanhas Ativas */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-xl font-bold tracking-tight text-white">Campanhas em Curso</h3>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent bg-accent/10 px-3 py-1 rounded-full">{activePromos.length} Ativas</span>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePromos.map(promo => (
            <motion.div 
              key={promo.id}
              whileHover={{ y: -4 }}
              className="bg-[#1c1c1e] border border-white/5 p-8 rounded-[32px] group relative overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 bg-accent text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">Ativa</div>
              <h4 className="text-2xl font-bold text-white mb-6 tracking-tight">{promo.name}</h4>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Alcance</p>
                  <p className="text-2xl font-bold text-white tracking-tight">{promo.reach}</p>
                </div>
                <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Desconto</p>
                  <p className="text-2xl font-bold text-accent tracking-tight">{promo.discount}%</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Público: {promo.targetAudience}</span>
                <button className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-400 transition-colors">Pausar</button>
              </div>
            </motion.div>
          ))}
          {activePromos.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-[#1c1c1e] border border-dashed border-white/5 rounded-[32px] text-gray-600 font-medium">
              Nenhuma campanha ativa no momento.
            </div>
          )}
        </div>
      </section>

      {/* Histórico */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-xl font-bold tracking-tight text-white font-medium">Histórico de Disparos</h3>
        </div>

        <div className="bg-[#1c1c1e] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Campanha / Público</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estratégia</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Conversão</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-gray-500">
                          <Target size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-white tracking-tight">{p.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{p.targetAudience}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-bold tracking-tight">{services.find(s => s.id === p.serviceId)?.name}</span>
                        <span className="text-accent text-[10px] font-black uppercase tracking-widest">{p.discount}% OFF</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-green-500" />
                        <span className="text-white font-bold tracking-tight">{p.reach} Disparos</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         p.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-600'
                       }`}>
                         {p.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal: Criar Campanha */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1c1c1e] border border-white/5 w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsCreating(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all z-20"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col lg:flex-row min-h-full">
                {/* Form Section */}
                <div className="flex-1 p-6 sm:p-12 border-r border-white/5">
                  <div className="mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">Nova Campanha</h3>
                    <p className="text-gray-500 font-medium text-sm sm:text-base">Configure sua oferta e o público-alvo.</p>
                  </div>
                  
                  <div className="space-y-5 sm:space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Nome da Promoção</label>
                      <input value={promoName} onChange={e => setPromoName(e.target.value)} placeholder="Ex: Black Friday 2024" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all placeholder:text-gray-700 font-medium" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Serviço de Foco</label>
                        <select value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all font-medium">
                          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Desconto (%)</label>
                        <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 sm:py-4 text-white focus:border-accent/50 outline-none transition-all font-medium" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-2">Público-Alvo</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['all', 'vip', 'inactive'] as const).map(aud => (
                          <button key={aud} onClick={() => setAudience(aud)} className={`py-4 text-[10px] font-black rounded-2xl border uppercase transition-all ${audience === aud ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-black/20 text-gray-600 border-white/5'}`}>{aud === 'all' ? 'Ver Todos' : aud}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-10">
                    <button 
                      onClick={handleLaunch} 
                      className="w-full py-4 sm:py-5 bg-accent text-white rounded-2xl font-bold hover:bg-[#0063CC] transition-all shadow-xl shadow-accent/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Megaphone size={18} /> Lançar Campanha
                    </button>
                    <button 
                      onClick={() => setIsCreating(false)} 
                      className="w-full py-3 text-gray-500 hover:text-white font-bold transition-colors text-sm uppercase tracking-[0.2em]"
                    >
                      Voltar
                    </button>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="hidden lg:flex flex-1 bg-black/40 p-12 flex-col justify-center">
                  <div className="relative max-w-[320px] mx-auto">
                    <div className="bg-[#075e54] rounded-[48px] p-6 shadow-2xl border-[10px] border-[#1c1c1e]">
                       <div className="bg-white/10 rounded-[32px] p-6 text-white space-y-4 backdrop-blur-md border border-white/10 shadow-lg">
                          <p className="text-xs font-medium opacity-80">Olá! Notamos que faz tempo que não nos vemos... ✂️</p>
                          <p className="text-sm font-bold text-accent bg-white rounded-xl p-3 shadow-md">{promoName || 'Campanha Exclusiva'}</p>
                          <p className="text-xs font-medium leading-relaxed">Ganhe <span className="font-black text-accent">{discount}% de desconto</span> no serviço de {services.find(s => s.id === selectedService)?.name}!</p>
                          <div className="bg-accent rounded-2xl py-3 text-center text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/30">
                            Agendar Agora
                          </div>
                       </div>
                    </div>
                    <div className="bg-[#1c1c1e] p-6 rounded-[32px] mt-8 border border-white/5">
                      <div className="flex gap-4 items-center mb-2">
                        <Info size={18} className="text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent">Automatização</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Os disparos são feitos individualmente para evitar o bloqueio do seu WhatsApp.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromotionsView;
