import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Scissors, 
  Calendar, 
  Check, 
  LayoutDashboard,
  Bot,
  CreditCard,
  Menu,
  X,
  Instagram,
  ChevronRight,
  Star,
  Clock,
  Smartphone,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/newlogo-white.png';
import heroBarber from '../assets/barber.jpg';
import agendamentoImg from '../assets/agendamento.jpg';
import atendimentoImg from '../assets/atendimento.jpg';
import financeiroImg from '../assets/financeiro.jpg';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const plans = [
        {
            name: "Básico",
            price: "39,90",
            checkoutUrl: "https://pay.cakto.com.br/e7rcvpm_734162",
            features: [
                "Agenda para 1 barbeiro",
                "Página de agendamento online",
                "Controle de clientes",
                "Relatórios simples"
            ],
            popular: false
        },
        {
            name: "Equipe",
            price: "49,90",
            checkoutUrl: "https://pay.cakto.com.br/eusjvvu",
            features: [
                "Múltiplos barbeiros",
                "Controle de estoque",
                "Comissões automáticas",
                "Financeiro completo"
            ],
            popular: false
        },
        {
            name: "IA Pro",
            price: "79,90",
            checkoutUrl: "https://pay.cakto.com.br/5s2vk4i",
            features: [
                "Atendente IA no WhatsApp",
                "Agendamento 24h",
                "Responde dúvidas",
                "Recupera clientes"
            ],
            popular: true
        }
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className="min-h-screen bg-background font-sans text-text selection:bg-cta selection:text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md py-5 px-6 md:px-12 flex justify-between items-center shadow-2xl shadow-primary/20 border-b border-white/5">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <img src={brandLogo} alt="AutoOpera Logo" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-title font-black text-xl tracking-tighter text-white italic uppercase leading-none">Auto Opera</span>
                        <span className="text-[10px] font-black text-cta uppercase tracking-[0.3em] mt-0.5 ml-0.5">Barber</span>
                    </div>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-10 text-white/70 text-[11px] font-black uppercase tracking-[0.2em]">
                    <a href="#facilidades" className="hover:text-cta transition-colors italic">Facilidades</a>
                    <a href="#precos" className="hover:text-cta transition-colors italic">Preços</a>
                    <button 
                        onClick={() => navigate('/login')}
                        className="hover:text-white transition-colors border-l border-white/10 pl-10"
                    >
                        Entrar
                    </button>
                    <button 
                        onClick={() => navigate('/register-barber')}
                        className="bg-cta text-white px-8 py-3.5 rounded-[18px] font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cta/20 italic"
                    >
                        COMEÇAR AGORA
                    </button>
                </nav>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-white bg-white/5 p-2 rounded-xl" onClick={toggleMenu}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-primary pt-28 px-8 md:hidden"
                    >
                        <nav className="flex flex-col gap-8 text-white text-2xl font-black italic uppercase font-title tracking-tighter">
                            <a href="#facilidades" onClick={toggleMenu} className="border-b border-white/5 pb-6 flex justify-between items-center">Facilidades <ChevronRight className="text-cta" /></a>
                            <a href="#precos" onClick={toggleMenu} className="border-b border-white/5 pb-6 flex justify-between items-center">Preços <ChevronRight className="text-cta" /></a>
                            <button onClick={() => navigate('/login')} className="text-left border-b border-white/5 pb-6 flex justify-between items-center">Entrar <ChevronRight className="text-cta" /></button>
                            <button 
                                onClick={() => navigate('/register-barber')}
                                className="bg-cta text-white py-6 rounded-[24px] font-black shadow-2xl shadow-cta/30 text-center mt-4 text-sm tracking-widest"
                            >
                                EXPERIMENTAR GRÁTIS
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section className="relative pt-44 pb-32 px-6 md:px-12 overflow-hidden bg-white">
                {/* Background Branding Decorativo */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.03]">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary blur-[160px] rounded-full" />
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0F4C5C 1px, transparent 0)', backgroundSize: '48px 48px' }} />
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-col items-center text-center">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-primary/5 border border-primary/10 rounded-full mb-8"
                        >
                            <span className="w-2 h-2 bg-cta rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Lançamento AutoOpera 2.0</span>
                        </motion.div>

                        <motion.h1 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="font-title text-5xl md:text-8xl font-black leading-[0.9] mb-8 text-text tracking-tighter uppercase italic"
                        >
                            ELEVE O NÍVEL DA SUA <br /> 
                            <span className="text-primary">BARBEARIA</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl mb-12 text-text/60 max-w-2xl mx-auto font-medium leading-relaxed italic"
                        >
                            O sistema definitivo para barbearias premium. Automatize sua agenda, encante seus clientes com IA e tome o controle total do seu faturamento.
                        </motion.p>
                        
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col md:flex-row justify-center gap-6 w-full max-w-lg"
                        >
                            <button 
                                onClick={() => navigate('/register-barber')}
                                className="flex-1 bg-cta text-white text-[11px] tracking-[0.2em] font-black py-6 rounded-[24px] shadow-2xl shadow-cta/30 hover:scale-105 active:scale-95 transition-all uppercase italic"
                            >
                                TESTE GRÁTIS POR 15 DIAS
                            </button>
                            <button 
                                onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
                                className="flex-1 border-2 border-primary/10 text-primary text-[11px] tracking-[0.2em] font-black py-6 rounded-[24px] hover:bg-primary hover:text-white transition-all uppercase italic"
                            >
                                CONHECER PLANOS
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Practical Benefits - Cards */}
            <section id="facilidades" className="py-24 px-6 md:px-12 bg-background relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-20 space-y-4">
                        <span className="text-cta font-black text-[10px] tracking-[0.4em] uppercase italic">Funcionalidades Elite</span>
                        <h2 className="font-title text-4xl md:text-6xl font-black text-text italic uppercase tracking-tighter">O PODER DA TRADIÇÃO COM TECNOLOGIA</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-10 rounded-[48px] border border-border shadow-[0_24px_48px_-12px_rgba(15,76,92,0.08)] group hover:-translate-y-2 transition-all duration-500">
                            <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                                <Calendar size={32} />
                            </div>
                            <h3 className="font-title text-2xl font-black mb-4 uppercase italic tracking-tight">Agenda Online 24h</h3>
                            <p className="text-text/50 leading-relaxed font-medium italic">
                                Link premium para sua Bio. Seus clientes agendam em segundos, sem você precisar tocar no celular.
                            </p>
                        </div>

                        <div className="bg-white p-10 rounded-[48px] border border-border shadow-[0_24px_48px_-12px_rgba(15,76,92,0.08)] group hover:-translate-y-2 transition-all duration-500">
                            <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                                <LayoutDashboard size={32} />
                            </div>
                            <h3 className="font-title text-2xl font-black mb-4 uppercase italic tracking-tight">Gestão de Mestres</h3>
                            <p className="text-text/50 leading-relaxed font-medium italic">
                                Controle comissões, folgas e performance de cada barbeiro da sua equipe em tempo real.
                            </p>
                        </div>

                        <div className="bg-white p-10 rounded-[48px] border border-border shadow-[0_24px_48px_-12px_rgba(15,76,92,0.08)] group hover:-translate-y-2 transition-all duration-500">
                            <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                                <Bot size={32} />
                            </div>
                            <h3 className="font-title text-2xl font-black mb-4 uppercase italic tracking-tight">Secretária IA</h3>
                            <p className="text-text/50 leading-relaxed font-medium italic">
                                Uma assistente treinada que atende seus clientes no WhatsApp, tira dúvidas e converte novos agendamentos.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Image Sections - Simplified */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-32">
                        <div className="space-y-8">
                            <span className="text-cta font-black text-[10px] tracking-[0.4em] uppercase italic">Controle Absoluto</span>
                            <h2 className="font-title text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">SEU FINANCEIRO NA PONTA DA TESOURA</h2>
                            <p className="text-lg text-text/50 leading-relaxed font-medium italic">
                                Chega de planilhas. Saiba exatamente seu lucro líquido, controle seu estoque de produtos e pague comissões com um clique.
                            </p>
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-4 bg-background p-4 rounded-2xl border border-border/50">
                                    <div className="w-10 h-10 bg-cta/10 rounded-xl flex items-center justify-center text-cta">
                                        <Check size={20} />
                                    </div>
                                    <span className="font-black text-xs uppercase tracking-widest italic">Fluxo de Caixa Automatizado</span>
                                </div>
                                <div className="flex items-center gap-4 bg-background p-4 rounded-2xl border border-border/50">
                                    <div className="w-10 h-10 bg-cta/10 rounded-xl flex items-center justify-center text-cta">
                                        <Check size={20} />
                                    </div>
                                    <span className="font-black text-xs uppercase tracking-widest italic">Relatórios de Faturamento por Barbeiro</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full" />
                            <div className="relative bg-white p-4 rounded-[48px] shadow-2xl border border-border overflow-hidden">
                                <img src={financeiroImg} alt="Financeiro" className="w-full h-auto rounded-[32px] grayscale hover:grayscale-0 transition-all duration-700" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div className="order-2 md:order-1 relative">
                             <div className="absolute inset-0 bg-cta/10 blur-[120px] rounded-full" />
                            <div className="relative bg-white p-4 rounded-[48px] shadow-2xl border border-border overflow-hidden">
                                <img src={atendimentoImg} alt="Atendimento IA" className="w-full h-auto rounded-[32px] grayscale hover:grayscale-0 transition-all duration-700" />
                            </div>
                        </div>
                        <div className="order-1 md:order-2 space-y-8">
                            <span className="text-cta font-black text-[10px] tracking-[0.4em] uppercase italic">Inovação Disruptiva</span>
                            <h2 className="font-title text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">ATENDIMENTO QUE NUNCA DORME</h2>
                            <p className="text-lg text-text/50 leading-relaxed font-medium italic">
                                Nossa IA conversa como um mestre barbeiro no WhatsApp. Ela entende gírias, tira dúvidas sobre serviços e marca horários sozinha.
                            </p>
                            <div className="p-8 bg-primary text-white rounded-[40px] italic shadow-2xl shadow-primary/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Bot size={80} />
                                </div>
                                <p className="relative z-10 text-xl font-medium mb-4">"Reduzi as faltas em 40% com os alertas automáticos da IA. É como ter um gerente 24h."</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-cta shadow-lg" />
                                    <span className="font-black text-[10px] tracking-widest uppercase">Mestre Ricco, Dono de Unidade</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="precos" className="py-24 px-6 md:px-12 bg-background relative overflow-hidden">
                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <span className="text-cta font-black text-[10px] tracking-[0.4em] uppercase italic">Investimento Inteligente</span>
                    <h2 className="font-title text-4xl md:text-6xl font-black mb-6 italic uppercase tracking-tighter">PLANOS ESPECIAIS</h2>
                    <p className="text-lg text-text/50 mb-20 italic">A tecnologia de elite acessível para todo o mestre barbeiro.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan, i) => (
                            <div 
                                key={i} 
                                className={`bg-white p-12 rounded-[48px] border-2 flex flex-col transition-all duration-500 hover:shadow-2xl ${
                                    plan.popular 
                                    ? 'border-cta shadow-2xl scale-105 relative z-10' 
                                    : 'border-border shadow-sm hover:border-primary/20'
                                }`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cta text-white text-[9px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg italic">
                                        O Mais Desejado
                                    </span>
                                )}
                                <h3 className="font-title text-3xl font-black mb-2 italic uppercase tracking-tight">{plan.name}</h3>
                                <div className="mb-10 pt-4 border-b border-border pb-8">
                                    <span className="text-[10px] font-black text-text/30 items-start mr-1 tracking-widest">R$</span>
                                    <span className="text-7xl font-black text-primary font-title italic tracking-tighter">{plan.price}</span>
                                    <span className="text-[10px] font-black text-text/30 ml-1 tracking-widest uppercase">/mês</span>
                                </div>
                                <ul className="text-left space-y-5 mb-12 flex-1 pt-4">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-4 text-xs font-black text-text/60 italic uppercase tracking-tighter">
                                            <div className="w-5 h-5 bg-cta/10 rounded-full flex items-center justify-center text-cta shadow-sm">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button 
                                    onClick={() => window.location.href = plan.checkoutUrl}
                                    className={`w-full py-6 rounded-[24px] font-black transition-all text-[11px] tracking-[0.2em] uppercase italic shadow-lg ${
                                        plan.popular 
                                        ? 'bg-cta text-white shadow-cta/20 hover:scale-105' 
                                        : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                                    }`}
                                >
                                    ASSINAR AGORA
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-6 md:px-12 bg-white text-center">
                <div className="max-w-4xl mx-auto">
                    <span className="text-cta font-black text-[10px] tracking-[0.4em] uppercase italic">Comunidade Flow</span>
                    <h2 className="font-title text-4xl font-black mb-16 italic uppercase tracking-tighter">QUEM USA, RECOMENDA</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="bg-background p-10 rounded-[40px] text-left border border-border group hover:border-primary/20 transition-all duration-500 shadow-sm">
                            <div className="flex gap-1 text-cta mb-6">
                                <Star fill="currentColor" size={18} />
                                <Star fill="currentColor" size={18} />
                                <Star fill="currentColor" size={18} />
                                <Star fill="currentColor" size={18} />
                                <Star fill="currentColor" size={18} />
                            </div>
                            <p className="italic text-xl font-medium mb-8 text-text/70 leading-relaxed">"O sistema de IA mudou o jogo. Meus clientes agendam de madrugada e eu só vejo o faturamento crescendo."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl" />
                                <div>
                                    <p className="font-black text-sm uppercase tracking-tight italic">Ricardo Silva</p>
                                    <p className="text-xs text-text/30 uppercase tracking-widest font-black">Legacy Barbershop</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-background p-10 rounded-[40px] text-left border border-border group hover:border-primary/20 transition-all duration-500 shadow-sm">
                            <div className="flex gap-1 text-cta mb-6">
                                <Star fill="currentColor" size={18} />
                                <Star fill="currentColor" size={18} />
                                <Star fill="currentColor" size={18} />
                                <Star fill="currentColor" size={18} />
                                <Star fill="currentColor" size={18} />
                            </div>
                            <p className="italic text-xl font-medium mb-8 text-text/70 leading-relaxed">"Muito fácil de usar. Meus barbeiros amaram a facilidade do link de agendamento."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl" />
                                <div>
                                    <p className="font-black text-sm uppercase tracking-tight italic">Carlos Magno</p>
                                    <p className="text-xs text-text/30 uppercase tracking-widest font-black">Urban Style</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-4 md:px-8 bg-primary text-white text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-title text-3xl md:text-5xl font-bold mb-6 italic uppercase tracking-tighter">PRONTO PARA TRANSFORMAR SEU NEGÓCIO?</h2>
                    <p className="text-xl md:text-2xl opacity-90 mb-10 italic">Experimente o poder do AutoOpera por 15 dias sem custo.</p>
                    <button 
                        onClick={() => navigate('/register-barber')}
                        className="bg-cta text-white text-[12px] font-black tracking-[0.2em] py-6 px-16 rounded-[24px] shadow-2xl hover:scale-105 transition-transform uppercase italic"
                    >
                        COMEÇAR MEU TESTE GRÁTIS
                    </button>
                    <div className="mt-8 flex items-center justify-center gap-6 opacity-60 text-[10px] font-black uppercase tracking-widest italic">
                        <span>Cartão de Crédito</span>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <span>Pix</span>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <span>Sem Compromisso</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 md:px-8 bg-white border-t border-border">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-2 rounded">
                            <img src={brandLogo} alt="AutoOpera" className="h-6 w-auto" />
                        </div>
                        <span className="font-title font-bold text-lg">AutoOpera | Barber</span>
                    </div>
                    <div className="flex gap-8 text-sm font-medium text-text/60">
                        <a href="#" className="hover:text-primary transition-colors">Instagram</a>
                        <a href="#" className="hover:text-primary transition-colors">Termos</a>
                        <a href="#" className="hover:text-primary transition-colors">Suporte</a>
                    </div>
                    <p className="text-xs text-text/40">© 2024 AutoOpera Barber. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
