import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Lock, User, ArrowRight, Scissors, Store, Globe, CheckCircle2, MapPin, Instagram, AlignLeft, Camera, Image as ImageIcon, Mail, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/newlogo.png';
import api from '../api';
import { useAuth } from '../AuthContext';
import { compressImage } from '../utils/image';
import toast from 'react-hot-toast';

const BarberRegister: React.FC = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        cpf: '',
        password: '',
        confirmPassword: '',
        name: '',
        shop_name: '',
        shop_slug: '',
        address: '',
        email: '',
        instagram: '',
        description: '',
        logo: null as File | null,
        logoPreview: ''
    });

    const navigate = useNavigate();
    const { login, refreshUser } = useAuth();
    const [existingUser, setExistingUser] = useState(false);
    const [compressing, setCompressing] = useState(false);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCompressing(true);
            try {
                const compressed = await compressImage(file, 800, 0.7);
                setFormData({
                    ...formData,
                    logo: compressed,
                    logoPreview: URL.createObjectURL(compressed)
                });
            } catch (err) {
                toast.error("Erro ao processar imagem");
            } finally {
                setCompressing(false);
            }
        }
    };

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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setFormData({ ...formData, shop_slug: value });
    };

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        const oldSlug = slugify(formData.shop_name);
        
        // Se o slug atual for igual ao slug do nome antigo (ou estiver vazio), atualizamos o slug também
        if (formData.shop_slug === oldSlug || formData.shop_slug === '') {
            setFormData({ 
                ...formData, 
                shop_name: newName,
                shop_slug: slugify(newName)
            });
        } else {
            setFormData({ ...formData, shop_name: newName });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('As senhas não coincidem!');
            return;
        }

        setLoading(true);

        try {
            const rawPhone = formData.phone.replace(/\D/g, '');
            const { confirmPassword, logoPreview, ...dataToSubmit } = formData;
            
            const data = new FormData();
            Object.keys(dataToSubmit).forEach(key => {
                if (key === 'logo' && formData.logo) {
                    data.append('logo', formData.logo);
                } else if (key !== 'logo') {
                    data.append(key, (dataToSubmit as any)[key]);
                }
            });
            data.set('phone', rawPhone);

            const res = await api.post('auth/register-barber/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // If the register endpoint returned tokens, persist them and refresh user state
            const access = res.data?.access;
            const refresh = res.data?.refresh;
            if (access && refresh) {
                localStorage.setItem('token', access);
                localStorage.setItem('refresh_token', refresh);
                if (res.data.barbershop) localStorage.setItem('last_barbershop_slug', res.data.barbershop);
                await refreshUser();
            } else {
                // Fallback to legacy login flow
                await login({ phone: rawPhone, password: formData.password }, true);
            }

            toast.success('Barbearia criada com sucesso!');
            navigate(`/b/${res.data.barbershop}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao criar barbearia');
        } finally {
            setLoading(false);
        }
    };

    const checkCpf = async () => {
        if (!formData.cpf) {
            toast.error('Informe o CPF para buscar.');
            return;
        }
        setLoading(true);
        try {
            const digits = formData.cpf.replace(/\D/g, '');
            const res = await api.get('auth/check-cpf/', { params: { cpf: digits } });
            if (res.status === 200) {
                const { name, phone } = res.data;
                setFormData({ ...formData, name: name || '', phone: phone || '' });
                setExistingUser(true);
                toast.success(`Olá ${name}, encontramos seu usuário.`);
            }
        } catch (err: any) {
            setExistingUser(false);
            toast.error('CPF não encontrado. Preencha os dados manualmente.');
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
                className="w-full max-w-xl bg-white p-8 md:p-12 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(15,76,92,0.15)] border border-border relative z-10"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="mb-6 group">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20 group-hover:rotate-0 ">
                                <img src={brandLogo} className="w-10 h-auto object-contain" alt="Logo" />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-text tracking-tighter uppercase font-title">Autoopera</span>
                                <span className="text-2xl font-light text-primary italic lowercase font-title">barber</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-text/40 text-[10px] font-black uppercase tracking-[0.3em] italic">Nova Barbearia Profissional</p>
                </div>

                {/* Progress Steps */}
                <div className="flex gap-3 mb-5 items-center justify-center">
                    {[1, 2].map(i => (
                        <div key={i} className="flex items-center gap-2">
                             <div className={`h-2 rounded-full transition-all duration-700 ${step >= i ? 'w-16 bg-primary shadow-[0_0_15px_rgba(15,76,92,0.3)]' : 'w-4 bg-background border border-border'}`} />
                             {i === 1 && <span className={`text-[9px] font-black uppercase ${step === 1 ? 'text-primary' : 'text-text/20 hover:text-text/40'}`}>Perfil</span>}
                             {i === 2 && <span className={`text-[9px] font-black uppercase ${step === 2 ? 'text-primary' : 'text-text/20 hover:text-text/40'}`}>Negócio</span>}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-[0.2em]">Seu CPF</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.cpf}
                                        onChange={e => setFormData({...formData, cpf: e.target.value})}
                                        className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-bold text-base shadow-sm"
                                        placeholder="000.000.000-00"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Removido o botão de Busca - Sempre o primeiro acesso */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Seu Nome Completo</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary" size={18} />
                                        <input 
                                            type="text" required
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-bold text-base shadow-sm"
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">WhatsApp Profissional</label>
                                    <div className="relative group">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary" size={18} />
                                        <input 
                                            type="text" required
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-bold text-base shadow-sm"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Senha</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary" size={18} />
                                            <input 
                                                type="password" required
                                                value={formData.password}
                                                onChange={e => setFormData({...formData, password: e.target.value})}
                                                className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-bold text-base shadow-sm"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Confirmar</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary" size={18} />
                                            <input 
                                                type="password" required
                                                value={formData.confirmPassword}
                                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                                className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-bold text-base shadow-sm"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="button" 
                                onClick={() => {
                                    if (existingUser) {
                                        if (!formData.password) {
                                            toast.error('Por favor, insira sua senha.');
                                            return;
                                        }
                                        if (formData.password !== formData.confirmPassword) {
                                            toast.error('As senhas não coincidem!');
                                            return;
                                        }
                                    } else {
                                        if (!formData.name || !formData.phone || !formData.password) {
                                            toast.error('Por favor, preencha todos os campos!');
                                            return;
                                        }
                                        if (formData.password !== formData.confirmPassword) {
                                            toast.error('As senhas não coincidem!');
                                            return;
                                        }
                                    }
                                    setStep(2);
                                }}
                                className="w-full mt-6 bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
                            >
                                Próxima Etapa
                                <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className="space-y-6">
                                {/* Logo Upload */}
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Logo da Barbearia</label>
                                    <div 
                                        onClick={() => !compressing && document.getElementById('logo-upload')?.click()}
                                        className="relative h-28 w-28 mx-auto bg-background border-2 border-dashed border-border rounded-[32px] overflow-hidden cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center group shadow-inner"
                                    >
                                        {compressing ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="text-primary animate-spin mb-2" size={24} strokeWidth={3} />
                                                <span className="text-[8px] font-black uppercase text-primary">Processando</span>
                                            </div>
                                        ) : formData.logoPreview ? (
                                            <>
                                                <img src={formData.logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <Camera className="text-white" size={24} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-text/20">
                                                <Store size={28} className="mb-2" />
                                                <span className="text-[9px] font-black uppercase italic">Upload</span>
                                            </div>
                                        )}
                                        <input 
                                            id="logo-upload"
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Nome da Barbearia</label>
                                    <div className="relative group">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary transition-colors" size={18} />
                                        <input 
                                            type="text" required
                                            value={formData.shop_name}
                                            onChange={handleShopNameChange}
                                            className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-bold text-base shadow-sm"
                                            placeholder="Ex: Barber Shop Premium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Instagram</label>
                                        <div className="relative group">
                                            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary" size={18} />
                                            <input 
                                                type="text"
                                                value={formData.instagram}
                                                onChange={e => setFormData({...formData, instagram: e.target.value})}
                                                className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-bold text-base shadow-sm"
                                                placeholder="@suabarbearia"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Localização</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary" size={18} />
                                            <input 
                                                type="text"
                                                value={formData.address}
                                                onChange={e => setFormData({...formData, address: e.target.value})}
                                                className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-bold text-base shadow-sm"
                                                placeholder="Cidade, Estado"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">E-mail profissional</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-primary" size={18} />
                                        <input 
                                            type="email" required
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-bold text-base shadow-sm"
                                            placeholder="contato@suabarbearia.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text/30 ml-1 tracking-widest">Bio do Negócio</label>
                                    <div className="relative group">
                                        <AlignLeft className="absolute left-4 top-4 text-text/20 group-focus-within:text-primary" size={18} />
                                        <textarea 
                                            rows={2}
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                            className="w-full bg-background border border-border rounded-2xl pt-4 pb-4 pl-12 pr-4 text-text outline-none focus:border-primary/50 transition-all font-medium text-sm resize-none italic"
                                            placeholder="Conte o diferencial da sua barbearia..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 p-6 bg-primary/5 rounded-[32px] border border-primary/10 shadow-inner">
                                    <label className="text-[10px] uppercase font-black text-primary ml-1 tracking-widest">Seu Link de Agendamento</label>
                                    <div className="relative group mt-2">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary" size={18} />
                                        <input 
                                            type="text" required
                                            value={formData.shop_slug}
                                            onChange={handleSlugChange}
                                            className="w-full bg-white border border-primary/20 rounded-2xl py-4 pl-12 pr-4 text-primary font-mono text-sm outline-none shadow-sm"
                                            placeholder="minha-barbearia"
                                        />
                                    </div>
                                    <p className="text-[10px] text-text/40 font-bold italic mt-2 px-2">
                                        Visualização: <span className="text-primary italic">autoopera.com/b/{formData.shop_slug || '...'}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setStep(1)}
                                    className="px-8 py-5 bg-background border border-border text-text/40 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-text transition-all italic shadow-sm"
                                >
                                    Voltar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading || compressing}
                                    className="flex-1 bg-cta text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-cta/20 hover:bg-cta/90 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(230,126,34,0.3)] disabled:opacity-50"
                                >
                                    {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : compressing ? "Processando Imagem..." : <>Finalizar Cadastro </>}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </form>

                <div className="mt-12 pt-10 border-t border-border flex flex-col items-center">
                    <p className="text-text/40 text-[10px] font-medium mb-4 italic">Já possui uma conta?</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-primary font-black uppercase tracking-[0.2em] text-[10px] hover:underline italic"
                    >
                        Acessar Painel Profissional
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default BarberRegister;
