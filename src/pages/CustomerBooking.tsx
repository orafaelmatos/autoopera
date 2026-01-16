import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Scissors, Calendar, Clock, ChevronRight, 
  ChevronLeft, Check, Star, LogOut, Info, ArrowRight,
  CreditCard, Wallet, Camera, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { servicesApi, barbersApi, appointmentsApi, customersApi } from '../api';
import { Service, Barber } from '../types';
import { format, addDays, startOfToday, isSameDay, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const CustomerBooking: React.FC = () => {
    const { user, logout } = useAuth();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [step, setStep] = useState(1);
    const [tab, setTab] = useState<'booking' | 'history' | 'profile'>('booking');
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    
    // History states
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Profile states
    const [profileData, setProfileData] = useState({
        name: user?.full_name || user?.name || '',
        birth_date: user?.birth_date || '',
        profile_picture: user?.profile_picture || '',
        phone: user?.phone || ''
    });

    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [bData, sData] = await Promise.all([
                    barbersApi.getAll(),
                    servicesApi.getAll()
                ]);
                setBarbers(bData);
                setServices(sData);
            } catch (err) {
                toast.error("Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedBarber && selectedService && selectedDate) {
            loadAvailableSlots();
        }
    }, [selectedBarber, selectedService, selectedDate]);

    const loadAvailableSlots = async () => {
        setLoadingSlots(true);
        setSelectedTime(null);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const slots = await appointmentsApi.getAvailableSlots(
                selectedBarber!.id,
                selectedService!.id,
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

    const handleBooking = async () => {
        if (!selectedBarber || !selectedService || !selectedTime) return;

        setIsBooking(true);
        const [hours, minutes] = selectedTime.split(':');
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        try {
            await appointmentsApi.create({
                barberId: selectedBarber.id,
                serviceId: selectedService.id,
                clientName: profileData.name || 'Cliente',
                date: appointmentDate.toISOString(),
                customer: user?.profile_id ? String(user.profile_id) : undefined,
                platform: 'web'
            });
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
                formData.append('phone', profileData.phone);
                if (profileData.birth_date) formData.append('birth_date', profileData.birth_date);
                
                // profile_picture pode ser uma string (URL) ou um File
                if (profileData.profile_picture instanceof File) {
                    formData.append('profile_picture', profileData.profile_picture);
                }

                await customersApi.update(String(user.profile_id), formData as any);
                toast.success("Perfil atualizado!");
                // Opcional: recarregar página ou atualizar user context
            }
        } catch (error: any) {
            console.error("Erro ao atualizar perfil:", error);
            const message = error.response?.data ? Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(', ') : "Erro ao atualizar perfil.";
            toast.error(message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (bookingComplete) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
                        <Check className="text-white" size={48} />
                    </div>
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">SUCESSO!</h2>
                    <p className="text-gray-400 mb-8 max-w-[280px] mx-auto">
                        Seu horário com <strong>{selectedBarber?.name}</strong> foi confirmado.
                    </p>
                    
                    <div className="bg-[#1c1c1e] p-6 rounded-[32px] border border-white/5 mb-10 text-left space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Data</span>
                            <span className="text-white font-bold">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Horário</span>
                            <span className="text-[#007AFF] font-bold">{selectedTime}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Serviço</span>
                            <span className="text-white font-bold">{selectedService?.name}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-[#007AFF] text-white font-bold py-5 rounded-[24px] shadow-lg shadow-[#007AFF]/20 active:scale-95 transition-transform"
                    >
                        Voltar para o Início
                    </button>
                    <button onClick={logout} className="mt-6 text-gray-600 font-bold uppercase text-[10px] tracking-widest">Sair da Conta</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
            {/* Header Moderno */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl px-6 py-5 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                        <Scissors className="text-[#007AFF]" size={18} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white italic leading-none">Barber<span className="text-[#007AFF]">Flow</span></h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Premium Barber</p>
                    </div>
                </div>
                <button onClick={logout} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 active:bg-white/10">
                    <LogOut size={18} />
                </button>
            </header>

            <main className="flex-1 px-6 pt-8 pb-32">
                {tab === 'booking' && (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-white tracking-tighter">
                                    {step === 1 && "PROFISSIONAL"}
                                    {step === 2 && "SERVIÇO"}
                                    {step === 3 && "HORÁRIO"}
                                </h2>
                                <p className="text-gray-500 text-sm">Passo {step} de 3</p>
                            </div>
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-[#007AFF]' : 'w-2 bg-white/10'}`} />
                                ))}
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                                    {barbers.map(barber => (
                                        <button 
                                            key={barber.id}
                                            onClick={() => { setSelectedBarber(barber); setStep(2); }}
                                            className="w-full bg-[#1c1c1e] p-5 rounded-[28px] border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-[#0a0a0a] rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-[#007AFF]/30 overflow-hidden">
                                                    {barber.profile_picture ? (
                                                        <img src={barber.profile_picture} className="w-full h-full object-cover" alt={barber.name} />
                                                    ) : (
                                                        <User size={24} className="text-gray-600" />
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-white text-lg">{barber.name}</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Star size={12} fill="#FFB800" className="text-[#FFB800]" />
                                                        <span className="text-xs font-bold text-[#FFB800]">4.9</span>
                                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest ml-1">Especialista</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-gray-700 group-hover:text-[#007AFF] transition-colors" size={20} />
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                                    <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
                                        <ChevronLeft size={16} /> Voltar para profissionais
                                    </button>
                                    {services.map(service => (
                                        <button 
                                            key={service.id}
                                            onClick={() => { setSelectedService(service); setStep(3); }}
                                            className="w-full bg-[#1c1c1e] p-6 rounded-[32px] border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all"
                                        >
                                            <div className="text-left space-y-2">
                                                <p className="font-bold text-white text-lg leading-tight">{service.name}</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                                                        <Clock size={12} className="text-[#007AFF]" />
                                                        <span className="text-[10px] font-bold text-gray-400">{service.duration} min</span>
                                                    </div>
                                                    <span className="text-lg font-black text-[#007AFF]">R$ {service.price}</span>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#007AFF] group-hover:text-white transition-colors">
                                                <ArrowRight size={18} className="text-gray-600 group-hover:text-white" />
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                    <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                        <ChevronLeft size={16} /> Escolher outro serviço
                                    </button>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Data do Agendamento</p>
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                            {[0, 1, 2, 3, 4, 5, 6].map(i => {
                                                const date = addDays(startOfToday(), i);
                                                const isActive = isSameDay(date, selectedDate);
                                                return (
                                                    <button 
                                                        key={i}
                                                        onClick={() => setSelectedDate(date)}
                                                        className={`min-w-[70px] aspect-[4/5] rounded-[24px] flex flex-col items-center justify-center gap-1 transition-all border ${
                                                            isActive 
                                                            ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-xl shadow-[#007AFF]/30 scale-105' 
                                                            : 'bg-[#1c1c1e] border-white/5 text-gray-500'
                                                        }`}
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                                            {isSameDay(date, startOfToday()) ? "HJ" : isTomorrow(date) ? "AM" : format(date, 'EEE', { locale: ptBR }).substring(0, 2)}
                                                        </span>
                                                        <span className="text-xl font-black">{format(date, 'dd')}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Horários Disponíveis</p>
                                        {loadingSlots ? (
                                            <div className="flex flex-col items-center py-12 gap-3">
                                                <div className="w-8 h-8 border-3 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin" />
                                                <p className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">Verificando Agenda...</p>
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {availableSlots.map(time => (
                                                    <button 
                                                        key={time}
                                                        onClick={() => setSelectedTime(time)}
                                                        className={`py-4 rounded-2xl font-black text-sm transition-all border ${
                                                            selectedTime === time 
                                                            ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20' 
                                                            : 'bg-[#1c1c1e] border-white/10 text-gray-400 active:bg-white/5'
                                                        }`}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-10 bg-red-500/5 border border-red-500/10 rounded-[32px] text-center">
                                                <Info size={24} className="text-red-500/50 mx-auto mb-3" />
                                                <p className="text-xs font-bold text-red-500/50 uppercase tracking-widest">Sem horários para hoje</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {tab === 'history' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <h2 className="text-2xl font-black text-white">Seu Histórico</h2>
                        {history.length > 0 ? (
                            history.map(appointment => (
                                <div key={appointment.id} className="bg-[#1c1c1e] p-5 rounded-[28px] border border-white/5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                                                <User size={20} className="text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white uppercase text-[10px] tracking-widest text-gray-500 mb-0.5">Profissional</p>
                                                <p className="font-bold text-white">{appointment.barber_name}</p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            appointment.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                            appointment.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                            'bg-[#007AFF]/10 text-[#007AFF]'
                                        }`}>
                                            {appointment.status === 'completed' ? 'Concluído' : 
                                             appointment.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1 bg-white/5 p-3 rounded-2xl">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Serviço</p>
                                            <p className="text-xs font-black text-white">{appointment.service_name}</p>
                                        </div>
                                        <div className="flex-1 bg-white/5 p-3 rounded-2xl">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Data/Hora</p>
                                            <p className="text-xs font-black text-white">
                                                {appointment.date && format(new Date(appointment.date), 'dd/MM')} às {appointment.time?.substring(0, 5) || '--:--'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                    <Clock size={32} className="text-gray-800" />
                                </div>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum agendamento ainda</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {tab === 'profile' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <div className="flex flex-col items-center gap-4">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange}
                            />
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-24 h-24 bg-[#1c1c1e] rounded-[32px] border border-white/10 flex items-center justify-center overflow-hidden">
                                    {profileData.profile_picture ? (
                                        <img 
                                            src={profileData.profile_picture instanceof File ? URL.createObjectURL(profileData.profile_picture) : (profileData.profile_picture.startsWith('http') ? profileData.profile_picture : `http://127.0.0.1:8000${profileData.profile_picture}`)} 
                                            className="w-full h-full object-cover" 
                                            alt="Profile" 
                                        />
                                    ) : (
                                        <User size={40} className="text-gray-700" />
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#007AFF] rounded-2xl flex items-center justify-center border-4 border-[#0a0a0a] text-white shadow-xl active:scale-90 transition-all">
                                    <Camera size={18} />
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-white leading-tight">{profileData.name}</h2>
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">{user?.phone}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Nome Completo</label>
                                <input 
                                    type="text"
                                    value={profileData.name}
                                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full bg-[#1c1c1e] border-white/5 rounded-[24px] px-6 py-4 text-white font-bold focus:border-[#007AFF]/50 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Data de Nascimento</label>
                                <input 
                                    type="date"
                                    value={profileData.birth_date}
                                    onChange={e => setProfileData({ ...profileData, birth_date: e.target.value })}
                                    className="w-full bg-[#1c1c1e] border-white/5 rounded-[24px] px-6 py-4 text-white font-bold focus:border-[#007AFF]/50 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Telefone (Fixo)</label>
                                <input 
                                    type="text"
                                    readOnly
                                    value={profileData.phone}
                                    className="w-full bg-white/5 border-white/5 rounded-[24px] px-6 py-4 text-gray-500 font-bold outline-none cursor-not-allowed"
                                />
                            </div>

                            <button 
                                onClick={handleUpdateProfile}
                                className="w-full bg-white text-black font-black py-4 rounded-[24px] hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm mt-4 shadow-xl active:scale-[0.98]"
                            >
                                Salvar Alterações
                            </button>
                        </div>

                        <button 
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-3 py-4 text-red-500 font-bold uppercase tracking-widest text-xs opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <LogOut size={16} /> Sair da conta
                        </button>
                    </motion.div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-2xl border-t border-white/5 px-6 pt-4 pb-8 z-50">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    <button 
                        onClick={() => setTab('booking')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${tab === 'booking' ? 'text-[#007AFF] scale-110' : 'text-gray-600'}`}
                    >
                        <Calendar size={20} strokeWidth={tab === 'booking' ? 3 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
                    </button>
                    <button 
                        onClick={() => setTab('history')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${tab === 'history' ? 'text-[#007AFF] scale-110' : 'text-gray-600'}`}
                    >
                        <Clock size={20} strokeWidth={tab === 'history' ? 3 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Histórico</span>
                    </button>
                    <button 
                        onClick={() => setTab('profile')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${tab === 'profile' ? 'text-[#007AFF] scale-110' : 'text-gray-600'}`}
                    >
                        <User size={20} strokeWidth={tab === 'profile' ? 3 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
                    </button>
                </div>
            </nav>

            {/* Confirmation Drawer (Booking Only) */}
            {tab === 'booking' && step === 3 && selectedTime && (
                <div className="fixed bottom-24 left-0 right-0 px-6 z-40">
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-md mx-auto">
                        <div className="bg-[#1c1c1e] p-6 rounded-[32px] border border-white/10 shadow-2xl space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.2em] mb-1">Total a pagar</p>
                                    <h3 className="text-3xl font-black text-white leading-none">R$ {selectedService?.price}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Duração</p>
                                    <p className="text-sm font-black text-white">{selectedService?.duration} MIN</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleBooking}
                                disabled={isBooking}
                                className="w-full bg-[#007AFF] text-white font-black py-5 rounded-[24px] shadow-xl shadow-[#007AFF]/25 flex items-center justify-center gap-3 hover:bg-[#005cc2] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isBooking ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 size={24} />
                                        <span className="text-lg">Confirmar Agendamento</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default CustomerBooking;
