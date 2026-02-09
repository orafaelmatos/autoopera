import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Calendar, 
  Check, 
  LayoutDashboard,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  Clock,
  Smartphone,
  Users,
  TrendingUp,
  Package,
  AlertCircle,
  MessageCircle,
  Bell,
  Send,
  Calculator,
  PieChart,
  Gift,
  Truck,
  ClipboardList,
  Cake,
  ListOrdered,
  Handshake
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/autoopera-logo.png';
import heroBarber from '../assets/barber.jpg';
import mockupsImg from '../assets/atendimento.jpg'; // Using existing asset as placeholder for the mockup visual

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'semestral' | 'annual'>('monthly');

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Hardcoded pricing table for the "perfect" psychological numbers
    const pricingData = {
        monthly: {
            tier1: 59.90,
            tier2: 74.90,
            tier3: 89.90,
            tier4: 104.90
        },
        semestral: {
            tier1: 49.99,
            tier2: 59.99,
            tier3: 75.99,
            tier4: 89.99
        },
        annual: {
            tier1: 39.99,
            tier2: 49.99,
            tier3: 59.99,
            tier4: 69.99
        }
    };

    const getPriceDetails = (tierKey: keyof typeof pricingData.monthly) => {
        const months = billingCycle === 'monthly' ? 1 : billingCycle === 'semestral' ? 6 : 12;
        const monthlyPrice = pricingData[billingCycle][tierKey];
        const originalPrice = pricingData.monthly[tierKey];
        const totalValue = monthlyPrice * months;

        return {
            monthly: monthlyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            original: originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            total: totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            showOriginal: billingCycle !== 'monthly'
        };
    };

    const pricingTiers = [
        { title: "1 Profissional", tierKey: 'tier1' as const, discountLabel: billingCycle === 'annual' ? "30% OFF" : billingCycle === 'semestral' ? "15% OFF" : null },
        { title: "2 a 5 Profissionais", tierKey: 'tier2' as const, discountLabel: billingCycle === 'annual' ? "30% OFF" : billingCycle === 'semestral' ? "15% OFF" : null },
        { title: "6 a 15 Profissionais", tierKey: 'tier3' as const, discountLabel: billingCycle === 'annual' ? "30% OFF" : billingCycle === 'semestral' ? "15% OFF" : null },
        { title: "+15 Profissionais", tierKey: 'tier4' as const, discountLabel: billingCycle === 'annual' ? "30% OFF" : billingCycle === 'semestral' ? "15% OFF" : null },
    ];

    const features = [
        {
            icon: <Bell size={40} strokeWidth={1.5} />,
            title: "AGENDAMENTO ONLINE 24H",
            description: "Seu cliente agenda o horário sozinho através de um link exclusivo, sem depender de atendimento manual."
        },
        {
            icon: <Handshake size={40} strokeWidth={1.5} />,
            title: "PROGRAMA DE FIDELIDADE",
            description: "Sistema de pontos e recompensas integrado para manter seus clientes voltando sempre à sua barbearia."
        },
        {
            icon: <Calculator size={40} strokeWidth={1.5} />,
            title: "GESTÃO FINANCEIRA",
            description: "Controle total de entradas, despesas e fluxo de caixa com relatórios simples e objetivos."
        },
        {
            icon: <CreditCard size={40} strokeWidth={1.5} />,
            title: "PAGAMENTO VIA PIX",
            description: "Integração para recebimentos via PIX de forma rápida e segura diretamente no sistema."
        },
        {
            icon: <Truck size={40} strokeWidth={1.5} />,
            title: "GESTÃO DE ESTOQUE",
            description: "Controle produtos para venda e consumo interno com avisos de estoque baixo."
        },
        {
            icon: <PieChart size={40} strokeWidth={1.5} />,
            title: "RELATÓRIOS GERENCIAIS",
            description: "Acompanhe o desempenho da sua barbearia com dados sobre faturamento e produtividade."
        },
        {
            icon: <Send size={40} strokeWidth={1.5} />,
            title: "CAMPANHAS DE PROMOÇÃO",
            description: "Crie promoções específicas para dias de pouco movimento e atraia mais clientes."
        },
        {
            icon: (
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            ),
            title: "CONTATO VIA WHATSAPP",
            description: "Facilite a comunicação e o login dos seus clientes utilizando o número do WhatsApp."
        }
    ];

    return (
        <div id="home" className="min-h-screen bg-background font-sans text-text">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md py-4 px-6 md:px-12 border-b border-white/5 shadow-2xl">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {/* Logo Left */}
                    <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        <div className="w-12 h-12 rounded flex items-center justify-center">
                            <img src={brandLogo} alt="AutoOpera Logo" className="w-full h-auto" />
                        </div>
                        <span className="font-title font-bold text-lg text-white tracking-tight">AutoOpera</span>
                    </div>

                    {/* Centered Desktop Nav */}
                    <nav className="hidden md:flex flex-1 justify-center items-center gap-10">
                        <a href="#home" className="text-white/80 text-[11px] uppercase tracking-widest font-bold hover:text-cta transition-colors">Home</a>
                        <a href="#sobre" className="text-white/80 text-[11px] uppercase tracking-widest font-bold hover:text-cta transition-colors">Sobre</a>
                        <a href="#funcionalidades" className="text-white/80 text-[11px] uppercase tracking-widest font-bold hover:text-cta transition-colors">Funções</a>
                        <a href="#precos" className="text-white/80 text-[11px] uppercase tracking-widest font-bold hover:text-cta transition-colors">Preços</a>
                    </nav>

                    {/* Right Action */}
                    <div className="hidden md:flex items-center gap-6 shrink-0">
                        <button 
                            onClick={() => navigate('/login')}
                            className="text-white/80 text-[11px] uppercase tracking-widest font-bold hover:text-cta transition-colors"
                        >
                            Acessar
                        </button>
                        <button 
                            onClick={() => navigate('/register-barber')}
                            className="bg-cta text-white px-5 py-2.5 rounded font-bold text-[11px] uppercase tracking-widest hover:bg-cta-hover transition-all shadow-lg shadow-cta/20"
                        >
                            Teste Grátis
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-white" onClick={toggleMenu}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed inset-0 z-40 bg-primary pt-24 px-8 md:hidden flex flex-col gap-6"
                    >
                        <a href="#home" onClick={toggleMenu} className="text-white text-xl font-medium text-left border-b border-white/10 pb-4">Home</a>
                        <a href="#sobre" onClick={toggleMenu} className="text-white text-xl font-medium text-left border-b border-white/10 pb-4">Sobre</a>
                        <a href="#funcionalidades" onClick={toggleMenu} className="text-white text-xl font-medium text-left border-b border-white/10 pb-4">Funções</a>
                        <a href="#precos" onClick={toggleMenu} className="text-white text-xl font-medium text-left border-b border-white/10 pb-4">Preços</a>
                        <button onClick={() => { navigate('/login'); toggleMenu(); }} className="text-white text-xl font-medium text-left border-b border-white/10 pb-4">Acessar</button>
                        <button 
                            onClick={() => { navigate('/register-barber'); toggleMenu(); }}
                            className="bg-cta text-white py-4 rounded font-bold text-center shadow-lg"
                        >
                            Teste Grátis
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section className="relative pt-44 pb-24 px-6 md:px-12 bg-primary overflow-hidden border-b border-white/5">
                {/* Visual texture */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]" />
                </div>
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="text-left">
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-title text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1]"
                            >
                                Tenha uma barbearia que <span className="text-cta italic">funciona sozinha</span>
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg md:text-xl text-white/70 mb-10 max-w-xl font-medium leading-relaxed"
                            >
                                Organize sua agenda, receba por PIX e mande lembretes automáticos sem complicação. O AutoOpera é feito para quem entende de tesoura, não de computador.
                            </motion.p>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <button 
                                    onClick={() => navigate('/register-barber')}
                                    className="bg-cta text-white text-base font-bold py-5 px-10 rounded shadow-2xl hover:bg-cta-hover hover:scale-105 transition-all uppercase tracking-[0.2em]"
                                >
                                    Começar agora
                                </button>
                            </motion.div>

                            <div className="mt-12 text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">
                                <p className="mb-6">Funciona no seu celular</p>
                                <div className="flex gap-4 flex-wrap">
                                    <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                                        <Smartphone size={18} className="text-white/80" />
                                        <div className="text-left leading-tight">
                                            <p className="text-[12px] font-bold text-white">iPhone & Android</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="relative hidden lg:block"
                        >
                            <div className="absolute inset-0 bg-cta/20 blur-[100px] rounded-full" />
                            <div className="relative border-4 border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                                <img 
                                    src={heroBarber} 
                                    alt="Barbeiro trabalhando" 
                                    className="w-full h-auto rounded-[28px] object-cover hover:scale-105 transition-transform duration-700" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section className="py-24 px-6 md:px-12 bg-background">
                <div className="max-w-5xl mx-auto">
                    <h2 className="font-title text-3xl md:text-4xl font-bold text-center mb-16 text-text">Sua barbearia ainda é assim?</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-text-secondary">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Smartphone size={32} />
                            </div>
                            <h3 className="font-title text-xl font-bold mb-4 text-text">Agendamento manual</h3>
                            <p>Você para o que está fazendo toda hora para responder WhatsApp ou atender chamadas.</p>
                        </div>
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="font-title text-xl font-bold mb-4 text-text">Cliente esquece e falta</h3>
                            <p>Cadeira vazia é prejuízo. Sem lembretes, o cliente esquece e você perde dinheiro.</p>
                        </div>
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <LayoutDashboard size={32} />
                            </div>
                            <h3 className="font-title text-xl font-bold mb-4 text-text">Finanças bagunçadas</h3>
                            <p>Difícil saber quanto realmente entrou no dia ou quanto você tem para receber.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section className="py-24 px-6 md:px-12 bg-section border-y border-border">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <h2 className="font-title text-3xl md:text-4xl font-bold mb-6 text-text">AutoOpera: Sua barbearia no automático</h2>
                        <p className="text-lg text-text-secondary leading-relaxed mb-6">
                            O AutoOpera foi feito para quem entende de cabelo, não de computador. É tudo simples, prático e funciona direto no seu celular.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-text-secondary">
                                <div className="w-6 h-6 bg-primary-soft text-primary rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check size={16} />
                                </div>
                                <span>Sem confusão</span>
                            </li>
                            <li className="flex items-center gap-3 text-text-secondary">
                                <div className="w-6 h-6 bg-primary-soft text-primary rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check size={16} />
                                </div>
                                <span>Em poucos cliques</span>
                            </li>
                            <li className="flex items-center gap-3 text-text-secondary">
                                <div className="w-6 h-6 bg-primary-soft text-primary rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check size={16} />
                                </div>
                                <span>Tudo em um só lugar</span>
                            </li>
                        </ul>
                    </div>
                    <div className="flex-1 w-full bg-white p-4 rounded-3xl shadow-sm border border-border">
                        <div className="bg-background rounded-2xl p-8 text-center text-text-muted italic">
                            "AutoOpera tira o peso das minhas costas. Eu só me preocupo em atender bem o cliente."
                        </div>
                    </div>
                </div>
            </section>
            {/* About Section */}
            <section id="sobre" className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-title text-3xl md:text-4xl font-bold mb-8 text-text">Sobre o AutoOpera</h2>
                    <p className="text-lg text-text-secondary leading-relaxed mb-10">
                        O AutoOpera não é apenas um sistema de computador. É o braço direito do barbeiro moderno. 
                        Nascemos para devolver o tempo de quem vive com a tesoura na mão, organizando toda a 
                        confusão de mensagens e papéis em um só lugar.
                    </p>
                    
                    <div className="text-left space-y-8 bg-section p-8 md:p-12 rounded-[32px] border border-border">
                        <p className="font-bold text-text mb-4">Como funciona no seu dia a dia:</p>
                        
                        <div className="flex gap-6">
                            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center flex-shrink-0">
                                <LayoutDashboard size={24} />
                            </div>
                            <div>
                                <h3 className="font-title text-xl font-bold mb-2 text-text">Gestão completa para o dono</h3>
                                <p className="text-text-secondary">
                                    Pelo seu celular ou computador, você controla cada profissional, vê quanto ganhou no dia, 
                                    gerencia o estoque e tem relatórios financeiros que qualquer um entende. Tudo salvo na 
                                    nuvem, com segurança total.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="w-12 h-12 bg-cta text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-cta/20">
                                <Smartphone size={24} />
                            </div>
                            <div>
                                <h3 className="font-title text-xl font-bold mb-2 text-text">Facilidade para o barbeiro e para o cliente</h3>
                                <p className="text-text-secondary">
                                    O seu funcionário acompanha a própria agenda e comissões. O seu cliente recebe um link 
                                    profissional para marcar o horário em segundos, sem precisar te chamar. Ele ainda recebe 
                                    lembretes automáticos e pode pagar por PIX direto pelo app.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Objectives Section */}
            <section className="py-24 px-6 md:px-12 bg-section border-y border-border">
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-title text-3xl md:text-4xl font-bold text-center mb-16 text-text">Nosso Objetivo</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-10 rounded-[32px] border border-border flex flex-col items-center text-center group hover:border-cta transition-colors shadow-sm">
                            <div className="w-16 h-16 bg-primary-soft text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors">
                                <Clock size={32} />
                            </div>
                            <h3 className="font-title text-xl font-bold mb-4 text-text">Otimizar seu Tempo</h3>
                            <p className="text-text-secondary leading-relaxed">
                                Deixe a agenda rodar no automático. Enquanto você foca no corte, o sistema organiza os horários e envia lembretes por você.
                            </p>
                        </div>

                        <div className="bg-white p-10 rounded-[32px] border border-border flex flex-col items-center text-center group hover:border-cta transition-colors shadow-sm">
                            <div className="w-16 h-16 bg-primary-soft text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors">
                                <Users size={32} />
                            </div>
                            <h3 className="font-title text-xl font-bold mb-4 text-text">Fidelizar seu Cliente</h3>
                            <p className="text-text-secondary leading-relaxed">
                                Ofereça agendamento 24h e um atendimento moderno. Cliente satisfeito com a facilidade sempre volta para a sua cadeira.
                            </p>
                        </div>

                        <div className="bg-white p-10 rounded-[32px] border border-border flex flex-col items-center text-center group hover:border-cta transition-colors shadow-sm">
                            <div className="w-16 h-16 bg-primary-soft text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors">
                                <TrendingUp size={32} />
                            </div>
                            <h3 className="font-title text-xl font-bold mb-4 text-text">Aumentar seu Faturamento</h3>
                            <p className="text-text-secondary leading-relaxed">
                                Com menos faltas e mais agendamentos online, você garante que sua barbearia nunca fique com a cadeira vazia.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How to Start Section */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-title text-3xl md:text-4xl font-bold text-center mb-20 text-text">Como começar</h2>
                    
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            {/* Step 1 */}
                            <div className="flex gap-8 items-start">
                                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                                    1
                                </div>
                                <div className="pt-2 border-b border-gray-100 pb-8 w-full">
                                    <h3 className="font-title text-2xl font-bold text-text mb-3">Faça o Cadastro</h3>
                                    <p className="text-text-secondary text-lg leading-relaxed">
                                        Faça o cadastro no AutoOpera, informando os dados básicos do seu estabelecimento de forma rápida.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-8 items-start">
                                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                                    2
                                </div>
                                <div className="pt-2 border-b border-gray-100 pb-8 w-full">
                                    <h3 className="font-title text-2xl font-bold text-text mb-3">Preencha o Passo a Passo inicial</h3>
                                    <p className="text-text-secondary text-lg leading-relaxed">
                                        Informe os cadastros básicos do estabelecimento, como serviços, profissionais e jornada de trabalho.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-8 items-start">
                                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                                    3
                                </div>
                                <div className="pt-2 w-full">
                                    <h3 className="font-title text-2xl font-bold text-text mb-3">Teste grátis por 15 dias</h3>
                                    <p className="text-text-secondary text-lg leading-relaxed">
                                        Usufrua de todas as funcionalidades do sistema por 15 dias gratuitamente e sem compromisso.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Image side - Simulated Mockup visual */}
                        <div className="relative">
                            <div className="bg-[#f0f4f5] rounded-3xl p-8 relative">
                                <img 
                                    src={mockupsImg} 
                                    alt="Visão do Sistema" 
                                    className="rounded-xl shadow-2xl w-full"
                                />
                                {/* Circular badges/decorations similar to reference */}
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-soft rounded-full blur-2xl opacity-50"></div>
                                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-cta-soft rounded-full blur-3xl opacity-30"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <button 
                            onClick={() => navigate('/register-barber')}
                            className="bg-cta text-white px-10 py-5 rounded-xl font-bold text-lg hover:shadow-xl hover:-translate-y-1 transition-all shadow-lg shadow-cta/20 uppercase tracking-wider"
                        >
                            CLIQUE AQUI E CADASTRE-SE AGORA
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="funcionalidades" className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="font-title text-3xl md:text-4xl font-bold text-center mb-16 text-text">Tudo o que você precisa</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <div 
                                key={idx} 
                                className="group p-10 rounded-[32px] border transition-all duration-300 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:-translate-y-1 bg-section border-border hover:border-cta"
                            >
                                <div className="mb-8 transition-colors text-primary group-hover:text-cta">
                                    {feature.icon}
                                </div>
                                
                                <div className="flex flex-col items-center gap-4 flex-grow">
                                    <h3 className="font-title text-lg font-bold leading-tight text-text">
                                        {feature.title}
                                    </h3>
                                    <div className="w-12 h-[3px] rounded-full bg-primary-soft group-hover:bg-cta"></div>
                                    <p className="text-sm leading-relaxed mt-2 text-text-secondary">
                                        {feature.description}
                                    </p>
                                </div>

                                <div className="mt-8">
                                    <span className="text-[11px] font-black tracking-widest uppercase transition-all text-primary group-hover:text-cta border-b border-transparent hover:border-cta">
                                       Saiba Mais
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 px-6 md:px-12 bg-section border-t border-border">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-title text-3xl md:text-4xl font-bold mb-16 text-text">Os benefícios do AutoOpera</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div>
                            <h3 className="text-5xl font-bold text-primary mb-4 font-title">15h</h3>
                            <p className="text-text-secondary font-medium">Economizadas por mês em agendamentos</p>
                        </div>
                        <div>
                            <h3 className="text-5xl font-bold text-primary mb-4 font-title">40%</h3>
                            <p className="text-text-secondary font-medium">Menos faltas com lembretes automáticos</p>
                        </div>
                        <div>
                            <h3 className="text-5xl font-bold text-primary mb-4 font-title">100%</h3>
                            <p className="text-text-secondary font-medium">De controle sobre o seu dinheiro</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="precos" className="py-24 px-6 md:px-12 bg-background">
                <div className="max-w-7xl mx-auto">
                    <h2 className="font-title text-3xl md:text-4xl font-bold text-center mb-8 text-text">Preços simples e sem sustos</h2>
                    
                    {/* Billing Cycle Toggle */}
                    <div className="flex flex-wrap justify-center mb-16">
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-border flex">
                            <button 
                                onClick={() => setBillingCycle('annual')}
                                className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${billingCycle === 'annual' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-gray-50'}`}
                            >
                                ANUAL <br />
                                <span className="text-[10px] font-medium opacity-80">30% DE DESCONTO</span>
                            </button>
                            <button 
                                onClick={() => setBillingCycle('semestral')}
                                className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${billingCycle === 'semestral' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-gray-50'}`}
                            >
                                SEMESTRAL <br />
                                <span className="text-[10px] font-medium opacity-80">15% DE DESCONTO</span>
                            </button>
                            <button 
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-gray-50'}`}
                            >
                                MENSAL <br />
                                <span className="text-[10px] font-medium opacity-80 invisibility"> SEM DESCONTO </span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pricingTiers.map((tier, idx) => {
                            const details = getPriceDetails(tier.tierKey);
                            const isMostUsed = idx === 1; // 2 a 5 Profissionais

                            return (
                                <div key={idx} className={`bg-white p-8 rounded-2xl border flex flex-col items-center text-center shadow-sm relative overflow-hidden transition-all hover:shadow-md ${isMostUsed ? 'border-cta' : 'border-border'}`}>
                                    {tier.discountLabel && (
                                        <div className="absolute top-4 right-[-35px] bg-[#FFD700] text-text font-bold text-[10px] py-1 px-10 rotate-45 shadow-sm">
                                            {tier.discountLabel}
                                        </div>
                                    )}
                                    
                                    <h3 className="font-title text-lg font-bold mb-8 text-text-secondary">{tier.title}</h3>
                                    
                                    <div className="mb-2">
                                        <span className="text-text-secondary text-sm font-medium mr-1">R$</span>
                                        <span className="text-4xl font-bold text-primary">{details.monthly.split(',')[0]}</span>
                                        <span className="text-text-secondary text-sm font-medium">,{details.monthly.split(',')[1]}/mês</span>
                                    </div>

                                    {details.showOriginal && (
                                        <div className="text-text-muted text-sm line-through mb-4">
                                            R$ {details.original}/mês
                                        </div>
                                    )}

                                    <div className="text-text-muted text-xs font-medium mb-10">
                                        Valor Total: R$ {details.total}
                                    </div>

                                    <div className="space-y-3 mb-10 flex-1 text-sm text-text-secondary w-full text-left">
                                        <div className="flex items-center gap-2">
                                            <Check size={14} className="text-primary" />
                                            <span>Agenda inteligente</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check size={14} className="text-primary" />
                                            <span>Link de agendamento</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check size={14} className="text-primary" />
                                            <span>Controle de estoque</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check size={14} className="text-primary" />
                                            <span>Financeiro completo</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => navigate('/register-barber')}
                                        className="w-full bg-cta text-white py-4 rounded-xl font-bold hover:bg-cta-hover transition-colors shadow-lg shadow-cta/10"
                                    >
                                        Começar agora
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-center mt-12 text-text-muted font-medium italic">Simples e sem letras miúdas. Cancele quando quiser.</p>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-6 md:px-12 bg-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="font-title text-3xl md:text-5xl font-bold mb-8 text-text">Pronto para organizar sua barbearia?</h2>
                    <p className="text-xl text-text-secondary mb-12">Comece agora e veja como o AutoOpera facilita o seu dia a dia.</p>
                    <button 
                        onClick={() => navigate('/register-barber')}
                        className="bg-cta text-white text-xl font-bold py-5 px-12 rounded-xl shadow-lg hover:bg-cta-hover transition-all w-full md:w-auto"
                    >
                        Criar minha conta grátis
                    </button>
                    <p className="mt-6 text-text-muted font-medium italic">"Funciona no celular e é fácil de usar."</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 md:px-12 bg-primary text-white border-t border-white/10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center">
                            <img src={brandLogo} alt="AutoOpera" className="w-full h-auto" />
                        </div>
                        <span className="font-title font-bold text-lg">AutoOpera</span>
                    </div>
                    <p className="text-sm text-white/60">© 2026 AutoOpera. Tudo em um só lugar.</p>
                    <div className="flex gap-8 text-sm font-medium">
                        <a href="#" className="hover:text-cta transition-colors">Instagram</a>
                        <a href="#" className="hover:text-cta transition-colors">Termos</a>
                        <a href="#" className="hover:text-cta transition-colors">Suporte</a>
                    </div>
                </div>
            </footer>

            {/* WhatsApp Floating Button */}
            <a 
                href="https://wa.me/5519995828704" 
                target="_blank" 
                rel="noopener noreferrer"
                className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
                aria-label="Contato via WhatsApp"
            >
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="absolute right-full mr-4 bg-white text-slate-800 px-4 py-2 rounded-lg shadow-lg font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-100">
                    Fale conosco
                </span>
            </a>
        </div>
    );
};

export default LandingPage;
