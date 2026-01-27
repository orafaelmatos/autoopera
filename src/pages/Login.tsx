import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Lock, User, ArrowRight, Scissors, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import brandLogo from '../assets/newlogo.png';
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
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Branding Decorativo */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.03]">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary blur-[160px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cta blur-[160px] rounded-full" />
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0F4C5C 1px, transparent 0)', backgroundSize: '48px 48px' }} />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-lg bg-white p-10 sm:p-16 rounded-[48px] shadow-[0_48px_96px_-12px_rgba(15,76,92,0.2)] border border-border relative z-10"
            >
                <div className="flex flex-col items-center mb-6">
                    {/* Logo Area Prominente */}
                    <div className="mb-10 group relative">
                        <div className="absolute -inset-4 bg-primary/5 rounded-[40px] blur-2xl group-hover:bg-primary/10 transition-colors" />
                        {barbershop?.logo ? (
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[35px] overflow-hidden shadow-2xl border-[12px] border-white p-2 bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-700 relative z-10">
                                <img 
                                    src={getMediaUrl(barbershop?.logo)} 
                                    alt={barbershop.name} 
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center relative z-10">
                                <div className="w-20 h-20 bg-primary rounded-[28px] flex items-center justify-center shadow-2xl shadow-primary/30 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <Scissors className="text-white" size={32} />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center space-y-2">
                        {barbershop ? (
                            <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tighter font-title italic uppercase leading-tight">
                                {barbershop.name}
                            </h1>
                        ) : (
                            <h1 className="text-3xl font-black text-text tracking-tighter font-title uppercase italic">
                                Central de Agendamento
                            </h1>
                        )}
                        <p className="text-text/40 text-xs sm:text-sm font-bold italic uppercase tracking-widest">
                            {step === 'phone' && (barbershop ? `Acesse o Fluxo de Excelência` : 'Gerencie seus atendimentos')}
                            {step === 'confirm' && 'Verificação de Identidade'}
                            {step === 'register' && 'Crie seu Perfil Elite'}
                            {step === 'password' && 'Acesso Restrito Professional'}
                        </p>
                    </div>
                </div>

                {/* Role Toggle */}
                <div className="flex p-1.5 bg-background rounded-2xl border border-border mb-5">
                    <button 
                        onClick={() => { setMode('client'); setStep('phone'); }} 
                        className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mode==='client' ? 'bg-white text-primary shadow-md' : 'text-text/40 hover:text-primary'}`}
                    >
                        Sou Cliente
                    </button>
                    <button 
                        onClick={() => { setMode('owner'); setStep('phone'); }} 
                        className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mode==='owner' ? 'bg-white text-primary shadow-md' : 'text-text/40 hover:text-primary'}`}
                    >
                        Sou Barbeiro
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'phone' && (
                        <motion.form 
                            key="phone" 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }} 
                            onSubmit={handleInitialSubmit} 
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                {mode === 'client' ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-[0.2em]">Seu WhatsApp</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary transition-colors">
                                                <Smartphone size={20} />
                                            </div>
                                            <input 
                                                type="text"
                                                value={phone}
                                                onChange={handlePhoneChange}
                                                placeholder="(00) 00000-0000"
                                                className="w-full bg-background border border-border rounded-2xl py-5 pl-12 pr-4 text-text focus:border-primary/50 outline-none transition-all font-bold text-base shadow-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-[0.2em]">Seu CPF</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary transition-colors">
                                                <User size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                value={ownerCpf}
                                                onChange={(e) => setOwnerCpf(e.target.value)}
                                                placeholder="000.000.000-00"
                                                className="w-full bg-background border border-border rounded-2xl py-5 pl-12 pr-4 text-text focus:border-primary/50 outline-none transition-all font-bold text-base shadow-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between px-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe} 
                                        onChange={e => setRememberMe(e.target.checked)} 
                                        className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-text/40 group-hover:text-text transition-colors">Lembrar de mim</span>
                                </label>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-cta text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-cta/20 hover:bg-cta/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(230,126,34,0.3)]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Continuar
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    )}

                    {step === 'confirm' && (
                        <motion.div 
                            key="confirm" 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }} 
                            className="space-y-10 text-center py-4"
                        >
                            <div className="p-8 bg-primary/5 rounded-[40px] border border-primary/10 shadow-inner">
                                <p className="text-primary/40 text-[10px] uppercase tracking-[0.3em] font-black mb-4 italic">Identificamos seu perfil como:</p>
                                <p className="text-3xl font-black text-text tracking-tighter italic font-title">{foundName}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={handleConfirmSubmit}
                                    disabled={loading}
                                    className="w-full bg-primary text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                >
                                    {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sim, sou eu"}
                                </button>
                                <button 
                                    onClick={() => setStep('phone')}
                                    className="w-full py-3 text-text/30 hover:text-text font-bold transition-colors text-[10px] uppercase tracking-[0.2em] italic"
                                >
                                    Não sou eu / Trocar número
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'register' && (
                        <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegisterSubmit} className="space-y-8">
                            <div className="bg-cta/5 border border-cta/10 p-6 rounded-2xl flex gap-3">
                                <Info className="text-cta shrink-0" size={18} />
                                <p className="text-[11px] text-cta font-bold leading-relaxed italic">Primeira vez por aqui? Complete seus dados para prosseguir.</p>
                            </div>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Seu Nome</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary" size={18} />
                                        <input 
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Ex: João"
                                            className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text focus:border-primary/50 outline-none transition-all font-bold text-base shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Seu Sobrenome</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary" size={18} />
                                        <input 
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Ex: Silva"
                                            className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text focus:border-primary/50 outline-none transition-all font-bold text-base shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
                            >
                                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Concluir Cadastro"}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setStep('phone')}
                                className="w-full py-2 text-text/30 hover:text-text/60 font-bold transition-colors text-[10px] uppercase tracking-widest italic"
                            >
                                Voltar
                            </button>
                        </motion.form>
                    )}

                    {step === 'password' && (
                        <motion.form key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={mode === 'owner' ? handleOwnerSubmit : handlePasswordSubmit} className="space-y-10">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-primary ml-1 tracking-[0.2em]">Senha de Acesso</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                                    <input 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-primary/5 border border-primary/20 rounded-2xl py-5 pl-12 pr-4 text-text focus:border-primary/50 outline-none transition-all font-bold text-base shadow-sm"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 uppercase tracking-widest text-xs font-title"
                            >
                                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Acessar Painel"}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setStep('phone')}
                                className="w-full py-3 text-text/30 hover:text-text/60 font-bold transition-colors text-[10px] uppercase tracking-widest italic"
                            >
                                Não sou barbeiro / Voltar
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl text-[11px] font-bold uppercase flex gap-3 items-center italic shadow-sm">
                        <Info size={16} />
                        {error}
                    </motion.div>
                )}

                <div className="mt-12 pt-10 border-t border-border text-center">
                    <p className="text-text/30 text-[10px] font-medium leading-relaxed italic">
                        Ao entrar você concorda com nossos <br/> termos de uso e política de privacidade.
                    </p>
                    {!barbershop && (
                        <button 
                            onClick={() => navigate('/register')}
                            className="mt-6 text-primary font-black uppercase tracking-[0.2em] text-[10px] hover:underline flex items-center justify-center gap-2 group italic mx-auto"
                        >
                            Criar minha barbearia agora
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
