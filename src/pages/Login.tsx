import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Lock, User, ArrowRight, Scissors, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 11) {
            return digits
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2')
                .substring(0, 15);
        }
        return value.substring(0, 15);
    };

    const [phone, setPhone] = useState(formatPhone(localStorage.getItem('saved_phone') || ''));
    const [password, setPassword] = useState('');

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
    };
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [step, setStep] = useState<'phone' | 'confirm' | 'register' | 'password'>('phone');
    const [foundName, setFoundName] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(true);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const rawPhone = phone.replace(/\D/g, '');

        try {
            const res = await login({ phone: rawPhone }, rememberMe);
            
            if (res.error === 'CONFIRM_IDENTITY') {
                setFoundName(res.name);
                setStep('confirm');
            } else if (res.error === 'NAME_REQUIRED') {
                setStep('register');
            } else if (res.error === 'PASSWORD_REQUIRED') {
                setStep('password');
            } else if (res.access) {
                // Caso login direto ocorra por algum motivo
                if (rememberMe) localStorage.setItem('saved_phone', phone);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao verificar telefone.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSubmit = async () => {
        setLoading(true);
        const rawPhone = phone.replace(/\D/g, '');
        try {
            await login({ phone: rawPhone, confirm_identity: true }, rememberMe);
            if (rememberMe) localStorage.setItem('saved_phone', phone);
            navigate('/');
        } catch (err: any) {
            setError('Erro ao confirmar identidade.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const rawPhone = phone.replace(/\D/g, '');
        try {
            await login({ phone: rawPhone, first_name: firstName, last_name: lastName }, rememberMe);
            if (rememberMe) localStorage.setItem('saved_phone', phone);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar cadastro.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const rawPhone = phone.replace(/\D/g, '');
        try {
            await login({ phone: rawPhone, password }, rememberMe);
            if (rememberMe) localStorage.setItem('saved_phone', phone);
            navigate('/');
        } catch (err: any) {
            setError('Senha incorreta para barbeiro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#007AFF]/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#007AFF]/10 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/5 p-8 rounded-[32px] shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#007AFF] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#007AFF]/20">
                        <Scissors className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 italic">Barber<span className="text-[#007AFF]">Flow</span></h1>
                    <p className="text-gray-400 text-sm">
                        {step === 'phone' && 'Entre com seu WhatsApp para agendar'}
                        {step === 'confirm' && 'Verificação de Identidade'}
                        {step === 'register' && 'Seja bem-vindo! Primeiro acesso.'}
                        {step === 'password' && 'Área restrita para Barbeiros'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'phone' && (
                        <motion.form key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleInitialSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-500 ml-4 tracking-widest">WhatsApp</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input 
                                        type="text"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="(11) 99999-9999"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/10 bg-black/40 text-[#007AFF] focus:ring-0"
                                    />
                                    <span className="text-xs text-gray-500">Lembrar de mim</span>
                                </label>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#007AFF] hover:bg-[#0066CC] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#007AFF]/20"
                            >
                                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continuar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                            </button>
                        </motion.form>
                    )}

                    {step === 'confirm' && (
                        <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center">
                            <div className="p-6 bg-white/5 rounded-[24px] border border-white/5 shadow-inner">
                                <p className="text-gray-400 text-xs uppercase tracking-widest font-black mb-3">Identificamos você como:</p>
                                <p className="text-2xl font-black text-white tracking-tight">{foundName}</p>
                            </div>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={handleConfirmSubmit}
                                    disabled={loading}
                                    className="w-full bg-[#007AFF] hover:bg-[#0066CC] text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sim, sou eu"}
                                </button>
                                <button 
                                    onClick={() => setStep('phone')}
                                    className="w-full py-3 text-gray-500 hover:text-white font-bold transition-colors text-xs uppercase tracking-[0.2em]"
                                >
                                    Não sou eu / Trocar número
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'register' && (
                        <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegisterSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Seu Nome</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input 
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Ex: João"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Seu Sobrenome</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input 
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Ex: Silva"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#007AFF] hover:bg-[#0066CC] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#007AFF]/20"
                            >
                                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Concluir Cadastro"}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setStep('phone')}
                                className="w-full py-2 text-gray-600 hover:text-gray-400 font-bold transition-colors text-xs uppercase tracking-widest"
                            >
                                Voltar
                            </button>
                        </motion.form>
                    )}

                    {step === 'password' && (
                        <motion.form key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-[#007AFF] ml-4 tracking-widest">Senha Administrativa</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007AFF]" size={18} />
                                    <input 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#007AFF] hover:bg-[#0066CC] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Acessar Painel"}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setStep('phone')}
                                className="w-full py-2 text-gray-600 hover:text-gray-400 font-bold transition-colors text-xs uppercase tracking-widest"
                            >
                                Não sou barbeiro
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-[11px] font-bold uppercase flex gap-3 items-center">
                        <Info size={16} />
                        {error}
                    </motion.div>
                )}

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <p className="text-gray-500 text-xs">
                        Ao entrar você concorda com nossos termos de uso.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
