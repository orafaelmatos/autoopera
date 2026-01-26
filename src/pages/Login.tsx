import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Lock, User, ArrowRight, Scissors, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import brandLogo from '../assets/logo.png';
import api from '../api';
import { Barbershop } from '../types';

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

    const getMediaUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const hostname = window.location.hostname;
        return `http://${hostname}:8000${path}`;
    };

    const [phone, setPhone] = useState(formatPhone(localStorage.getItem('saved_phone') || ''));
    const [mode, setMode] = useState<'client' | 'owner'>('client');
    const [ownerCpf, setOwnerCpf] = useState('');
    const [password, setPassword] = useState('');
    const [barbershop, setBarbershop] = useState<Barbershop | null>(null);

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
    
    const { login, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { slug: urlSlug } = useParams<{ slug?: string }>();

    useEffect(() => {
        const fetchShop = async () => {
            if (urlSlug) {
                try {
                    const res = await api.get('config/');
                    setBarbershop(res.data);
                } catch (err) {
                    console.error('Error fetching shop branding', err);
                }
            }
        };
        fetchShop();
    }, [urlSlug]);

    const getRedirectPath = (role: string, backendSlug?: string) => {
        const targetSlug = urlSlug || backendSlug || localStorage.getItem('last_barbershop_slug') || 'default';
        if (role === 'customer') {
            return `/b/${targetSlug}/booking`;
        }
        return `/b/${targetSlug}`;
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (mode === 'client') {
                const rawPhone = phone.replace(/\D/g, '');
                // Passa o slug da URL para o login se existir
                const loginData = { phone: rawPhone };
                if (urlSlug) (loginData as any).barbershop_slug = urlSlug;

                const res = await login(loginData, rememberMe);

                if (res.error === 'CONFIRM_IDENTITY') {
                    setFoundName(res.name);
                    setStep('confirm');
                } else if (res.error === 'NAME_REQUIRED') {
                    setStep('register');
                } else if (res.error === 'PASSWORD_REQUIRED') {
                    setStep('password');
                } else if (res.access) {
                    if (rememberMe) localStorage.setItem('saved_phone', phone);
                    navigate(getRedirectPath(res.role, res.barbershop));
                }
            } else {
                // owner mode: verify CPF exists then go to password
                const cpfDigits = ownerCpf.replace(/\D/g, '');
                if (!cpfDigits) {
                    setError('Informe o CPF do proprietário');
                    return;
                }
                try {
                    await api.get('auth/check-cpf/', { params: { cpf: cpfDigits } });
                    setStep('password');
                } catch (err: any) {
                    setError('CPF não encontrado');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Erro ao verificar credenciais.');
        } finally {
            setLoading(false);
        }
    };

    const handleOwnerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const cpfDigits = ownerCpf.replace(/\D/g, '');
            const body = { cpf: cpfDigits, password };
            const res = await api.post('auth/owner-login/', body);
            const access = res.data?.access;
            const refresh = res.data?.refresh;
            if (access && refresh) {
                localStorage.setItem('token', access);
                localStorage.setItem('refresh_token', refresh);
                if (res.data.barbershop) localStorage.setItem('last_barbershop_slug', res.data.barbershop);
                await refreshUser();
                navigate(getRedirectPath('barber', res.data.barbershop));
            } else {
                setError('Erro ao autenticar proprietário');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Erro ao autenticar proprietário');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSubmit = async () => {
        setLoading(true);
        const rawPhone = phone.replace(/\D/g, '');
        try {
            const loginData = { phone: rawPhone, confirm_identity: true };
            if (urlSlug) (loginData as any).barbershop_slug = urlSlug;

            const res = await login(loginData, rememberMe);
            if (rememberMe) localStorage.setItem('saved_phone', phone);
            navigate(getRedirectPath(res.role, res.barbershop));
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
            const loginData = { phone: rawPhone, first_name: firstName, last_name: lastName };
            if (urlSlug) (loginData as any).barbershop_slug = urlSlug;

            const res = await login(loginData, rememberMe);
            if (rememberMe) localStorage.setItem('saved_phone', phone);
            navigate(getRedirectPath(res.role, res.barbershop));
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
            const loginData = { phone: rawPhone, password };
            if (urlSlug) (loginData as any).barbershop_slug = urlSlug;

            const res = await login(loginData, rememberMe);
            if (rememberMe) localStorage.setItem('saved_phone', phone);
            navigate(getRedirectPath(res.role, res.barbershop));
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Branding */}
            {barbershop?.banner && (
                <div className="absolute inset-0 z-0">
                    <img 
                        src={getMediaUrl(barbershop.banner)} 
                        alt="Background" 
                        className="w-full h-full object-cover opacity-20 blur-sm scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/40" />
                </div>
            )}

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#007AFF]/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#007AFF]/10 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/5 p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    {barbershop?.logo ? (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden mb-6 shadow-2xl border-2 border-white/10 p-1 bg-white/5 flex items-center justify-center">
                            <img 
                                src={getMediaUrl(barbershop.logo)} 
                                alt={barbershop.name} 
                                className="max-w-full max-h-full object-contain rounded-lg"
                            />
                        </div>
                    ) : barbershop?.banner ? (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden mb-6 shadow-2xl border-2 border-white/10 p-1 bg-white/5 flex items-center justify-center">
                            <img 
                                src={getMediaUrl(barbershop.banner)} 
                                alt={barbershop.name} 
                                className="max-w-full max-h-full object-contain rounded-lg"
                            />
                        </div>
                    ) : (
                        <div className="w-full max-w-xs sm:max-w-none flex items-center justify-center gap-3 mb-6 bg-white px-6 py-3 rounded-[28px] shadow-2xl overflow-hidden">
                            <img 
                                src={brandLogo} 
                                alt="AutoOpera" 
                                className="h-7 sm:h-8 w-auto object-contain max-w-[55%]"
                            />
                            <div className="w-px h-6 bg-gray-200" />
                            <span className="text-2xl sm:text-4xl font-bold text-[#007AFF] tracking-tighter">Barber</span>
                        </div>
                    )}
                    
                    {barbershop ? (
                        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tighter uppercase text-center">
                            {barbershop.name}
                        </h1>
                    ) : (
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">
                            Boas-vindas!
                        </h1>
                    )}
                    <p className="text-gray-400 text-sm text-center font-medium">
                        {step === 'phone' && (barbershop ? `Bem-vindo à área de agendamentos da ${barbershop.name}` : 'Entre com seu WhatsApp para agendar')}
                        {step === 'confirm' && 'Verificação de Identidade'}
                        {step === 'register' && 'Seja bem-vindo! Primeiro acesso.'}
                        {step === 'password' && 'Área restrita para Barbeiros'}
                    </p>
                </div>

                <div className="flex justify-center gap-3 mb-4">
                    <button onClick={() => { setMode('client'); setStep('phone'); }} className={`px-3 py-2 rounded-full text-sm ${mode==='client' ? 'bg-[#007AFF] text-white' : 'bg-white/5 text-gray-300'}`}>Cliente</button>
                    <button onClick={() => { setMode('owner'); setStep('phone'); }} className={`px-3 py-2 rounded-full text-sm ${mode==='owner' ? 'bg-[#007AFF] text-white' : 'bg-white/5 text-gray-300'}`}>Barbeiro</button>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'phone' && (
                        <motion.form key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleInitialSubmit} className="space-y-6">
                            <div className="space-y-2">
                                {mode === 'client' ? (
                                    <>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 ml-4 tracking-widest">WhatsApp</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <input 
                                                type="text"
                                                value={phone}
                                                onChange={handlePhoneChange}
                                                placeholder="(11) 99999-9999"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium text-base"
                                                required
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 ml-4 tracking-widest">CPF</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={ownerCpf}
                                                onChange={(e) => setOwnerCpf(e.target.value)}
                                                placeholder="000.000.000-00"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-4 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium text-base"
                                                required
                                            />
                                        </div>
                                    </>
                                )}
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
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium text-base"
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
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium text-base"
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
                        <motion.form key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={mode === 'owner' ? handleOwnerSubmit : handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-[#007AFF] ml-4 tracking-widest">Senha Administrativa</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007AFF]" size={18} />
                                    <input 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all font-medium text-base"
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
