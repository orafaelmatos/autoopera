import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Lock, User, ArrowRight, Scissors, Store, Globe, CheckCircle2, MapPin, Instagram, AlignLeft, Camera, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/logo.png';
import api from '../api';
import { useAuth } from '../AuthContext';
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
        instagram: '',
        description: '',
        banner: null as File | null,
        bannerPreview: ''
    });

    const navigate = useNavigate();
    const { login, refreshUser } = useAuth();
    const [existingUser, setExistingUser] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({
                ...formData,
                banner: file,
                bannerPreview: URL.createObjectURL(file)
            });
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
            const { confirmPassword, bannerPreview, ...dataToSubmit } = formData;
            
            const data = new FormData();
            Object.keys(dataToSubmit).forEach(key => {
                if (key === 'banner' && formData.banner) {
                    data.append('banner', formData.banner);
                } else if (key !== 'banner') {
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
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#007AFF]/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#007AFF]/10 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/5 p-5 md:p-6 rounded-[32px] shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-4">
                    <div className="flex items-center gap-4 mb-4 bg-white px-8 py-4 rounded-[28px] shadow-2xl">
                        <img 
                            src={brandLogo} 
                            alt="AutoOpera" 
                            className="h-7 w-auto object-contain"
                        />
                        <div className="w-px h-6 bg-gray-200" />
                        <span className="text-3xl font-bold text-[#007AFF] tracking-tighter">Barber</span>
                    </div>
                    <p className="text-gray-400 text-[10px]">Monte sua barbearia digital em segundos</p>
                </div>

                <div className="flex gap-2 mb-5 items-center justify-center">
                    {[1, 2].map(i => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? 'w-10 bg-[#007AFF]' : 'w-3 bg-white/10'}`} />
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {step === 1 ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2.5">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">CPF (se já recebeu usuário)</label>
                                <div className="relative flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={formData.cpf}
                                        onChange={e => setFormData({...formData, cpf: e.target.value})}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-4 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                        placeholder="000.000.000-00"
                                    />
                                    <button type="button" onClick={checkCpf} className="px-3 py-2 bg-[#007AFF] text-white rounded-xl text-xs">Buscar CPF</button>
                                </div>
                            </div>

                            {existingUser ? (
                                <>
                                    <div className="p-3 rounded-lg bg-green-900/20 border border-green-800/30">
                                        <p className="text-sm text-white font-bold">Olá, {formData.name || 'Usuário'}</p>
                                        <p className="text-[11px] text-gray-300">Login: {formData.phone}</p>
                                        <button type="button" onClick={() => { setExistingUser(false); setFormData({...formData, cpf: '', name: '', phone: ''}); }} className="mt-2 text-xs text-[#FFCCCB]">Não é você? Buscar outro CPF</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Senha</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                <input 
                                                    type="password" required
                                                    value={formData.password}
                                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Confirmar</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                <input 
                                                    type="password" required
                                                    value={formData.confirmPassword}
                                                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Nome Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                            <input 
                                                type="text" required
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                                placeholder="Seu nome"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">WhatsApp (Login)</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                            <input 
                                                type="text" required
                                                value={formData.phone}
                                                onChange={handlePhoneChange}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                                placeholder="(11) 99999-9999"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Senha</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                <input 
                                                    type="password" required
                                                    value={formData.password}
                                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Confirmar</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                <input 
                                                    type="password" required
                                                    value={formData.confirmPassword}
                                                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            <button 
                                type="button"
                                onClick={() => {
                                    if (step === 1) {
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
                                    }
                                }}
                                className="w-full bg-[#007AFF] hover:bg-[#0066CC] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#007AFF]/20 mt-2 text-sm"
                            >
                                Próximo Passo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2.5">
                            {/* Logo Upload (Substituindo Banner para maior clareza conforme pedido) */}
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Logo da Barbearia</label>
                                <div 
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    className="relative h-20 md:h-24 w-20 md:w-24 mx-auto bg-black/40 border border-white/5 border-dashed rounded-[32px] overflow-hidden cursor-pointer hover:border-[#007AFF]/50 transition-all flex items-center justify-center group"
                                >
                                    {formData.bannerPreview ? (
                                        <>
                                            <img src={formData.bannerPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="text-white" size={20} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-500">
                                            <Store size={20} className="mb-0.5" />
                                            <span className="text-[8px]">Logo</span>
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
                                <p className="text-center text-[8px] text-gray-500 font-medium">Recomendado: Logo com fundo transparente</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Nome da Barbearia</label>
                                <div className="relative">
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                    <input 
                                        type="text" required
                                        value={formData.shop_name}
                                        onChange={handleShopNameChange}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                        placeholder="Ex: Barbearia do William"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Instagram</label>
                                    <div className="relative">
                                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                        <input 
                                            type="text"
                                            value={formData.instagram}
                                            onChange={e => setFormData({...formData, instagram: e.target.value})}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                            placeholder="@sua"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Endereço</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                        <input 
                                            type="text"
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                            placeholder="Rua, Número, Bairro - Cidade"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Bio / Descrição</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-4 top-3 text-gray-500" size={14} />
                                    <textarea 
                                        rows={2}
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl pt-2.5 pb-2.5 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base resize-none"
                                        placeholder="Conte um pouco sobre sua barbearia..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 bg-[#007AFF]/5 p-4 rounded-2xl border border-[#007AFF]/10">
                                <label className="text-[9px] uppercase font-bold text-[#007AFF] ml-2 tracking-widest">Link para Agendamentos</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007AFF]" size={14} />
                                    <input 
                                        type="text" required
                                        value={formData.shop_slug}
                                        onChange={handleSlugChange}
                                        className="w-full bg-black/20 border border-[#007AFF]/20 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#007AFF]/50 transition-all font-medium text-base"
                                        placeholder="Ex: minha-barbearia"
                                    />
                                </div>
                                <p className="text-[10px] px-2 text-[#007AFF]/70 truncate mt-1 font-bold">
                                    Seu link: autoopera.com/b/<span className="underline">{formData.shop_slug || '...'}</span>
                                </p>
                            </div>
                            
                            <div className="flex gap-2 pt-1">
                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-xs"
                                >
                                    Voltar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[#007AFF] hover:bg-[#0063CC] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#007AFF]/20 text-xs"
                                >
                                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Criar Barbearia"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </form>

                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <p className="text-gray-500 text-[9px]">
                        Já tem uma conta? <button onClick={() => navigate('/login')} className="text-[#007AFF] font-bold">Entrar</button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default BarberRegister;
