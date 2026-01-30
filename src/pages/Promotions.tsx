
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
    <div className="space-y-6 animate-fadeIn max-w-[1200px] mx-auto px-2 sm:px-12 pb-10 sm:pb-32">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-5xl font-black tracking-tighter text-text font-title italic uppercase">Marketing & <span className="text-text/20">Crescimento</span></h2>
          <p className="text-[10px] sm:text-xs text-text/40 mt-2 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] italic">Potencialize sua marca com campanhas inteligentes.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-primary text-white px-8 sm:px-10 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-primary/20 active:scale-95 italic font-title"
        >
          <Plus size={18} />
          <span>Nova Campanha</span>
        </button>
      </header>

      {/* Campanhas Ativas */}
      <section className="space-y-4 sm:space-y-10">
        <div className="flex items-center justify-between px-2 sm:px-2">
           <h3 className="text-lg sm:text-xl font-black font-title italic uppercase tracking-tight text-text">Campanhas em Curso</h3>
           <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cta rounded-full animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cta italic font-title">{activePromos.length} ATIVAS</span>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
          {activePromos.map(promo => (
            <motion.div 
              key={promo.id}
              whileHover={{ y: -8 }}
              className="bg-white border border-border p-5 sm:p-8 rounded-[32px] sm:rounded-[48px] group relative overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,76,92,0.1)] transition-all duration-500"
            >
              <div className="absolute top-0 right-0 bg-cta text-white px-4 sm:px-6 py-1.5 sm:py-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] rounded-bl-xl sm:rounded-bl-[24px] italic font-title">Live Now</div>
              <h4 className="text-lg sm:text-2xl font-black text-text mb-4 sm:mb-8 tracking-tighter font-title italic uppercase">{promo.name}</h4>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-8">
                <div className="bg-background p-3 sm:p-5 rounded-2xl sm:rounded-[28px] border border-border/50 shadow-inner">
                  <p className="text-[8px] sm:text-[9px] text-text/20 uppercase font-black tracking-[0.2em] mb-1 italic">Alcance</p>
                  <p className="text-xl sm:text-2xl font-black text-text font-title italic tracking-tight">{promo.reach}</p>
                </div>
                <div className="bg-primary/5 p-3 sm:p-5 rounded-2xl sm:rounded-[28px] border border-primary/10 shadow-inner">
                  <p className="text-[8px] sm:text-[9px] text-primary/40 uppercase font-black tracking-[0.2em] mb-1 italic">Off</p>
                  <p className="text-xl sm:text-2xl font-black text-primary font-title italic tracking-tight">{promo.discount}%</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-background p-3 sm:p-5 rounded-2xl sm:rounded-[28px] border border-border/50">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary/20 group-hover:text-primary transition-colors">
                        <Users size={14} sm:size={16} />
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-black text-text/40 uppercase tracking-widest italic">{promo.targetAudience}</span>
                </div>
                <button className="text-cta text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all italic">Pausar</button>
              </div>
            </motion.div>
          ))}
          {activePromos.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 text-center py-24 bg-white border-2 border-dashed border-border rounded-[48px] text-text/20 font-black uppercase tracking-[0.4em] italic flex flex-col items-center gap-6">
              <Megaphone size={48} className="opacity-10" strokeWidth={1} />
              Nenhuma campanha ativa
            </div>
          )}
        </div>
      </section>

      {/* Histórico */}
      <section className="space-y-4 sm:space-y-8">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-base sm:text-xl font-black font-title italic uppercase tracking-tight text-text">Registro de Atividades</h3>
           <History size={16} className="sm:size-[18px] text-text/10" />
        </div>

        <div className="bg-white border border-border rounded-[24px] sm:rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,76,92,0.1)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 sm:px-10 sm:py-8 text-[8px] sm:text-[10px] font-black text-text/30 uppercase tracking-[0.2em] sm:tracking-[0.3em] italic">Campanha</th>
                  <th className="px-4 py-3 sm:px-10 sm:py-8 text-[8px] sm:text-[10px] font-black text-text/30 uppercase tracking-[0.2em] sm:tracking-[0.3em] italic">Estratégia</th>
                  <th className="px-4 py-3 sm:px-10 sm:py-8 text-[8px] sm:text-[10px] font-black text-text/30 uppercase tracking-[0.2em] sm:tracking-[0.3em] italic text-center">Impacto</th>
                  <th className="px-4 py-3 sm:px-10 sm:py-8 text-[8px] sm:text-[10px] font-black text-text/30 uppercase tracking-[0.2em] sm:tracking-[0.3em] italic text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {history.map(p => (
                  <tr key={p.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-4 py-3 sm:px-10 sm:py-8">
                      <div className="flex items-center gap-2 sm:gap-5">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-background border border-border/50 flex items-center justify-center text-text/10 group-hover:text-primary transition-colors shadow-inner">
                          <Target size={14} sm:size={20} />
                        </div>
                        <div>
                          <p className="font-black text-text text-[9px] sm:text-sm tracking-tighter uppercase italic leading-none">{p.name}</p>
                          <p className="text-[7px] sm:text-[9px] text-text/20 font-black uppercase tracking-[0.2em] mt-0.5 sm:mt-1 italic">{p.targetAudience}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-10 sm:py-8">
                      <div className="flex flex-col">
                        <span className="text-text text-[9px] sm:text-sm font-black italic uppercase tracking-tight">{services.find(s => s.id === p.serviceId)?.name}</span>
                        <span className="text-cta text-[7px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5">{p.discount}% OFF</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-10 sm:py-8 text-center">
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-background px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-border/50">
                        <TrendingUp size={10} sm:size={12} className="text-primary" />
                        <span className="text-text font-black text-[8px] sm:text-xs italic tracking-tighter uppercase">{p.reach} IMPACTOS</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-10 sm:py-8 text-right">
                       <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-widest italic border ${
                         p.status === 'active' ? 'bg-cta/5 border-cta/20 text-cta' : 'bg-text/5 border-border text-text/30 grayscale'
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
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-3xl z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white border border-border w-full max-w-5xl rounded-[56px] overflow-hidden shadow-[0_64px_128px_-32px_rgba(15,76,92,0.3)] relative max-h-[90vh] flex flex-col md:flex-row"
            >
                <div className="absolute top-8 right-8 z-30">
                    <button 
                        onClick={() => setIsCreating(false)}
                        className="p-3 bg-background hover:bg-cta hover:text-white rounded-2xl text-text/30 transition-all shadow-inner"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Section */}
                <div className="flex-[1.2] p-10 sm:p-16 border-r border-border overflow-y-auto">
                  <div className="mb-12">
                    <span className="text-cta font-black text-[10px] tracking-[0.4em] uppercase italic">Campanha Elite</span>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tighter text-text italic uppercase font-title mt-2">CONFIGURAR OFERTA</h3>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black text-text/30 tracking-[0.3em] ml-2 italic">Identificação da Promoção</label>
                      <input 
                        value={promoName} 
                        onChange={e => setPromoName(e.target.value)} 
                        placeholder="Ex: Mestre de Outono 2024" 
                        className="w-full bg-background border border-border rounded-[24px] px-8 py-5 text-text focus:border-primary outline-none transition-all placeholder:text-text/10 font-black italic uppercase tracking-tighter text-lg shadow-inner" 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-text/30 tracking-[0.3em] ml-2 italic">Serviço Âncora</label>
                        <select 
                            value={selectedService} 
                            onChange={e => setSelectedService(e.target.value)} 
                            className="w-full bg-background border border-border rounded-[24px] px-8 py-5 text-text focus:border-primary outline-none transition-all font-black italic uppercase tracking-tighter appearance-none shadow-inner"
                        >
                          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-text/30 tracking-[0.3em] ml-2 italic">Valor Off (%)</label>
                        <input 
                            type="number" 
                            value={discount} 
                            onChange={e => setDiscount(Number(e.target.value))} 
                            className="w-full bg-background border border-border rounded-[24px] px-8 py-5 text-text focus:border-primary outline-none transition-all font-black italic uppercase tracking-tighter text-lg shadow-inner text-cta" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black text-text/30 tracking-[0.3em] ml-2 italic">Estrato de Audiência</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['all', 'vip', 'inactive'] as const).map(aud => (
                          <button 
                            key={aud} 
                            onClick={() => setAudience(aud)} 
                            className={`py-5 text-[10px] font-black rounded-2xl border uppercase transition-all tracking-widest italic ${
                                audience === aud 
                                ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105' 
                                : 'bg-background text-text/30 border-border shadow-inner hover:border-primary/20'
                            }`}
                          >
                            {aud === 'all' ? 'Público Geral' : aud.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-16">
                    <button 
                      onClick={handleLaunch} 
                      className="w-full py-6 bg-cta text-white rounded-[24px] font-black hover:bg-cta/90 transition-all shadow-2xl shadow-cta/20 active:scale-[0.98] flex items-center justify-center gap-3 italic uppercase tracking-[0.3em] text-[11px]"
                    >
                      <Megaphone size={20} /> Ativar Campanha Agora
                    </button>
                    <button 
                      onClick={() => setIsCreating(false)} 
                      className="w-full py-4 text-text/30 hover:text-cta font-black transition-colors text-[10px] uppercase tracking-[0.4em] italic"
                    >
                      Descartar Alterações
                    </button>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="hidden lg:flex flex-1 bg-background p-16 flex-col justify-center items-center relative overflow-hidden">
                   {/* Background Decorativo */}
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.2]">
                        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary blur-[160px] rounded-full" />
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0F4C5C 1px, transparent 0)', backgroundSize: '48px 48px' }} />
                    </div>

                  <div className="relative z-10 w-full max-w-[340px]">
                    <span className="text-text/20 font-black text-[9px] tracking-[0.5em] uppercase mb-8 block text-center italic">WhatsApp Preview</span>
                    <div className="bg-[#E7FFDB] rounded-[40px] p-6 shadow-2xl shadow-black/5 border border-black/5">
                       <div className="space-y-4">
                          <p className="text-xs font-medium text-text italic">Saudações do Mestre! Faz tempo que você não aparece para elevar seu estilo... ✂️</p>
                          <div className="bg-white rounded-3xl p-5 shadow-lg border border-black/5 space-y-3">
                            <h5 className="font-black text-primary text-lg font-title italic uppercase tracking-tight">{promoName || 'CAMPA EXCLUSIVA'}</h5>
                            <p className="text-xs font-medium text-text/60 leading-relaxed italic">Ative seu cupom de <span className="font-black text-cta">{discount}% OFF</span> para o serviço de {services.find(s => s.id === selectedService)?.name || 'Corte'}!</p>
                            <div className="bg-primary rounded-2xl py-3.5 text-center text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 italic">
                                Agendar Elite
                            </div>
                          </div>
                       </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl mt-10 border border-border shadow-xl">
                      <div className="flex gap-4 items-center mb-3">
                        <div className="w-10 h-10 bg-cta/10 text-cta rounded-xl flex items-center justify-center">
                            <Smartphone size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cta italic">Smart Delivery</span>
                      </div>
                      <p className="text-[11px] text-text/40 leading-relaxed font-bold italic">Nossa IA processa os disparos individualmente para garantir 100% de entrega no WhatsApp do cliente.</p>
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
