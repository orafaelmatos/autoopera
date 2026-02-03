import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Scissors, Calendar, Clock, ChevronRight, 
  ChevronLeft, Check, Plus, Star, LogOut, Info, ArrowRight,
  CreditCard, Wallet, Camera, CheckCircle2, Copy
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { servicesApi, barbersApi, appointmentsApi, customersApi, barbershopApi, getMediaUrl } from '../api';
import { Service, Barber, Barbershop } from '../types';
import { format, addDays, startOfToday, isSameDay, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const CustomerBooking: React.FC = () => {
    const { user, logout, refreshUser } = useAuth();
    const location = useLocation();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [step, setStep] = useState(1);
    const [tab, setTab] = useState<'booking' | 'history' | 'profile'>('booking');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam === 'profile' || tabParam === 'history' || tabParam === 'booking') {
            setTab(tabParam as any);
        }
    }, [location]);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
    const [loading, setLoading] = useState(true);
    
    // History states
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Profile states
    const [profileData, setProfileData] = useState({
        name: user?.full_name || user?.name || '',
        birth_date: user?.birth_date || '',
        profile_picture: user?.profile_picture || '',
        phone: user?.phone || '',
        email: (user as any)?.email || '',
        description: (user as any)?.description || ''
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.full_name || user.name || '',
                birth_date: user.birth_date || '',
                profile_picture: user.profile_picture || '',
                phone: user.phone || '',
                email: (user as any).email || '',
                description: (user as any).description || ''
            });
        }
    }, [user]);

    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [pixInfo, setPixInfo] = useState<{qr_code_base64: string; brcode: string; amount: number} | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [bData, sData, shopData] = await Promise.all([
                    barbersApi.getAll(),
                    servicesApi.getAll(),
                    barbershopApi.get()
                ]);
                setBarbers(bData);
                setServices(sData);
                setBarbershop(shopData);
            } catch (err) {
                toast.error("Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedBarber && selectedServices.length > 0 && selectedDate) {
            loadAvailableSlots();
        }
    }, [selectedBarber, selectedServices, selectedDate]);

    const loadAvailableSlots = async () => {
        if (!selectedBarber || selectedServices.length === 0) return;
        setLoadingSlots(true);
        setSelectedTime(null);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const serviceIds = selectedServices.map(s => s.id).join(',');
            // API calls now use serviceIds parameter
            const slots = await appointmentsApi.getAvailableSlots(
                selectedBarber.id,
                serviceIds,
                dateStr
            );
            setAvailableSlots(slots);
        } catch (error) {
            console.error("Erro ao carregar horários:", error);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleServiceToggle = (service: Service) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === service.id);
            if (exists) {
                return prev.filter(s => s.id !== service.id);
            } else {
                return [...prev, service];
            }
        });
    };

    const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration + (s.buffer_time || 0), 0);
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

    const handleBooking = async () => {
        if (!selectedBarber || selectedServices.length === 0 || !selectedTime) return;

        setIsBooking(true);
        const [hours, minutes] = selectedTime.split(':');
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        try {
            const appointment = await appointmentsApi.create({
                barberId: selectedBarber.id,
                serviceIds: selectedServices.map(s => s.id),
                clientName: profileData.name || 'Cliente',
                date: appointmentDate.toISOString(),
                customer: user?.profile_id ? String(user.profile_id) : undefined,
                platform: 'web'
            });

            // Se o estabelecimento tiver Pix configurado, busca as info de pagamento
            if (barbershop?.pix_key) {
                try {
                    const pixData = await appointmentsApi.getPixPayment(appointment.id);
                    setPixInfo(pixData);
                } catch (pixErr) {
                    console.error("Erro ao gerar Pix:", pixErr);
                }
            }

            setBookingComplete(true);
        } catch (error) {
            console.error("Erro ao agendar:", error);
            toast.error("Erro ao agendar. Tente outro horário.");
        } finally {
            setIsBooking(false);
        }
    };

    useEffect(() => {
        if (tab === 'history') {
            loadHistory();
        }
    }, [tab]);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await appointmentsApi.getAll();
            setHistory(data);
        } catch (error) {
            toast.error("Erro ao carregar histórico.");
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileData({ ...profileData, profile_picture: file as any });
        }
    };

    const handleUpdateProfile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            if (user?.profile_id) {
                const formData = new FormData();
                formData.append('name', profileData.name);
                
                if (user.role === 'customer') {
                    formData.append('phone', profileData.phone);
                    if (profileData.birth_date) formData.append('birth_date', profileData.birth_date);
                }

                // profile_picture pode ser uma string (URL) ou um File
                if (profileData.profile_picture instanceof File) {
                    formData.append('profile_picture', profileData.profile_picture);
                }

                if (user.role === 'barber') {
                    formData.append('email', profileData.email);
                    formData.append('description', profileData.description);
                    await barbersApi.update(String(user.profile_id), formData as any);
                } else {
                    await customersApi.update(String(user.profile_id), formData as any);
                }
                
                await refreshUser();
                toast.success("Perfil atualizado!");
            }
        } catch (error: any) {
            console.error("Erro ao atualizar perfil:", error);
            const message = error.response?.data ? Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(', ') : "Erro ao atualizar perfil.";
            toast.error(message);
        }
    };

    if (loading) {
        return (
            <div key="loading-state" className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!barbershop) {
        return (
            <div key="not-found-state" className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-cta/10 rounded-[32px] flex items-center justify-center mb-6 text-cta border border-cta/20">
                    <Info size={32} />
                </div>
                <h2 className="text-2xl font-black text-text mb-2 tracking-tighter italic uppercase font-title">Barbearia não disponível</h2>
                <p className="text-text/60 text-sm max-w-[280px] mx-auto mb-8">
                    Não conseguimos localizar as configurações desta unidade no momento.
                </p>
                <button 
                    onClick={() => window.location.href = '/login'}
                    className="w-full max-w-[280px] bg-primary text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform"
                >
                    Acessar minha conta
                </button>
            </div>
        );
    }

    if (bookingComplete) {
        return (
            <div key="booking-complete-state" className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8">
                    <div className="w-24 h-24 bg-cta rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-cta/30">
                        <Check className="text-white" size={48} />
                    </div>
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-4xl font-black text-text mb-2 tracking-tighter uppercase font-title">Confirmado!</h2>
                    <p className="text-text/60 mb-8 max-w-[280px] mx-auto italic">
                        Seu agendamento com o profissional <strong>{selectedBarber?.name}</strong> foi realizado com sucesso.
                    </p>
                    
                    <div className="bg-white p-8 rounded-[40px] shadow-[0_24px_48px_-12px_rgba(15,76,92,0.12)] border border-border mb-10 text-left space-y-4 max-w-sm mx-auto">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-text/30 tracking-widest">Data</span>
                            <span className="text-text font-black font-title italic">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-text/30 tracking-widest">Horário</span>
                            <span className="text-primary font-black font-title italic">{selectedTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-text/30 tracking-widest">Serviço</span>
                            <span className="text-text font-black font-title italic truncate ml-4 text-right">
                                {selectedServices.map(s => s.name).join(', ')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-border">
                            <span className="text-[10px] font-black uppercase text-text/30 tracking-widest">Total</span>
                            <span className="text-cta font-black font-title italic text-xl">R$ {totalPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    {pixInfo && (
                        <div className="mb-10 bg-primary/5 border-2 border-dashed border-primary/20 rounded-[40px] p-8 max-w-sm mx-auto">
                            <h3 className="text-xl font-black text-primary mb-4 tracking-tighter uppercase font-title italic">Pagamento Antecipado</h3>
                            <p className="text-primary/60 text-[10px] uppercase font-black tracking-widest leading-relaxed mb-6">
                                Utilize o QR Code abaixo ou a chave copia e cola para confirmar seu agendamento via Pix.
                            </p>
                            
                            <div className="bg-white p-4 rounded-3xl shadow-xl mb-6 flex justify-center overflow-hidden">
                                <img src={pixInfo.qr_code_base64} alt="QR Code Pix" className="w-full aspect-square max-w-[200px]" />
                            </div>

                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(pixInfo.brcode);
                                    toast.success("Código Pix copiado!");
                                }}
                                className="w-full bg-white border-2 border-primary/10 text-primary font-black py-4 rounded-2xl mb-4 hover:bg-primary/5 transition-colors flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"
                            >
                                <Copy size={16} /> Copiar Código Pix
                            </button>
                            
                            <p className="text-[10px] text-primary/40 text-center font-bold italic uppercase">
                                Valor: R$ {pixInfo.amount.toFixed(2)}
                            </p>
                        </div>
                    )}

                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-primary text-white font-black py-5 rounded-[24px] shadow-lg shadow-primary/20 active:scale-95 transition-transform uppercase tracking-widest text-xs"
                    >
                        Novo Agendamento
                    </button>
                    <button onClick={logout} className="mt-8 text-text/30 font-black uppercase text-[10px] tracking-[0.3em] hover:text-cta transition-colors italic">Sair da Conta</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div key="booking-main-content" className="min-h-screen bg-background flex flex-col font-sans">
            {/* Header Clean - Neutro e Flat */}
            <div className="relative w-full h-[140px] sm:h-[220px] overflow-hidden bg-[#0F4C5C] shrink-0 border-b border-white/5">
                {/* Logo Centered */}
                <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2 sm:-mt-6">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 sm:w-32 sm:h-32 bg-white rounded-2xl sm:rounded-[40px] flex items-center justify-center shadow-2xl mb-2 sm:mb-4 mt-4 sm:mt-7 p-2 sm:p-4 overflow-hidden border border-white/10"
                    >
                        {barbershop?.logo ? (
                             <img src={getMediaUrl(barbershop.logo)} className="w-full h-full object-contain" alt="Logo" />
                        ) : (
                            <Scissors className="text-primary" size={24} />
                        )}
                    </motion.div>
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-lg sm:text-3xl font-black text-white tracking-tighter italic uppercase font-title leading-tight text-center px-6"
                    >
                        {barbershop?.name || "AUTOOPERA"}
                    </motion.h1>
                    <p className="text-white/50 font-black text-[7px] sm:text-[10px] tracking-[0.3em] uppercase mt-1 sm:mt-2 italic text-center px-8 line-clamp-1 sm:line-clamp-2 max-w-sm">
                        {barbershop?.description || "Estilo & Tradição"}
                    </p>
                </div>
            </div>

            <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-24 relative z-20">
                {/* Tabs Navigation */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 flex gap-1 mb-4 sm:mb-8 shadow-[0_12px_32px_rgba(15,76,92,0.1)] border border-border/50 relative z-10">
                    <button 
                        onClick={() => setTab('booking')}
                        className={`flex-1 py-3 sm:py-4 px-2 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${tab === 'booking' ? 'bg-primary text-white shadow-lg' : 'text-text/40 hover:text-text/60'}`}
                    >
                        <Calendar size={12} className="sm:size-[14px]" /> Agendar
                    </button>
                    <button 
                        onClick={() => {
                            setTab('history');
                            loadHistory();
                        }}
                        className={`flex-1 py-3 sm:py-4 px-2 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${tab === 'history' ? 'bg-primary text-white shadow-lg' : 'text-text/40 hover:text-text/60'}`}
                    >
                        <Clock size={12} className="sm:size-[14px]" /> Histórico
                    </button>
                    <button 
                         onClick={() => setTab('profile')}
                        className={`flex-1 py-3 sm:py-4 px-2 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${tab === 'profile' ? 'bg-primary text-white shadow-lg' : 'text-text/40 hover:text-text/60'}`}
                    >
                        <User size={12} className="sm:size-[14px]" /> Perfil
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {tab === 'booking' && (
                        <motion.div 
                            key="booking-tab"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            

                            <div className="flex justify-between items-center mb-4 sm:mb-8">
                                <div className="space-y-0.5">
                                    <h2 className="text-xl sm:text-2xl font-black text-text tracking-tighter font-title italic uppercase">
                                        {step === 1 && "PROFISSIONAIS"}
                                        {step === 2 && "SERVIÇOS"}
                                        {step === 3 && "AGENDA"}
                                    </h2>
                                    <p className="text-text/30 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Etapa {step} de 3</p>
                                </div>
                                <div className="flex gap-1.5 sm:gap-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`h-1 sm:h-1.5 rounded-full transition-all duration-700 ${step >= i ? 'w-6 sm:w-8 bg-primary shadow-sm' : 'w-1.5 sm:w-2 bg-border'}`} />
                                    ))}
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3 sm:space-y-4">
                                        {barbers.map(barber => (
                                            <button 
                                                key={barber.id}
                                                onClick={() => { setSelectedBarber(barber); setStep(2); }}
                                                className="w-full bg-white p-3 sm:p-5 rounded-2xl sm:rounded-[32px] border border-border flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-xl hover:border-primary/20 shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 sm:gap-5">
                                                    <div className="relative w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0">
                                                        <img 
                                                            src={barber.profile_picture ? getMediaUrl(barber.profile_picture) : "https://via.placeholder.com/150"} 
                                                            className="w-full h-full object-cover rounded-xl sm:rounded-2xl group-hover:scale-105 transition-transform duration-500 shadow-md"
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-cta rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
                                                            <Star size={10} className="text-white fill-white sm:size-[12px]" />
                                                        </div>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-black text-text text-base sm:text-xl leading-tight uppercase italic font-title">{barber.name}</p>
                                                        <div className="mt-1 sm:mt-2 flex flex-col gap-1 sm:gap-1.5">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[8px] sm:text-[10px] font-black text-cta uppercase tracking-widest italic">Especialista Master</span>
                                                            </div>
                                                            {barber.description && (
                                                                <p className="text-[9px] sm:text-[11px] text-text/40 line-clamp-1 sm:line-clamp-2 max-w-[150px] sm:max-w-[180px] font-medium leading-relaxed italic">"{barber.description}"</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-background flex items-center justify-center text-text/10 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                                    <ChevronRight size={20} className="sm:size-[24px]" />
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6 pb-32">
                                        <button onClick={() => setStep(1)} className="flex items-center gap-2 text-text/30 hover:text-text font-black text-[9px] sm:text-[10px] uppercase tracking-widest mb-2 sm:mb-4 transition-colors italic">
                                            <ChevronLeft size={14} className="sm:size-[16px]" /> Voltar aos Profissionais
                                        </button>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            {services.map(service => {
                                                const isSelected = selectedServices.some(s => s.id === service.id);
                                                return (
                                                    <button 
                                                        key={service.id}
                                                        onClick={() => handleServiceToggle(service)}
                                                        className={`w-full p-4 sm:p-6 rounded-2xl sm:rounded-[32px] border flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm ${
                                                            isSelected ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-white border-border hover:shadow-xl hover:border-primary/20'
                                                        }`}
                                                    >
                                                        <div className="text-left space-y-1 sm:space-y-2">
                                                            <p className={`font-black text-sm sm:text-lg uppercase italic font-title tracking-tight ${isSelected ? 'text-white' : 'text-text'}`}>{service.name}</p>
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-text/20'}`}>{service.duration} MIN</span>
                                                                <span className={`text-base sm:text-lg font-black italic font-title ${isSelected ? 'text-white' : 'text-primary'}`}>R$ {service.price}</span>
                                                            </div>
                                                        </div>
                                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-background text-text/10 group-hover:bg-primary group-hover:text-white'}`}>
                                                            {isSelected ? <Check size={16} strokeWidth={3} className="sm:size-[20px]" /> : <Plus size={16} strokeWidth={3} className="sm:size-[20px]" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Barra de Carrinho flutuante - Compacta */}
                                        <div className="fixed bottom-6 left-4 right-4 sm:bottom-10 sm:left-6 sm:right-6 z-50">
                                            <button 
                                                disabled={selectedServices.length === 0}
                                                onClick={() => setStep(3)}
                                                className={`w-full max-w-2xl mx-auto flex items-center justify-between p-4 sm:p-6 rounded-2xl sm:rounded-[32px] shadow-2xl transition-all active:scale-95 ${
                                                    selectedServices.length > 0 
                                                    ? 'bg-cta text-white opacity-100' 
                                                    : 'bg-white/80 backdrop-blur text-text/20 opacity-50 cursor-not-allowed'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                                        <Scissors size={18} className="sm:size-[20px]" />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-60 block">Serviços Selecionados</span>
                                                        <span className="text-xs sm:text-sm font-black italic font-title uppercase">{selectedServices.length} {selectedServices.length === 1 ? 'item' : 'itens'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 sm:gap-6">
                                                    <div className="text-right">
                                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-60 block">Total</span>
                                                        <span className="text-sm sm:text-lg font-black italic font-title uppercase">R$ {totalPrice.toFixed(2)}</span>
                                                    </div>
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-cta rounded-xl sm:rounded-2xl flex items-center justify-center">
                                                        <ArrowRight size={20} strokeWidth={3} className="sm:size-[24px]" />
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-2 pb-24">
                                        <button onClick={() => setStep(2)} className="flex items-center gap-2 text-text/30 hover:text-text font-black text-[10px] uppercase tracking-widest transition-colors italic">
                                            <ChevronLeft size={16} /> Outros Serviços
                                        </button>

                                        {/* Review Selected - Compacto */}
                                        <div className="bg-primary/5 border border-primary/10 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm text-primary">
                                                    <Scissors size={18} className="sm:size-[20px]" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-text/30 italic">Confirmando Serviços</p>
                                                    <p className="text-xs sm:text-lg font-black italic font-title text-text uppercase leading-tight truncate">
                                                        {selectedServices.map(s => s.name).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 pl-2">
                                                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-text/30 italic">Total</p>
                                                <p className="text-base sm:text-xl font-black italic font-title text-primary uppercase leading-tight">R$ {totalPrice.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 sm:space-y-4">
                                            <label className="text-[8px] sm:text-[10px] font-black text-text/30 uppercase tracking-[0.2em] ml-2 italic">Escolha a Data</label>
                                            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide">
                                                {[...Array(14)].map((_, i) => {
                                                    const date = addDays(startOfToday(), i);
                                                    const isActive = isSameDay(date, selectedDate);
                                                    return (
                                                        <button 
                                                            key={i}
                                                            onClick={() => setSelectedDate(date)}
                                                            className={`flex flex-col items-center justify-center min-w-[65px] sm:min-w-[75px] aspect-[4/5] rounded-xl sm:rounded-[24px] transition-all border-2 active:scale-95 ${
                                                                isActive 
                                                                ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' 
                                                                : 'bg-white border-border text-text/30 hover:border-primary/20'
                                                            }`}
                                                        >
                                                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-white/60' : 'text-text/20'}`}>
                                                                {isSameDay(date, startOfToday()) ? 'HOJE' : isTomorrow(date) ? 'AMN' : format(date, 'EEE', { locale: ptBR }).toUpperCase()}
                                                            </span>
                                                            <span className="text-lg sm:text-xl font-black font-title italic uppercase">{format(date, 'dd')}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-3 sm:space-y-4">
                                            <label className="text-[8px] sm:text-[10px] font-black text-text/30 uppercase tracking-[0.2em] ml-2 italic">Horários Disponíveis</label>
                                            {loadingSlots ? (
                                                <div className="flex flex-col items-center py-8 sm:py-12 gap-3">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                    <p className="text-[8px] sm:text-[10px] uppercase font-black text-text/20 tracking-[0.3em] italic">Consultando Agenda...</p>
                                                </div>
                                            ) : availableSlots.length > 0 ? (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 px-1">
                                                    {availableSlots.map(time => (
                                                        <button 
                                                            key={time}
                                                            onClick={() => setSelectedTime(time)}
                                                            className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs transition-all border-2 tracking-tighter italic font-title ${
                                                                selectedTime === time 
                                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                                                : 'bg-white border-border text-text/60 hover:border-primary/20 active:bg-background'
                                                            }`}
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 sm:p-12 bg-white border-2 border-dashed border-border rounded-2xl sm:rounded-[40px] text-center space-y-4">
                                                    <Info size={24} className="text-text/10 mx-auto sm:size-[32px]" />
                                                    <p className="text-[9px] sm:text-[10px] font-black text-text/30 uppercase tracking-widest italic">A agenda do profissional está cheia neste dia.</p>
                                                    <button
                                                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                                                        className="px-5 py-2.5 bg-primary/5 text-primary rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm italic"
                                                    >
                                                        Ver Próxima Data
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Confirm Action Bar (Step 3 only) - Compacto */}
                            {step === 3 && selectedTime && (
                                <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-background/80 backdrop-blur-xl border-t border-border z-40 max-w-2xl mx-auto flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-[8px] sm:text-[9px] font-black text-text/30 uppercase tracking-[0.3em] mb-1 italic">
                                            {selectedServices.length} {selectedServices.length === 1 ? 'SERVIÇO' : 'SERVIÇOS'}
                                        </p>
                                        <h3 className="text-lg sm:text-xl font-black text-text leading-none italic font-title">R$ {totalPrice.toFixed(2)}</h3>
                                    </div>
                                    <button 
                                        onClick={handleBooking}
                                        disabled={isBooking}
                                        className="flex-[2] bg-cta text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs shadow-xl shadow-cta/20 hover:bg-cta/90 transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-30 active:scale-[0.98]"
                                    >
                                        {isBooking ? (
                                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>Confirmar <CheckCircle2 size={16} className="sm:size-[18px]" /></>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {tab === 'history' && (
                        <motion.div 
                            key="history-tab" 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-text font-title uppercase italic tracking-tighter">Sua Jornada</h2>
                                <div className="px-5 py-2 bg-primary/5 rounded-2xl border border-primary/10">
                                    <span className="text-[10px] text-primary font-black uppercase tracking-widest italic">{history.length} Cortes</span>
                                </div>
                            </div>
                            
                            {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map(appointment => (
                                        <div key={appointment.id} className="bg-white p-6 rounded-[32px] border border-border hover:border-primary/20 transition-all group shadow-sm">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex gap-4">
                                                    <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center border border-border group-hover:bg-primary/5 transition-colors shadow-inner">
                                                        <User size={24} className="text-text/10 group-hover:text-primary/40" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] text-text/20 font-black uppercase tracking-[0.2em]">Profissional Executor</p>
                                                        <p className="font-black text-text text-base leading-tight uppercase italic font-title">{appointment.barber_name || 'Especialista'}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border-2 shadow-sm italic ${
                                                    appointment.status === 'completed' ? 'bg-cta/5 border-cta/20 text-cta' : 
                                                    appointment.status === 'cancelled' ? 'bg-red-500/5 border-red-500/20 text-red-500' : 
                                                    'bg-primary/5 border-primary/20 text-primary'
                                                }`}>
                                                    {appointment.status === 'completed' ? 'Realizado' : 
                                                    appointment.status === 'cancelled' ? 'Cancelado' : 
                                                    appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-background p-4 rounded-2xl shadow-inner border border-border/40">
                                                    <p className="text-[9px] text-text/20 font-black uppercase tracking-[0.2em] mb-1">Serviços</p>
                                                    <p className="text-xs font-black text-text truncate uppercase italic font-title">{appointment.service_names}</p>
                                                </div>
                                                <div className="bg-background p-4 rounded-2xl shadow-inner border border-border/40">
                                                    <p className="text-[9px] text-text/20 font-black uppercase tracking-[0.2em] mb-1">Total</p>
                                                    <p className="text-xs font-black text-primary italic font-title">R$ {appointment.total_price || '0.00'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-primary/30" />
                                                        <span className="text-[10px] font-black text-text uppercase italic">{appointment.date && format(new Date(appointment.date), 'dd/MM/yy')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-primary/30" />
                                                        <span className="text-[10px] font-black text-text uppercase italic">{appointment.date && format(new Date(appointment.date), 'HH:mm')}</span>
                                                    </div>
                                                </div>
                                                <CheckCircle2 size={16} className="text-primary/10" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center gap-6 bg-white rounded-[40px] border border-dashed border-border border-2">
                                    <div className="w-24 h-24 bg-background rounded-[40px] flex items-center justify-center shadow-inner">
                                        <Clock size={40} className="text-text/5" strokeWidth={1} />
                                    </div>
                                    <p className="text-text/20 font-black uppercase text-[10px] tracking-[0.3em] italic">Seu histórico está em branco</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {tab === 'profile' && (
                        <motion.div 
                            key="profile-tab" 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="bg-white p-8 rounded-[48px] border border-border shadow-md">
                                <div className="flex flex-col items-center gap-6 mb-12">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange}
                                    />
                                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <div className="w-36 h-36 rounded-[48px] border-4 border-background overflow-hidden relative shadow-2xl transition-all group-hover:scale-105">
                                            {profileData.profile_picture ? (
                                                <img 
                                                    src={profileData.profile_picture instanceof File ? URL.createObjectURL(profileData.profile_picture) : getMediaUrl(profileData.profile_picture)} 
                                                    className="w-full h-full object-cover transition-transform duration-700" 
                                                    alt="Profile" 
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-background flex items-center justify-center text-text/5">
                                                    <User size={64} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-xl active:scale-90 transition-all">
                                            <Camera size={22} />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-3xl font-black text-text leading-tight uppercase font-title italic tracking-tight">{profileData.name || "Profissional Anônimo"}</h2>
                                        <p className="text-[10px] font-black text-text/30 uppercase tracking-[0.3em] mt-1">Status: Cliente Premium</p>
                                    </div>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-text/20 uppercase tracking-[0.3em] ml-2">Nome de Exibição</label>
                                        <input 
                                            type="text"
                                            value={profileData.name}
                                            onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-text font-black focus:border-primary/50 transition-all outline-none text-base shadow-sm font-title italic uppercase tracking-tight"
                                            placeholder="Seu nome"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-text/20 uppercase tracking-[0.3em] ml-2">WhatsApp</label>
                                            <input 
                                                type="text"
                                                value={user?.phone}
                                                disabled
                                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-text/30 font-bold outline-none text-base shadow-inner grayscale cursor-not-allowed italic"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-text/20 uppercase tracking-[0.3em] ml-2">Aniversário</label>
                                            <input 
                                                type="date"
                                                value={profileData.birth_date}
                                                onChange={e => setProfileData({ ...profileData, birth_date: e.target.value })}
                                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-text font-black focus:border-primary/50 transition-all outline-none text-base shadow-sm italic"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        className="w-full bg-primary text-white font-black py-5 rounded-[24px] hover:bg-primary/95 transition-all uppercase tracking-[0.2em] text-[10px] mt-6 shadow-xl shadow-primary/20 active:scale-[0.98]"
                                    >
                                        Salvar Perfil
                                    </button>
                                </form>

                                <button 
                                    onClick={logout}
                                    className="w-full flex items-center justify-center gap-3 py-6 text-cta font-black uppercase tracking-[0.3em] text-[9px] opacity-40 hover:opacity-100 hover:text-cta transition-all mt-8 border-t border-border italic"
                                >
                                    Encerrar Sessão <LogOut size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default CustomerBooking;

