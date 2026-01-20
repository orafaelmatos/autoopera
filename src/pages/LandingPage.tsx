import React from 'react';
import { motion } from 'framer-motion';
import { 
  Scissors, 
  Calendar, 
  ArrowRight, 
  Check, 
  Smartphone, 
  Zap, 
  MessageSquare,
  History,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Cpu,
  MousePointer2,
  Bot,
  Users,
  CreditCard,
  Target,
  Sparkles,
  ChevronRight,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/logo-removebg-preview.png';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const plans = [
        {
            name: "Básico",
            price: "39,90",
            checkoutUrl: "https://pay.cakto.com.br/e7rcvpm_734162", // Substituir pelos links reais do Cacto
            features: [
                "Agenda para 1 barbeiro",
                "Página de agendamento online",
                "Controle financeiro básico",
                "Gestão de clientes",
                "Relatórios de faturamento"
            ],
            color: "gray"
        },
        {
            name: "Equipe",
            price: "49,90",
            checkoutUrl: "https://pay.cakto.com.br/eusjvvu", // Substituir pelos links reais do Cacto
            features: [
                "Múltiplos barbeiros",
                "Controle de estoque pro",
                "Comissões automáticas",
                "Financeiro completo (DRE)",
                "Tudo do plano Básico"
            ],
            color: "blue"
        },
        {
            name: "IA Pro",
            price: "79,90",
            checkoutUrl: "https://pay.cakto.com.br/5s2vk4i", // Substituir pelos links reais do Cacto
            popular: true,
            features: [
                "Agente de IA via WhatsApp",
                "Agendamento 24h humanizado",
                "Responde dúvidas de clientes",
                "Recuperação de clientes",
                "Tudo do plano Equipe"
            ],
            color: "blue"
        }
    ];

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] selection:bg-[#007AFF]/10">
            {/* Header / Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center transition-all">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                        <img src={brandLogo} alt="AutoOpera" className="h-6 md:h-7 w-auto object-contain" />
                        <div className="w-px h-5 bg-[#007AFF]" />
                        <span className="text-lg font-bold text-[#007AFF] tracking-tighter">Barber</span>
                    </div>
                </div>
                
                <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
                    <a href="#features" className="hover:text-[#007AFF] transition-colors">Funções</a>
                    <a href="#how" className="hover:text-[#007AFF] transition-colors">Sobre</a>
                    <a href="#pricing" className="hover:text-[#007AFF] transition-colors">Preços</a>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/login')}
                        className="hidden sm:block text-[11px] font-black uppercase tracking-[0.3em] text-gray-900 hover:text-[#007AFF] transition-colors"
                    >
                        Acessar
                    </button>
                    <button 
                        onClick={() => navigate('/register-barber')}
                        className="bg-[#007AFF] text-white px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#0056b3] transition-all active:scale-95 shadow-lg shadow-[#007AFF]/20"
                    >
                        Teste Grátis
                    </button>
                </div>
            </header>

            {/* Hero Section - Image Background */}
            <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center px-4 md:px-12 overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2070" 
                        alt="Barber Background" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#001A33]/85" />
                    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white to-transparent" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center mt-12 md:-mt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#007AFF]/20 backdrop-blur-md px-4 md:px-6 py-2 rounded-full border border-[#007AFF]/30 mb-6"
                    >
                        <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Mais que um sistema, sua barbearia com inteligência</span>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-[88px] font-black tracking-tighter leading-[1] md:leading-[0.9] text-white mb-4 md:mb-6"
                    >
                        Gestão completa para <span className="text-[#007AFF]">sua barbearia voar.</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/80 text-lg md:text-2xl font-medium max-w-4xl mb-10 md:mb-12 tracking-tight px-4"
                    >
                        Agenda, financeiro, estoque e atendimento automático via WhatsApp. O sistema definitivo para barbearias de todos os tamanhos — do solo ao mestre.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center gap-8 w-full px-4"
                    >
                        <button 
                            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full md:w-auto bg-[#007AFF] text-white px-8 md:px-16 py-5 rounded-lg text-[14px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-[#0063CC] transition-all active:scale-95"
                        >
                            Ver Planos e Assinar
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* About Section - Matches the "Sobre o AppBarber" styling */}
            <section id="how" className="py-32 px-6 md:px-12 bg-white text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black text-[#1D1D1F] mb-12 tracking-tight">Dez ferramentas em uma única plataforma</h2>
                    <p className="text-[#86868B] text-lg md:text-xl font-medium leading-relaxed mb-6">
                        Chega de usar planilhas, cadernos e três aplicativos diferentes. O AutoOpera Barber centraliza tudo o que sua barbearia precisa, seja você um profissional autônomo ou dono de uma rede com várias cadeiras.
                    </p>
                    <p className="text-[#86868B] text-lg md:text-xl font-medium leading-relaxed font-bold text-[#007AFF]">
                        Gestão simplificada para você focar no que realmente importa: o seu talento.
                    </p>
                </div>
            </section>

            {/* The rest of the page remains consistent */}
            {/* Trusted By / Social Proof */}
            <section className="py-20 border-b border-gray-50 bg-[#F5F5F7]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-10">Confiado por centenas de barbeiros em todo o Brasil</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale transition-all">
                        <span className="text-2xl font-black text-black">LEGACY</span>
                        <span className="text-2xl font-black text-black">URBAN</span>
                        <span className="text-2xl font-black text-black">CLASSIC</span>
                        <span className="text-2xl font-black text-black">NAVY</span>
                        <span className="text-2xl font-black text-black">ROADS</span>
                    </div>
                </div>
            </section>

            {/* Features / Benefits */}
            <section id="features" className="py-20 md:py-40 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 md:gap-32 items-center mb-24 md:mb-40">
                        <motion.div 
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#007AFF]/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-[#007AFF] mb-6 md:mb-8">
                                <Zap size={28} className="md:w-8 md:h-8" />
                            </div>
                            <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.1]">Agendamento em <br /> tempo real.</h2>
                            <p className="text-[#86868B] text-lg md:text-xl font-medium leading-relaxed mb-8 md:mb-10">
                                Link público personalizado para o seu Instagram. O cliente vê os horários disponíveis de cada barbeiro e agenda em segundos.
                            </p>
                            <ul className="space-y-4">
                                {["Regras de limpeza pós-serviço", "Bloqueio automático de feriados", "Cancelamento flexível"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 font-bold text-sm">
                                        <Check className="text-[#007AFF]" size={18} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <div className="bg-[#F5F5F7] aspect-square rounded-[40px] md:rounded-[64px] border border-gray-100 flex items-center justify-center shadow-inner overflow-hidden group">
                             <img 
                                src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=2070" 
                                alt="Agendamento" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                             />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 md:gap-32 items-center mb-24 md:mb-40">
                        <div className="order-2 md:order-1 bg-[#F5F5F7] aspect-square rounded-[40px] md:rounded-[64px] border border-gray-100 flex items-center justify-center shadow-inner overflow-hidden group">
                             <img 
                                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=2072" 
                                alt="Financeiro e Estoque" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                             />
                        </div>
                        <motion.div 
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 md:order-2"
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#007AFF]/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-[#007AFF] mb-6 md:mb-8">
                                <LayoutDashboard size={28} className="md:w-8 md:h-8" />
                            </div>
                            <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.1]">Financeiro e Estoque <br /> sob controle.</h2>
                            <p className="text-[#86868B] text-lg md:text-xl font-medium leading-relaxed mb-8 md:mb-10">
                                Saiba exatamente quanto entra e quanto sai. Controle seu estoque de produtos, comissões de barbeiros e faturamento diário em um dashboard intuitivo.
                            </p>
                            <ul className="space-y-4">
                                {["Cálculo automático de comissões", "Alerta de estoque baixo", "Fluxo de caixa em tempo real"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 font-bold text-sm">
                                        <Check className="text-[#007AFF]" size={18} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 md:gap-32 items-center">
                        <div className="order-2 md:order-1 bg-[#F5F5F7] aspect-square rounded-[40px] md:rounded-[64px] border border-gray-100 flex items-center justify-center shadow-inner overflow-hidden group">
                             <img 
                                src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=2070" 
                                alt="IA no WhatsApp" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                             />
                        </div>
                        <motion.div 
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-1 md:order-2"
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#007AFF]/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-[#007AFF] mb-6 md:mb-8">
                                <Bot size={28} className="md:w-8 md:h-8" />
                            </div>
                            <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.1]">Atendimento Humanizado <br /> via WhatsApp.</h2>
                            <p className="text-[#86868B] text-lg md:text-xl font-medium leading-relaxed mb-8 md:mb-10">
                                Não é apenas um robô. É uma inteligência que conversa, entende gírias e trata seu cliente com a atenção que ele merece. Ela agenda, cancela e tira dúvidas mesmo enquanto você está cortando cabelo ou dormindo.
                            </p>
                            <div className="p-6 bg-[#007AFF]/5 rounded-[32px] border border-[#007AFF]/10">
                                <p className="text-sm font-bold text-[#007AFF] italic text-center md:text-left">"A IA da AutoOpera não parece um robô, meus clientes acham que é uma secretária real atendendo."</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How it Works - Steps */}
            <section id="how" className="py-20 md:py-40 px-6 md:px-12 bg-[#F5F5F7]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 md:mb-24">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-[#007AFF] mb-4">O Caminho</h2>
                        <h3 className="text-3xl md:text-6xl font-black tracking-tight text-[#1D1D1F]">Comece a vender em minutos.</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
                        {[
                            { step: "01", icon: <Building2 />, title: "Gestão Total", desc: "Cadastre sua equipe, serviços, produtos e estoque em minutos." },
                            { step: "02", icon: <Target />, title: "Divulgação", desc: "Use seu link de agendamento no Instagram e converta seguidores em clientes." },
                            { step: "03", icon: <Bot />, title: "IA Ativa", desc: "Deixe nossa IA atender, tirar dúvidas e agendar pelo seu WhatsApp." },
                            { step: "04", icon: <LayoutDashboard />, title: "Controle Vital", desc: "Acompanhe faturamento, comissões e lucro real em tempo real." }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-start p-6 md:p-8 bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-white hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] mb-6 md:mb-8">
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 24, className: "md:w-7 md:h-7" })}
                                </div>
                                <h4 className="text-xl font-black mb-3 text-[#1D1D1F] tracking-tight">{item.title}</h4>
                                <p className="text-[#86868B] text-sm leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 md:py-40 px-6 md:px-12 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 md:mb-24">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-[#007AFF] mb-4">Depoimentos</h2>
                        <h3 className="text-3xl md:text-6xl font-black tracking-tight text-[#1D1D1F]">O que dizem os feras.</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {[
                            { name: "Ricardo Silva", role: "Legacy Barbershop", text: "O sistema de IA mudou o jogo. Meus clientes agendam pelo WhatsApp de madrugada e eu só vejo o faturamento crescendo.", stars: 5 },
                            { name: "Carlos Magno", role: "Urban Style", text: "Interface limpa e muito fácil de usar. Meus barbeiros amaram o dashboard simplificado e a facilidade do link.", stars: 5 },
                            { name: "André Santos", role: "Classic Men", text: "A facilidade de gerir o financeiro junto com a agenda me economiza horas de planilhas no final do mês.", stars: 5 }
                        ].map((test, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 md:p-10 rounded-[32px] md:rounded-[48px] bg-[#F5F5F7] border border-gray-100 flex flex-col items-start"
                            >
                                <div className="flex gap-1 mb-6 text-[#FFB800]">
                                    {[...Array(test.stars)].map((_, s) => <Star key={s} size={14} fill="currentColor" className="md:w-4 md:h-4" />)}
                                </div>
                                <p className="text-[#1D1D1F] text-base md:text-lg font-bold leading-relaxed mb-8 italic">"{test.text}"</p>
                                <div className="mt-auto">
                                    <h5 className="text-[14px] font-black text-[#1D1D1F] uppercase tracking-widest">{test.name}</h5>
                                    <p className="text-[#86868B] text-[10px] font-black uppercase tracking-[0.2em]">{test.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20 md:py-40 px-6 md:px-12 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#007AFF]/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16 md:mb-24">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007AFF]/10 text-[#007AFF] rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                        >
                            <CreditCard size={14} />
                            Planos Flexíveis
                        </motion.div>
                        <h3 className="text-3xl md:text-[72px] font-black tracking-tighter mb-6 md:mb-8 leading-[1]">O plano ideal <br /> para o seu negócio.</h3>
                        <p className="text-[#86868B] text-lg md:text-xl font-medium">Cancele quando quiser. Sem letras miúdas.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-8 md:pt-12">
                        {plans.map((plan, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative p-8 md:p-12 rounded-[40px] md:rounded-[56px] border transition-all duration-500 flex flex-col ${
                                    plan.popular 
                                    ? 'bg-[#007AFF] border-[#007AFF] shadow-[0_48px_128px_-24px_rgba(0,122,255,0.4)] scale-100 md:scale-105 z-10 text-white' 
                                    : 'bg-white border-gray-100 text-[#1D1D1F]'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1D1D1F] text-white text-[10px] font-black uppercase tracking-[0.3em] px-8 py-3 rounded-full shadow-lg whitespace-nowrap">
                                        Mais Assinado
                                    </div>
                                )}

                                <div className="mb-8 md:mb-12">
                                    <h4 className={`text-[12px] font-black uppercase tracking-[0.3em] mb-4 ${plan.popular ? 'text-white/60' : 'text-[#86868B]'}`}>{plan.name}</h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-[10px] uppercase font-bold ${plan.popular ? 'text-white/40' : 'text-gray-400'}`}>R$</span>
                                        <span className={`text-5xl md:text-7xl font-black tracking-tighter ${plan.popular ? 'text-white' : 'text-[#1D1D1F]'}`}>{plan.price}</span>
                                        <span className={`text-[12px] font-bold tracking-widest uppercase ${plan.popular ? 'text-white/60' : 'text-[#86868B]'}`}>/mês</span>
                                    </div>
                                </div>

                                <div className="space-y-4 md:space-y-6 mb-12 md:mb-16 flex-1">
                                    {plan.features.map((feat, j) => (
                                        <div key={j} className="flex items-start gap-4">
                                            <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-white/10' : 'bg-gray-50'}`}>
                                                <Check size={14} className={plan.popular ? 'text-white' : 'text-[#007AFF]'} />
                                            </div>
                                            <span className={`text-[15px] font-bold tracking-tight ${plan.popular ? 'text-white/90' : 'text-[#1D1D1F]/80'}`}>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => window.location.href = plan.checkoutUrl}
                                    className={`w-full py-5 md:py-6 rounded-full text-[14px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                        plan.popular 
                                        ? 'bg-white text-[#007AFF] hover:bg-gray-50 shadow-xl' 
                                        : 'bg-[#007AFF] text-white hover:bg-[#0063CC] shadow-xl shadow-[#007AFF]/20'
                                    }`}
                                >
                                    {plan.popular ? 'Assinar Agora' : 'Selecionar Plano'}
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16 md:mt-20 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-8 opacity-40 grayscale">
                             {/* Payment icons placeholder placeholders */}
                             <span className="text-[10px] font-black tracking-widest uppercase">Visa</span>
                             <span className="text-[10px] font-black tracking-widest uppercase">Mastercard</span>
                             <span className="text-[10px] font-black tracking-widest uppercase">PIX</span>
                        </div>
                        <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em] flex items-center gap-2">
                            <ShieldCheck size={14} className="text-[#007AFF]" />
                            Pagamento seguro & cancelamento a qualquer momento
                        </p>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-6 md:px-12 bg-white">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    className="max-w-7xl mx-auto rounded-[40px] md:rounded-[64px] bg-[#007AFF] overflow-hidden relative p-8 md:p-32 text-center text-white"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />
                    <div className="relative z-10 flex flex-col items-center text-white">
                        <h2 className="text-4xl md:text-[88px] font-black tracking-tighter leading-[1] md:leading-[0.9] mb-8 md:mb-12 text-white">
                            Sua agenda cheia <br /> sem esforço.
                        </h2>
                        <p className="text-lg md:text-2xl font-bold mb-10 md:mb-16 opacity-90 max-w-2xl text-white">Recupere seu tempo e foque no que importa. Teste o AutoOpera Barber grátis por 7 dias.</p>
                        
                        <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto">
                            <button 
                                onClick={() => navigate('/register-barber')}
                                className="w-full md:w-auto bg-white text-[#007AFF] px-8 md:px-14 py-5 md:py-6 rounded-full text-[14px] md:text-[16px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-2xl active:scale-95"
                            >
                                Começar Teste Grátis
                            </button>
                            <button className="flex items-center justify-center gap-3 text-white font-bold uppercase tracking-widest text-[11px] group">
                                Falar com especialista <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* About / Footer */}
            <footer className="py-20 md:py-32 px-6 md:px-12 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 md:gap-20">
                    <div className="max-w-xs">
                        <div className="flex items-center gap-3 mb-8">
                            <img src={brandLogo} alt="AutoOpera" className="h-10 w-auto object-contain" />
                            <div className="w-px h-6 bg-gray-200 mx-1" />
                            <span className="text-xl font-bold text-[#007AFF] tracking-tighter">Barber</span>
                        </div>
                        <p className="text-[#86868B] text-sm font-medium leading-relaxed mb-8">
                            A plataforma definitiva para gestão de barbearias modernas. Automatizando processos e impulsionando negócios através de IA.
                        </p>
                        <div className="flex gap-6">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#007AFF] transition-all cursor-pointer">
                                <Smartphone size={20} />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#007AFF] transition-all cursor-pointer">
                                <Users size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-32 w-full md:w-auto">
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1D1D1F]">Produto</h5>
                            <ul className="space-y-4 text-sm font-bold text-[#86868B]">
                                <li className="hover:text-[#007AFF] cursor-pointer">Dashboard</li>
                                <li className="hover:text-[#007AFF] cursor-pointer">Agendamento IA</li>
                                <li className="hover:text-[#007AFF] cursor-pointer">WhatsApp API</li>
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1D1D1F]">Suporte</h5>
                            <ul className="space-y-4 text-sm font-bold text-[#86868B]">
                                <li className="hover:text-[#007AFF] cursor-pointer">Documentação</li>
                                <li className="hover:text-[#007AFF] cursor-pointer">Central de Ajuda</li>
                                <li className="hover:text-[#007AFF] cursor-pointer">WhatsApp</li>
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1D1D1F]">Legal</h5>
                            <ul className="space-y-4 text-sm font-bold text-[#86868B]">
                                <li className="hover:text-[#007AFF] cursor-pointer">Termos de Uso</li>
                                <li className="hover:text-[#007AFF] cursor-pointer">Privacidade</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 md:mt-32 pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-[0.4em]">© 2026 AutoOpera Barber. Built by AutoOpera Platforms.</p>
                    <div className="flex items-center gap-3 text-[10px] font-black text-[#1D1D1F]">
                        <ShieldCheck size={14} className="text-[#007AFF]" />
                        SISTEMA SEGURO & CERTIFICADO
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
