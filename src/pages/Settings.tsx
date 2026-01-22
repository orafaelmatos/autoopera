
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Settings, Link2, ExternalLink, 
  Plus, Trash2, Clock, Save, Calendar, 
  AlertCircle, Building2, Camera, MapPin, Phone, User,
  Mail, Info, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Availability, ScheduleException, Barbershop, DailyAvailability } from '../types';
import { availabilityApi, scheduleExceptionsApi, barbershopApi, getMediaUrl, barbersApi, dailyAvailabilityApi } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

interface Props {
  availability: Availability[];
  setAvailability: (a: Availability[]) => void;
  barbershop: Barbershop | null;
  setBarbershop: (b: Barbershop) => void;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const SettingsView: React.FC<Props> = ({ availability, setAvailability, barbershop, setBarbershop }) => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'shop' | 'profile' | 'schedule'>('shop');
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'profile') {
      setActiveTab('profile');
    } else if (tab === 'schedule') {
      setActiveTab('schedule');
    } else {
      setActiveTab('shop');
    }
  }, [location]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  // Daily availability (per-date shifts)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [dailyShifts, setDailyShifts] = useState<Array<{startTime:string,endTime:string,isActive:boolean,id?:string}>>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const profilePicInputRef = React.useRef<HTMLInputElement>(null);
  
  const [shopData, setShopData] = useState<Partial<Barbershop>>({
    name: '',
    description: '',
    address: '',
    phone: '',
    primary_color: 'var(--primary-color, #007AFF)',
    slug: ''
  });

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    description: '',
  });

  useEffect(() => {
    if (barbershop) {
      setShopData({
        name: barbershop.name,
        description: barbershop.description || '',
        address: barbershop.address || '',
        phone: barbershop.phone || '',
        primary_color: barbershop.primary_color || 'var(--primary-color, #007AFF)',
        slug: barbershop.slug || ''
      });
    }
  }, [barbershop]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        description: (user as any).description || ''
      });
    }
  }, [user]);
  const [newException, setNewException] = useState<Partial<ScheduleException>>({
    type: 'blocked',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '19:00'
  });

  // Calendar states for month overview
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [availMap, setAvailMap] = useState<Record<string, DailyAvailability[]>>({});
  const [showDayModal, setShowDayModal] = useState(false);

  const formatDate = (d: Date) => d.toISOString().slice(0,10);

  const calendarMatrix = (month: Date) => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const firstWeekday = first.getDay();
    const daysInMonth = new Date(year, m+1, 0).getDate();
    const cells: Array<{day:number,date:string,isCurrentMonth:boolean}> = [];
    // previous month blanks
    for (let i=0;i<firstWeekday;i++) {
      const prevDate = new Date(year, m, 1 - (firstWeekday - i));
      cells.push({ day: prevDate.getDate(), date: formatDate(prevDate), isCurrentMonth: false });
    }
    for (let d=1; d<=daysInMonth; d++) {
      const dd = new Date(year, m, d);
      cells.push({ day: d, date: formatDate(dd), isCurrentMonth: true });
    }
    // fill to complete weeks
    while (cells.length % 7 !== 0) {
      const nextDayIndex = cells.length - (firstWeekday) + 1;
      const nextDate = new Date(year, m, daysInMonth + (cells.length - (firstWeekday)) + 1);
      cells.push({ day: nextDate.getDate(), date: formatDate(nextDate), isCurrentMonth: false });
    }
    return cells;
  };

  const loadMonthAvailabilities = async (month: Date) => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const start = new Date(year, m, 1);
    const end = new Date(year, m+1, 0);
    try {
      const res = await dailyAvailabilityApi.getForRange(formatDate(start), formatDate(end));
      const map: Record<string, DailyAvailability[]> = {};
      res.forEach((d: DailyAvailability) => {
        if (!map[d.date]) map[d.date] = [];
        map[d.date].push(d);
      });
      setAvailMap(map);
    } catch (err) {
      setAvailMap({});
    }
  };

  useEffect(() => {
    loadMonthAvailabilities(currentMonth);
  }, [currentMonth]);

  const openDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = availMap[dateStr] || [];
    setDailyShifts(existing.map(d => ({ startTime: d.start_time ? (d as any).start_time : d.startTime, endTime: d.end_time ? (d as any).end_time : d.endTime, isActive: d.is_active !== undefined ? d.is_active : d.isActive, id: d.id })));
    setShowDayModal(true);
  };

  useEffect(() => {
    loadExceptions();
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingDaily(true);
      try {
        const res = await dailyAvailabilityApi.getForDate(selectedDate);
        if (!mounted) return;
        setDailyShifts(res.map((d: DailyAvailability) => ({ startTime: d.startTime, endTime: d.endTime, isActive: d.isActive, id: d.id })));
      } catch (e) {
        setDailyShifts([]);
      } finally {
        setLoadingDaily(false);
      }
    };
    load();
    return () => { mounted = false };
  }, [selectedDate]);

  const loadExceptions = async () => {
    try {
      const data = await scheduleExceptionsApi.getAll();
      setExceptions(data);
    } catch (error) {
      console.error("Erro ao carregar exceções:", error);
    }
  };

  const toggleDay = (dayIdx: number) => {
    const dayIntervals = availability.filter(a => a.dayOfWeek === dayIdx);
    if (dayIntervals.length > 0) {
      // Se já tem intervalos, remove todos (desativa o dia)
      setAvailability(availability.filter(a => a.dayOfWeek !== dayIdx));
    } else {
      // Se não tem nada, adiciona um intervalo padrão
      setAvailability([...availability, {
        dayOfWeek: dayIdx,
        startTime: '09:00',
        endTime: '18:00',
        isActive: true
      } as any]);
    }
  };

  const addInterval = (dayIdx: number) => {
    setAvailability([...availability, {
      dayOfWeek: dayIdx,
      startTime: '08:00',
      endTime: '12:00',
      isActive: true
    } as any]);
  };

  const removeInterval = (index: number) => {
    const newAv = [...availability];
    newAv.splice(index, 1);
    setAvailability(newAv);
  };

  const updateIntervalTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newAv = [...availability];
    (newAv[index] as any)[field] = value;
    setAvailability(newAv);
  };

  const handleSaveAvailability = async () => {
    try {
      // Salvar informações da Barbearia
      if (activeTab === 'shop') {
        const formData = new FormData();
        if (shopData.name) formData.append('name', shopData.name);
        if (shopData.description) formData.append('description', shopData.description);
        if (shopData.address) formData.append('address', shopData.address);
        if (shopData.phone) formData.append('phone', shopData.phone);
        if (shopData.primary_color) formData.append('primary_color', shopData.primary_color);
        
        const updatedShop = await barbershopApi.update(formData);
        setBarbershop(updatedShop);
      } 
      
      // Salvar informações do Perfil
      if (activeTab === 'profile') {
        if (user?.profile_id) {
          const formData = new FormData();
          formData.append('name', profileData.name);
          formData.append('email', profileData.email);
          formData.append('description', profileData.description);
          await barbersApi.update(String(user.profile_id), formData as any);
          await refreshUser();
        }
      }

      // Sincronizar Horários (Apenas se estiver na aba de horários)
      if (activeTab === 'schedule') {
        const synced = await availabilityApi.sync(availability);
        setAvailability(synced);
      }

      toast.success("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar alterações.");
    }
  };

  const handleFileChange = async (type: 'logo' | 'profile', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      if (type === 'profile') {
        if (user?.profile_id) {
          formData.append('profile_picture', file);
          await barbersApi.update(String(user.profile_id), formData as any);
          await refreshUser();
          toast.success("Sua foto de perfil foi atualizada!");
        }
      } else {
        formData.append(type, file);
        const updatedShop = await barbershopApi.update(formData);
        setBarbershop(updatedShop);
        toast.success(`O Logo da Barbeira foi atualizado!`);
      }
    } catch (err) {
      toast.error("Erro ao enviar imagem.");
    }
  };

  const handleAddException = async () => {
    if (!newException.reason || !newException.date) {
      toast.error("Preencha o motivo e a data");
      return;
    }
    try {
      await scheduleExceptionsApi.create(newException);
      setNewException({
        ...newException,
        reason: ''
      });
      loadExceptions();
      toast.success("Exceção adicionada");
    } catch (error) {
      console.error("Erro ao criar exceção:", error);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      await scheduleExceptionsApi.delete(id);
      loadExceptions();
      toast.success("Exceção removida");
    } catch (error) {
      console.error("Erro ao excluir exceção:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 sm:space-y-12 pb-20 px-4 sm:px-0"
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            {activeTab === 'shop' ? 'Ajustes da Barbearia' : 
             activeTab === 'schedule' ? 'Gestão de Horários' : 'Meu Perfil Profissional'}
          </h2>
          <p className="text-xs sm:text-sm text-white/50 font-medium">
            {activeTab === 'shop' ? 'Gerencie as informações públicas e visuais do seu estabelecimento.' : 
             activeTab === 'schedule' ? 'Configure sua jornada de trabalho semanal e bloqueios de agenda.' :
             'Personalize sua identidade como profissional dentro da plataforma.'}
          </p>
        </div>
        <button 
          onClick={handleSaveAvailability}
          className="w-full sm:w-auto bg-accent text-white px-6 py-3.5 rounded-xl sm:rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/20 text-sm"
        >
          <Save size={18} />
          Salvar Alterações
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Lado Esquerdo - Configurações Principais */}
        <div className="xl:col-span-8 space-y-6 sm:space-y-8">
          
          {activeTab === 'shop' && (
            /* Perfil da Barbearia */
            <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] overflow-hidden">
                {/* Header Estilizado com Banner e Logo */}
                <div className="relative h-48 sm:h-64 bg-accent/10 overflow-hidden">
                    {/* Fundo Decorativo do Banner */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#1c1c1e]" />
                    
                    {/* Botão para Alterar Banner (Simulado ou Real se houver campo) */}
                    <div className="absolute top-6 right-8">
                        <button className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all flex items-center gap-2">
                            <Camera size={14} />
                            Alterar Banner
                        </button>
                    </div>

                    {/* Logo Preview Centralizado e Elevado */}
                    <div className="absolute -bottom-10 left-8 flex items-end gap-6 h-fit">
                        <div 
                            className="w-32 h-32 sm:w-40 sm:h-40 rounded-[40px] bg-[#1c1c1e] border-8 border-[#0a0a0a] overflow-hidden shadow-2xl group/logo cursor-pointer relative"
                            onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}
                        >
                            {barbershop?.logo ? (
                                <img src={getMediaUrl(barbershop.logo)} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Building2 size={48} className="text-white/10" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-all duration-300">
                                <Camera size={24} className="mb-2" />
                                <span className="text-[9px] font-black uppercase tracking-tighter text-center px-4">Trocar Logo</span>
                            </div>
                        </div>
                        <div className="mb-10 hidden sm:block">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{shopData.name || 'Sua Barbearia'}</h3>
                            <button 
                                onClick={() => logoInputRef.current?.click()}
                                className="text-accent text-[10px] font-black uppercase tracking-widest mt-1 hover:underline flex items-center gap-1"
                            >
                                <Plus size={12} /> Alterar imagem do perfil
                            </button>
                        </div>
                    </div>
                    <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileChange('logo', e)} accept="image/*" />
                </div>

                <div className="pt-20 p-8 space-y-8">
                    {/* Informativo de Identidade Visual */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1 tracking-tight">Identidade Visual</h4>
                            <p className="text-xs text-white/40 leading-relaxed">Sua logo e banner aparecem no link de agendamento público e no topo do app para seus clientes.</p>
                        </div>
                    </div>

                    {/* Link da Agenda */}
                    <div className="bg-accent/5 border border-accent/20 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Link2 size={80} className="text-accent" />
                        </div>
                        <div className="relative z-10">
                            <label className="text-[9px] font-black text-accent uppercase tracking-[0.3em] mb-3 block">Link da sua Agenda (Público)</label>
                            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                                <div className="flex-1 bg-black/40 border border-white/5 px-5 py-4 rounded-2xl text-white font-mono text-xs sm:text-sm truncate">
                                    {`${window.location.origin}/b/${shopData.slug}/booking`}
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/b/${shopData.slug}/booking`);
                                        toast.success("Link copiado!");
                                    }}
                                    className="bg-accent text-white font-bold px-6 py-4 rounded-2xl hover:bg-[#0066CC] transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-95"
                                >
                                    <ExternalLink size={16} />
                                    <span>Copiar Link</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-3 block tracking-[0.2em]">Nome da Barbearia</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input 
                                    type="text"
                                    value={shopData.name}
                                    onChange={e => setShopData({...shopData, name: e.target.value})}
                                    placeholder="Nome oficial"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-accent outline-none transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-3 block tracking-[0.2em]">Telefone / WhatsApp</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input 
                                    type="text"
                                    value={shopData.phone || ''}
                                    onChange={e => setShopData({...shopData, phone: e.target.value})}
                                    placeholder="(00) 00000-0000"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-accent outline-none transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-3 block tracking-[0.2em]">Endereço Completo</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            <input 
                                type="text"
                                value={shopData.address || ''}
                                onChange={e => setShopData({...shopData, address: e.target.value})}
                                placeholder="Rua, Número, Bairro, Cidade"
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-accent outline-none transition-all placeholder:text-white/10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-3 block tracking-[0.2em]">Slogan ou Bio</label>
                        <textarea 
                            value={shopData.description || ''}
                            onChange={e => setShopData({...shopData, description: e.target.value})}
                            placeholder="Ex: A melhor experiência em corte de cabelo da região."
                            rows={3}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-4 text-white font-medium focus:border-accent outline-none transition-all placeholder:text-white/10 resize-none"
                        />
                    </div>
                </div>
            </section>
          )}

          {activeTab === 'profile' && (
            /* Perfil do Barbeiro */
            <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        {/* Foto de Perfil */}
                        <div 
                            className="relative group cursor-pointer" 
                            onClick={() => profilePicInputRef.current?.click()}
                        >
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[40px] bg-black/40 border-4 border-white/5 overflow-hidden flex items-center justify-center relative shadow-2xl">
                                {user?.profile_picture ? (
                                    <img src={getMediaUrl(user.profile_picture)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <User size={64} className="text-white/10" />
                                )}
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <Camera size={24} className="mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Alterar sua Foto</span>
                                </div>
                            </div>
                            <input type="file" ref={profilePicInputRef} className="hidden" onChange={(e) => handleFileChange('profile', e)} accept="image/*" />
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-2xl font-black text-white italic truncate uppercase">{user?.name || 'Seu Nome'}</h3>
                            <p className="text-accent font-black text-[10px] uppercase tracking-[0.3em] mt-1">Barbeiro Profissional</p>
                            <div className="mt-6 p-4 bg-white/[0.03] border border-white/5 rounded-2xl inline-flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-bold text-white/60">Conta Verificada AutoOpera</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-3 block tracking-[0.2em]">Seu Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input 
                                    type="text"
                                    value={profileData.name}
                                    onChange={e => setProfileData({...profileData, name: e.target.value})}
                                    placeholder="Como os clientes te chamam"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-accent outline-none transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-3 block tracking-[0.2em]">E-mail de Acesso</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input 
                                    type="email"
                                    value={profileData.email}
                                    onChange={e => setProfileData({...profileData, email: e.target.value})}
                                    placeholder="seu@email.com"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:border-accent outline-none transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-3 block tracking-[0.2em]">Sobre Você (Bio Profissional)</label>
                        <div className="relative">
                            <Info className="absolute left-4 top-4 text-white/20" size={18} />
                            <textarea 
                                value={profileData.description || ''}
                                onChange={e => setProfileData({...profileData, description: e.target.value})}
                                placeholder="Conte um pouco sobre sua experiência, especialidades e o que seus clientes podem esperar do seu trabalho."
                                rows={5}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-medium focus:border-accent outline-none transition-all placeholder:text-white/10 resize-none"
                            />
                        </div>
                    </div>
                </div>
            </section>
          )}
          
          {activeTab === 'schedule' && (
            <>
              {/* Jornada Semanal */}
              <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] overflow-hidden">
                <div className="p-5 sm:p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                      <Clock size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">Jornada Semanal</h3>
                      <p className="text-[10px] sm:text-sm text-white/40">Horários de funcionamento por dia</p>
                    </div>
                  </div>
                </div>

                <div className="p-1 sm:p-2">
                  {DAYS.map((dayName, dayIdx) => {
                    const dayIntervalsIndices = availability
                      .map((a, i) => (a.dayOfWeek === dayIdx ? i : -1))
                      .filter(i => i !== -1);
                    const isActive = dayIntervalsIndices.length > 0;

                    return (
                      <div 
                        key={dayIdx} 
                        className={`p-4 sm:p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6 transition-all rounded-2xl ${isActive ? 'hover:bg-white/[0.01]' : 'opacity-40'}`}
                      >
                        <div className="flex items-center gap-4 sm:gap-6 lg:mt-3">
                          <label className="relative inline-flex items-center cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={isActive} 
                              onChange={() => toggleDay(dayIdx)} 
                              className="sr-only peer" 
                            />
                            <div className="w-12 h-7 sm:w-14 sm:h-8 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-5 sm:after:h-6 after:w-5 sm:after:w-6 after:transition-all peer-checked:bg-[#34C759]"></div>
                          </label>
                          <div className="w-20 sm:w-24">
                            <span className={`text-base sm:text-lg font-bold ${isActive ? 'text-white' : 'text-white/30'}`}>
                              {dayName}
                            </span>
                          </div>
                        </div>

                        {isActive ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col gap-3"
                          >
                            {dayIntervalsIndices.map((globalIdx) => (
                              <div key={globalIdx} className="flex items-center gap-3">
                                <div className="flex items-center gap-4 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 flex-1 sm:flex-initial">
                                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Período</span>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="time" 
                                      value={availability[globalIdx].startTime} 
                                      onChange={(e) => updateIntervalTime(globalIdx, 'startTime', e.target.value)} 
                                      className="bg-transparent text-sm text-white font-bold outline-none [color-scheme:dark]" 
                                    />
                                    <span className="text-white/20">-</span>
                                    <input 
                                      type="time" 
                                      value={availability[globalIdx].endTime} 
                                      onChange={(e) => updateIntervalTime(globalIdx, 'endTime', e.target.value)} 
                                      className="bg-transparent text-sm text-white font-bold outline-none [color-scheme:dark]" 
                                    />
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeInterval(globalIdx)}
                                  className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                            
                            <button 
                              onClick={() => addInterval(dayIdx)}
                              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent/80 transition-colors w-fit px-2 py-1"
                            >
                              <Plus size={14} />
                              Adicionar Turno
                            </button>
                          </motion.div>
                        ) : (
                          <div className="lg:mt-3">
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Dia de descanso</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Calendário para configurar disponibilidades por data */}
              <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] overflow-hidden p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Calendário de Disponibilidades</h3>
                    <p className="text-sm text-white/40">Clique em um dia para adicionar turnos pontuais (não altera a jornada semanal).</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()-1, 1))} className="bg-white/5 text-white/60 px-3 py-2 rounded-xl">‹ Mês</button>
                    <div className="text-sm font-bold">{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()+1, 1))} className="bg-white/5 text-white/60 px-3 py-2 rounded-xl">Mês ›</button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs text-white/40 mb-3">
                  {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                    <div key={d} className="py-2">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarMatrix(currentMonth).map((cell, idx) => (
                    <div key={idx} className={`p-3 h-20 rounded-xl ${cell.isCurrentMonth ? 'bg-white/2 hover:bg-white/3 cursor-pointer' : 'opacity-20'}`} onClick={() => cell.isCurrentMonth && openDay(cell.date)}>
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{cell.day}</span>
                          {availMap[cell.date] && availMap[cell.date].length > 0 && (
                            <span className="text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">{availMap[cell.date].length}</span>
                          )}
                        </div>
                        <div className="mt-2 text-[12px] text-white/30 flex-1 flex flex-col justify-end">
                          {availMap[cell.date] && availMap[cell.date].slice(0,2).map((a, i) => (
                            <div key={i} className="text-[12px] truncate">{a.startTime} - {a.endTime}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Day Modal */}
                <AnimatePresence>
                  {showDayModal && (
                    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#1c1c1e] w-full max-w-lg rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold">{selectedDate}</h4>
                            <p className="text-sm text-white/40">Defina os turnos para este dia</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setShowDayModal(false); }} className="text-white/40">Cancelar</button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {dailyShifts.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <input type="time" value={s.startTime} onChange={e => setDailyShifts(ds => { const n = [...ds]; n[idx].startTime = e.target.value; return n })} className="bg-black/30 border border-white/5 rounded-2xl px-3 py-2 text-white" />
                              <span className="text-gray-400">até</span>
                              <input type="time" value={s.endTime} onChange={e => setDailyShifts(ds => { const n = [...ds]; n[idx].endTime = e.target.value; return n })} className="bg-black/30 border border-white/5 rounded-2xl px-3 py-2 text-white" />
                              <label className="ml-2 flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={s.isActive} onChange={e => setDailyShifts(ds => { const n = [...ds]; n[idx].isActive = e.target.checked; return n })} />
                                <span className="text-gray-300">Ativo</span>
                              </label>
                              <button onClick={() => setDailyShifts(ds => ds.filter((_, i) => i !== idx))} className="ml-auto text-red-400 px-3 py-2 rounded-xl border border-red-500/20">Remover</button>
                            </div>
                          ))}

                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => setDailyShifts(ds => [...ds, { startTime: '09:00', endTime: '12:00', isActive: true }])} className="bg-white/5 text-white px-4 py-2 rounded-2xl">Adicionar Turno</button>
                            <button onClick={async () => {
                              try {
                                const payload = dailyShifts.map(s => ({ date: selectedDate, startTime: s.startTime, endTime: s.endTime, isActive: s.isActive }));
                                await dailyAvailabilityApi.sync(payload);
                                toast.success('Salvo');
                                await loadMonthAvailabilities(currentMonth);
                                setShowDayModal(false);
                              } catch (err) {
                                console.error(err);
                                toast.error('Erro ao salvar');
                              }
                            }} className="bg-[#007AFF] text-white px-4 py-2 rounded-2xl font-bold">Salvar</button>
                            <button onClick={async () => { try { await dailyAvailabilityApi.clearDate(selectedDate); await loadMonthAvailabilities(currentMonth); setDailyShifts([]); toast.success('Removido'); setShowDayModal(false); } catch (err) { console.error(err); toast.error('Erro ao remover'); } }} className="text-red-400 px-3 py-2">Remover Tudo</button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </section>

              {/* Exceções */}
              <section className="bg-[#1c1c1e] border border-white/5 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30]">
                    <Calendar size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Bloqueios & Horários Especiais</h3>
                    <p className="text-[10px] sm:text-sm text-white/40">Feriados, cursos ou atendimentos VIP</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Form de Nova Exceção */}
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/5 h-fit">
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-5 sm:mb-6 flex items-center gap-2">
                      <Plus size={14} className="text-accent sm:w-4 sm:h-4" />
                      Configurar Novo Período
                    </h4>
                    
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Tipo de Registro</label>
                        <select 
                          value={newException.type}
                          onChange={(e) => setNewException({...newException, type: e.target.value as any})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent appearance-none"
                        >
                          <option value="blocked" className="bg-[#1c1c1e]">Bloqueio total (Folga/Feriado)</option>
                          <option value="extended" className="bg-[#1c1c1e]">Jornada Específica (Encaixes)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Data</label>
                          <input 
                            type="date" 
                            value={newException.date}
                            onChange={(e) => setNewException({...newException, date: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent [color-scheme:dark]"
                          />
                        </div>
                        {newException.type === 'extended' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Início</label>
                              <input 
                                type="time" 
                                value={newException.startTime}
                                onChange={(e) => setNewException({...newException, startTime: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-accent [color-scheme:dark]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Fim</label>
                              <input 
                                type="time" 
                                value={newException.endTime}
                                onChange={(e) => setNewException({...newException, endTime: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-accent [color-scheme:dark]"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] sm:text-[11px] font-bold text-white/30 uppercase mb-2 block">Motivo</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Feriado Local"
                          value={newException.reason}
                          onChange={(e) => setNewException({...newException, reason: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent placeholder:text-white/10"
                        />
                      </div>

                      <button 
                        onClick={handleAddException}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm hover:bg-accent hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
                      >
                        Ativar Exceção
                      </button>
                    </div>
                  </div>

                  {/* Listagem de Exceções */}
                  <div className="space-y-4">
                    <h4 className="text-xs sm:text-sm font-bold text-white/40 flex items-center justify-between">
                        Próximas Datas <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px] text-white/30">{exceptions.length}</span>
                      </h4>
                      
                      <AnimatePresence mode="popLayout">
                        {exceptions.length === 0 ? (
                          <motion.div 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-12 text-center"
                          >
                            <p className="text-white/20 text-sm font-medium">Nenhum bloqueio agendado.</p>
                          </motion.div>
                        ) : (
                          <div className="space-y-3">
                            {exceptions.map((ex) => (
                              <motion.div 
                                layout
                                key={ex.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white/5 border border-white/5 rounded-2xl p-5 flex justify-between items-center group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-2 h-2 rounded-full ${ex.type === 'blocked' ? 'bg-[#FF3B30]' : 'bg-accent'}`}></div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-bold text-sm">
                                        {new Date(ex.date + "T00:00:00").toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                      </span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ex.type === 'blocked' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 'bg-accent/10 text-accent'}`}>
                                        {ex.type === 'blocked' ? 'Bloqueio' : 'Especial'}
                                      </span>
                                    </div>
                                    <p className="text-white/40 text-[11px] font-medium mt-0.5">{ex.reason}</p>
                                    {ex.type === 'extended' && (
                                      <p className="text-accent text-[10px] mt-1 font-bold flex items-center gap-1">
                                        <Clock size={10} /> {ex.startTime} — {ex.endTime}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteException(ex.id)}
                                  className="bg-white/0 hover:bg-[#FF3B30]/10 p-2 rounded-lg text-white/10 group-hover:text-[#FF3B30] transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </AnimatePresence>
                      
                      <div className="flex items-start gap-2 bg-[#FF9500]/5 border border-[#FF9500]/10 rounded-2xl p-4">
                        <AlertCircle size={16} className="text-[#FF9500] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#FF9500]/80 font-medium leading-relaxed">
                          Ateção: Estes horários sobrescrevem automaticamente a jornada fixa para as datas selecionadas.
                        </p>
                      </div>
                    </div>
                </div>
              </section>
            </>
          )}

        </div>

        {/* Lado Direito - Resumo e Status */}
        <div className="xl:col-span-4 space-y-6 sm:space-y-8">
          
          {/* Dica Visual */}
          <div className="bg-gradient-to-br from-accent/20 to-transparent border border-accent/10 rounded-[32px] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Camera size={80} />
            </div>
            <h4 className="text-sm font-bold text-accent uppercase tracking-widest mb-4 italic">Dica Pro</h4>
            <p className="text-xs text-white/70 leading-relaxed font-medium">
                Fotos de alta qualidade no seu <span className="text-white font-bold">Banner</span> e no seu <span className="text-white font-bold">Perfil</span> aumentam a confiança dos clientes em até 40% na hora do agendamento.
            </p>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

const ToggleOption: React.FC<{ label: string, checked: boolean }> = ({ label, checked }) => (
  <div className="flex items-center justify-between group">
    <span className="text-white/60 text-sm font-medium group-hover:text-white transition-colors">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} readOnly className="sr-only peer" />
      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
    </label>
  </div>
);

export default SettingsView;

