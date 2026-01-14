import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Scissors, Calendar, Clock, ChevronRight, 
  ChevronLeft, Check, Star, MapPin, Smartphone, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { servicesApi, barbersApi, appointmentsApi } from '../api';
import { Service, Barber } from '../types';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CustomerBooking: React.FC = () => {
    const { user, logout } = useAuth();
    const [step, setStep] = useState(1);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);

    useEffect(() => {
        barbersApi.getAll().then(setBarbers);
        servicesApi.getAll().then(setServices);
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

    const handleConfirmBooking = async () => {
        if (!selectedBarber || !selectedService || !selectedTime) return;

        const [hours, minutes] = selectedTime.split(':');
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        try {
            await appointmentsApi.create({
                barberId: selectedBarber.id,
                serviceId: selectedService.id,
                clientName: user?.name || user?.username || 'Cliente',
                date: appointmentDate.toISOString(),
                customer: user?.profile_id ? String(user.profile_id) : undefined,
                platform: 'web'
            });
            setBookingComplete(true);
        } catch (error) {
            console.error("Erro ao agendar:", error);
            alert("Erro ao agendar seu horário. Tente novamente.");
        }
    };

    if (bookingComplete) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-[#1c1c1e] p-12 rounded-[40px] border border-white/5 text-center"
                >
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20">
                        <Check className="text-white" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Agendado com Sucesso!</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Tudo certo, <strong>{user?.name}</strong>! Seu horário está confirmado. Te esperamos lá.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-[#007AFF] text-white font-bold py-5 rounded-[24px] shadow-lg shadow-[#007AFF]/20"
                    >
                        Fazer Outro Agendamento
                    </button>
                    <button 
                        onClick={logout}
                        className="w-full mt-4 text-gray-500 font-medium py-2"
                    >
                        Sair da Conta
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6">
                <div className="max-w-screen-xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#007AFF] rounded-xl flex items-center justify-center">
                            <Scissors className="text-white" size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-white italic">Barber<span className="text-[#007AFF]">Flow</span></h1>
                    </div>
                    
                    <button onClick={logout} className="text-gray-500 hover:text-white transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto pt-32 px-6">
                <div className="mb-12">
                    <h2 className="text-4xl font-bold text-white mb-2">Seja bem-vindo, {user?.name.split(' ')[0]}</h2>
                    <p className="text-gray-500">Agende seu horário em poucos segundos.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-4 mb-12">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex-1 h-1.5 rounded-full relative bg-white/5 overflow-hidden">
                            {step >= i && (
                                <motion.div 
                                    layoutId="progress"
                                    className="absolute inset-0 bg-[#007AFF]"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: 0 }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-white">Escolha um Profissional</h3>
                                    <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1 rounded-full uppercase tracking-widest">Passo 1 de 3</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {barbers.map(barber => (
                                        <button 
                                            key={barber.id}
                                            onClick={() => {
                                                setSelectedBarber(barber);
                                                setStep(2);
                                            }}
                                            className={`p-6 rounded-[32px] border transition-all text-left flex items-center gap-6 group ${
                                                selectedBarber?.id === barber.id 
                                                ? 'bg-[#007AFF] border-[#007AFF] text-white' 
                                                : 'bg-[#1c1c1e] border-white/5 hover:border-[#007AFF]/30 text-gray-400'
                                            }`}
                                        >
                                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                                                selectedBarber?.id === barber.id ? 'bg-white/20' : 'bg-[#0a0a0a]'
                                            }`}>
                                                <User size={32} className={selectedBarber?.id === barber.id ? 'text-white' : 'text-gray-600'} />
                                            </div>
                                            <div>
                                                <p className={`font-bold text-lg mb-1 ${selectedBarber?.id === barber.id ? 'text-white' : 'text-white'}`}>{barber.name}</p>
                                                <div className="flex items-center gap-1 text-[#007AFF]">
                                                    <Star size={14} fill="#007AFF" />
                                                    <span className="text-sm font-bold">4.9</span>
                                                    <span className="text-xs text-gray-500 ml-1">(120 avaliações)</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setStep(1)} className="p-2 -ml-2 text-gray-500 hover:text-white transition-colors">
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">O que vamos fazer hoje?</h3>
                                        <p className="text-sm text-gray-500">Selecionado: {selectedBarber?.name}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {services.map(service => (
                                        <button 
                                            key={service.id}
                                            onClick={() => {
                                                setSelectedService(service);
                                                setStep(3);
                                            }}
                                            className={`p-8 rounded-[32px] border transition-all text-left group flex justify-between items-center ${
                                                selectedService?.id === service.id 
                                                ? 'bg-[#007AFF] border-[#007AFF] text-white' 
                                                : 'bg-[#1c1c1e] border-white/5 hover:border-[#007AFF]/30 text-gray-400'
                                            }`}
                                        >
                                            <div>
                                                <p className={`font-bold text-lg mb-2 ${selectedService?.id === service.id ? 'text-white' : 'text-white'}`}>{service.name}</p>
                                                <div className="flex items-center gap-4 text-xs font-medium">
                                                    <span className="flex items-center gap-1.5"><Clock size={14} /> {service.duration} min</span>
                                                    <span className="opacity-50">•</span>
                                                    <span className="font-bold text-[#007AFF] group-hover:text-white">R$ {service.price}</span>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                                selectedService?.id === service.id ? 'bg-white/20' : 'bg-[#0a0a0a]'
                                            }`}>
                                                <ChevronRight size={20} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setStep(2)} className="p-2 -ml-2 text-gray-500 hover:text-white transition-colors">
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Escolha um Horário</h3>
                                        <p className="text-sm text-gray-500">{selectedService?.name} com {selectedBarber?.name}</p>
                                    </div>
                                </div>

                                {/* Calendar Horizontal */}
                                <div className="flex gap-2 p-2 bg-[#1c1c1e] rounded-[32px] border border-white/5 overflow-x-auto no-scrollbar">
                                    {[0, 1, 2, 3, 4, 5, 6].map(i => {
                                        const date = addDays(startOfToday(), i);
                                        const isActive = isSameDay(date, selectedDate);
                                        return (
                                            <button 
                                                key={i}
                                                onClick={() => setSelectedDate(date)}
                                                className={`min-w-[80px] p-6 rounded-[24px] flex flex-col items-center gap-2 transition-all ${
                                                    isActive ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20' : 'text-gray-500 hover:bg-white/5'
                                                }`}
                                            >
                                                <span className="text-[10px] uppercase font-bold tracking-widest">{format(date, 'EEE', { locale: ptBR })}</span>
                                                <span className="text-2xl font-black">{format(date, 'dd')}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Time Grid */}
                                {loadingSlots ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-10 h-10 border-4 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin"></div>
                                        <p className="text-gray-500 text-sm font-medium">Buscando horários disponíveis...</p>
                                    </div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {availableSlots.map(time => (
                                            <button 
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`py-4 rounded-2xl font-bold transition-all border ${
                                                    selectedTime === time 
                                                    ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20' 
                                                    : 'bg-[#1c1c1e] border-white/5 text-gray-400 hover:border-[#007AFF]/30'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-[#1c1c1e] border border-white/5 rounded-[32px] p-20 text-center">
                                        <Clock size={48} className="text-gray-800 mx-auto mb-6" />
                                        <p className="text-gray-400 text-sm font-semibold">Horários Esgotados</p>
                                        <p className="text-gray-600 text-xs mt-2">Nenhum horário disponível para este dia.</p>
                                    </div>
                                )}

                                <div className="pt-8 flex flex-col items-center gap-6">
                                    <div className="w-full max-w-md bg-white/5 p-8 rounded-[32px] border border-white/10 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Serviço</span>
                                            <span className="text-white font-bold">{selectedService?.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Barbeiro</span>
                                            <span className="text-white font-bold">{selectedBarber?.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Data e Hora</span>
                                            <span className="text-[#007AFF] font-bold">
                                                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} as {selectedTime || '--:--'}
                                            </span>
                                        </div>
                                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-lg font-bold text-white uppercase tracking-tighter">Total</span>
                                            <span className="text-2xl font-black text-[#007AFF]">R$ {selectedService?.price}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleConfirmBooking}
                                        disabled={!selectedTime}
                                        className={`w-full max-w-md py-6 rounded-[28px] font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                                            selectedTime 
                                            ? 'bg-[#007AFF] text-white shadow-2xl shadow-[#007AFF]/30 active:scale-95' 
                                            : 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5'
                                        }`}
                                    >
                                        Confirmar Agendamento <Check size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Sticky Nav Footer for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
                <div className="max-w-screen-xl mx-auto flex justify-center">
                    <div className="bg-[#1c1c1e]/90 backdrop-blur-2xl border border-white/5 px-8 py-4 rounded-[32px] flex gap-12 pointer-events-auto shadow-2xl">
                        <div className="flex flex-col items-center gap-1 text-[#007AFF]">
                            <Calendar size={20} />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Agender</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-400 cursor-pointer">
                            <Clock size={20} />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Histórico</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-400 cursor-pointer">
                            <User size={20} />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Perfil</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerBooking;
