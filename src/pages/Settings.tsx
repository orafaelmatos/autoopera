
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Settings, Link2, ExternalLink, 
  Plus, Trash2, Clock, Save, Calendar, 
  AlertCircle, Building2, Camera, MapPin, Phone, User,
  Mail, Info, Sparkles, AlertTriangle, ChevronLeft, ChevronRight, ShieldAlert
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
    <div className="space-y-12 animate-fadeIn max-w-[1200px] mx-auto pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-primary font-title mb-2">
            Configurações <span className="text-cta">Elite</span>
          </h2>
          <div className="flex items-center gap-3">
             <div className="h-[2px] w-12 bg-cta/30 rounded-full" />
             <p className="text-primary/60 font-black italic text-xs sm:text-sm uppercase tracking-widest font-title">Gestão de Identidade & Fluxo</p>
          </div>
        </div>
        <button 
          onClick={handleSaveAvailability}
          className="bg-primary text-white px-8 sm:px-10 py-5 sm:py-6 rounded-[24px] text-xs sm:text-sm font-black italic uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-[0_20px_40px_-10px_rgba(15,76,92,0.3)] active:scale-95 font-title group"
        >
          <Save size={20} strokeWidth={3} className="group-hover:scale-110 transition-transform duration-500" />
          <span>Salvar Alterações</span>
        </button>
      </header>

      {/* Navegação Elite */}
      <div className="px-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-primary/5 p-2 rounded-[32px] border border-primary/5">
          {[
            { id: 'shop', label: 'BARBEARIA', icon: Building2 },
            { id: 'profile', label: 'MEU PERFIL', icon: User },
            { id: 'schedule', label: 'AGENDA & JORNADA', icon: Clock }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-[24px] text-[10px] sm:text-xs font-black italic uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-white text-primary shadow-[0_12px_24px_-8px_rgba(15,76,92,0.15)] scale-105 z-10' 
                  : 'text-primary/40 hover:text-primary hover:bg-white/50'
              }`}
            >
              <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-12 px-4">
        
        {/* Lado Esquerdo - Configurações Principais */}
        <div className="xl:col-span-8 space-y-8 sm:space-y-12">
          
          {activeTab === 'shop' && (
            /* Perfil da Barbearia */
            <section className="bg-white border border-primary/5 rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)]">
                {/* Header Estilizado com Banner e Logo */}
                <div className="relative h-64 sm:h-80 bg-background overflow-hidden border-b border-primary/5">
                    {/* Fundo Decorativo do Banner */}
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0F4C5C 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-white" />
                    
                    {/* Botão para Alterar Banner */}
                    <div className="absolute top-8 right-8">
                        <button className="bg-white/90 backdrop-blur-md border border-primary/10 px-6 py-3 rounded-[20px] text-[10px] font-black italic uppercase tracking-widest text-primary hover:text-cta transition-all flex items-center gap-3 shadow-xl">
                            <Camera size={16} strokeWidth={2.5} />
                            Alterar Banner Elite
                        </button>
                    </div>

                    {/* Logo Preview Centralizado e Elevado */}
                    <div className="absolute -bottom-12 left-10 flex items-end gap-8 h-fit">
                        <div 
                            className="w-40 h-40 sm:w-56 sm:h-56 rounded-[40px] bg-white border-[12px] border-white overflow-hidden shadow-[0_24px_48px_-12px_rgba(15,76,92,0.25)] group/logo cursor-pointer relative transition-transform duration-500 hover:scale-105"
                            onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}
                        >
                            {barbershop?.logo ? (
                                <img src={getMediaUrl(barbershop.logo)} className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover/logo:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-background">
                                    <Building2 size={64} className="text-primary/10" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-all duration-300">
                                <Camera size={32} className="text-white mb-2" strokeWidth={3} />
                                <span className="text-[10px] font-black italic uppercase tracking-widest text-white text-center px-6">Trocar Logo</span>
                            </div>
                        </div>
                        <div className="mb-20 hidden sm:block">
                            <h3 className="text-3xl font-black italic uppercase text-primary font-title tracking-tighter leading-none mb-2">{shopData.name || 'Sua Barbearia'}</h3>
                            <button 
                                onClick={() => logoInputRef.current?.click()}
                                className="text-cta text-[10px] font-black italic uppercase tracking-[0.2em] hover:text-primary transition-colors flex items-center gap-2"
                            >
                                <Plus size={14} strokeWidth={3} /> Atualizar Identidade
                            </button>
                        </div>
                    </div>
                    <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileChange('logo', e)} accept="image/*" />
                </div>

                <div className="pt-24 p-8 sm:p-16 space-y-12">
                    {/* Informativo de Identidade Visual */}
                    <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-8 flex items-start gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-cta shrink-0 shadow-lg">
                            <Sparkles size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black italic uppercase text-primary mb-1 tracking-tight">Identidade de Elite</h4>
                            <p className="text-xs text-primary/40 leading-relaxed font-black italic uppercase tracking-widest">Sua marca é o primeiro contato do cliente. Mantenha-a impecável no fluxo.</p>
                        </div>
                    </div>

                    {/* Link da Agenda */}
                    <div className="bg-background border border-primary/5 rounded-[40px] p-8 sm:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform">
                            <Link2 size={120} className="text-primary" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-6">
                            <div>
                              <label className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.3em] mb-4 block">Link Público da Agenda</label>
                              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                                  <div className="flex-1 bg-white border-2 border-primary/5 px-8 py-5 rounded-[24px] text-primary font-black italic text-sm sm:text-base truncate shadow-inner">
                                      {`${window.location.host}/b/${shopData.slug}/booking`}
                                  </div>
                                  <button 
                                      onClick={() => {
                                          navigator.clipboard.writeText(`${window.location.origin}/b/${shopData.slug}/booking`);
                                          toast.success("Link Elite Copiado!");
                                      }}
                                      className="bg-cta text-white font-black italic px-10 py-5 rounded-[24px] hover:bg-[#D35400] transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(230,126,34,0.3)] active:scale-95 text-xs uppercase tracking-[0.2em]"
                                  >
                                      <ExternalLink size={20} strokeWidth={2.5} />
                                      <span>Copiar Flow Link</span>
                                  </button>
                              </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <label className="text-[10px] sm:text-xs font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em]">Nome da Barbearia</label>
                            <div className="relative group">
                                <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-cta transition-colors" size={20} strokeWidth={2.5} />
                                <input 
                                    type="text"
                                    value={shopData.name}
                                    onChange={e => setShopData({...shopData, name: e.target.value})}
                                    placeholder="Ex: Barber Flow Elite"
                                    className="w-full bg-background border-2 border-transparent rounded-[28px] pl-16 pr-6 py-5 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] sm:text-xs font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em]">Telefone / WhatsApp Elite</label>
                            <div className="relative group">
                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-cta transition-colors" size={20} strokeWidth={2.5} />
                                <input 
                                    type="text"
                                    value={shopData.phone || ''}
                                    onChange={e => setShopData({...shopData, phone: e.target.value})}
                                    placeholder="(00) 00000-0000"
                                    className="w-full bg-background border-2 border-transparent rounded-[28px] pl-16 pr-6 py-5 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] sm:text-xs font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em]">Manifesto / Descrição do Estabelecimento</label>
                        <textarea 
                            value={shopData.description || ''}
                            onChange={e => setShopData({...shopData, description: e.target.value})}
                            placeholder="Descreva a experiência premium que sua barbearia entrega aos clientes."
                            rows={4}
                            className="w-full bg-background border-2 border-transparent rounded-[32px] px-8 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 resize-none min-h-[120px]"
                        />
                    </div>
                </div>
            </section>
          )}

          {activeTab === 'profile' && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-primary/5 rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)]"
            >
                <div className="p-8 sm:p-16 border-b border-primary/5 bg-gradient-to-br from-primary/[0.02] to-transparent">
                    <div className="flex flex-col sm:flex-row items-center gap-12">
                        {/* Foto de Perfil */}
                        <div 
                            className="relative group cursor-pointer" 
                            onClick={() => profilePicInputRef.current?.click()}
                        >
                            <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-[40px] bg-white border-[12px] border-white overflow-hidden flex items-center justify-center relative shadow-[0_24px_48px_-12px_rgba(15,76,92,0.25)] transition-transform duration-500 hover:scale-105">
                                {user?.profile_picture ? (
                                    <img src={getMediaUrl(user.profile_picture)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <User size={80} className="text-primary/10" />
                                )}
                                <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <Camera size={28} className="text-white mb-2" strokeWidth={3} />
                                    <span className="text-[10px] font-black italic uppercase tracking-widest text-white text-center px-6">Identidade</span>
                                </div>
                            </div>
                            <input type="file" ref={profilePicInputRef} className="hidden" onChange={(e) => handleFileChange('profile', e)} accept="image/*" />
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-3xl sm:text-5xl font-black italic uppercase text-primary font-title tracking-tighter leading-none mb-3">{user?.name || 'Mestre Barbeiro'}</h3>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-6">
                              <span className="px-5 py-2 bg-primary text-white rounded-full text-[10px] font-black italic uppercase tracking-widest shadow-lg shadow-primary/20 font-title">
                                Barbeiro Elite
                              </span>
                              <div className="px-5 py-2 bg-background border border-primary/5 rounded-full inline-flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                  <span className="text-[10px] font-black italic text-primary uppercase tracking-[0.2em] font-title">Online no Fluxo</span>
                              </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 sm:p-16 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em] font-title">Seu Nome de Elite</label>
                            <div className="relative group">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-cta transition-colors" size={20} strokeWidth={2.5} />
                                <input 
                                    type="text"
                                    value={profileData.name}
                                    onChange={e => setProfileData({...profileData, name: e.target.value})}
                                    className="w-full bg-background border-2 border-transparent rounded-[28px] pl-16 pr-6 py-5 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 font-title"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em] font-title">E-mail de Acesso</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-cta transition-colors" size={20} strokeWidth={2.5} />
                                <input 
                                    type="email"
                                    value={profileData.email}
                                    onChange={e => setProfileData({...profileData, email: e.target.value})}
                                    className="w-full bg-background border-2 border-transparent rounded-[28px] pl-16 pr-6 py-5 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 font-title"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-6 block tracking-[0.2em] font-title">Biografia & Especialidades (Manifesto)</label>
                        <div className="relative group">
                            <Info className="absolute left-6 top-6 text-primary/20 group-focus-within:text-cta transition-colors" size={20} strokeWidth={2.5} />
                            <textarea 
                                value={profileData.description || ''}
                                onChange={e => setProfileData({...profileData, description: e.target.value})}
                                rows={5}
                                className="w-full bg-background border-2 border-transparent rounded-[32px] pl-16 pr-8 py-6 text-primary font-black italic uppercase text-sm focus:border-cta/20 focus:bg-white outline-none transition-all placeholder:text-primary/10 resize-none min-h-[140px] font-title"
                            />
                        </div>
                    </div>
                </div>
            </motion.section>
          )}
          
          {activeTab === 'schedule' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-12"
            >
              {/* Jornada Semanal Elite */}
              <section className="bg-white border border-primary/5 rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)]">
                <div className="p-8 sm:p-12 border-b border-primary/5 bg-gradient-to-br from-primary/[0.02] to-transparent flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Clock size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-primary font-title tracking-tight leading-none mb-1">Jornada Semanal</h3>
                        <p className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.2em]">Seus turnos recorrentes</p>
                    </div>
                </div>
                
                <div className="divide-y divide-primary/5">
                  {DAYS.map((dayName, dayIdx) => {
                    const dayIntervalsIndices = availability
                      .map((a, i) => (a.dayOfWeek === dayIdx ? i : -1))
                      .filter(i => i !== -1);
                    const isActive = dayIntervalsIndices.length > 0;

                    return (
                      <div key={dayIdx} className="p-8 sm:px-12 flex flex-col md:flex-row md:items-center gap-8 group hover:bg-primary/[0.01] transition-colors">
                        <div className="w-full md:w-44 flex items-center justify-between md:block shrink-0">
                          <span className="text-sm font-black italic uppercase text-primary tracking-widest block font-title">{dayName}</span>
                          <div className="mt-2">
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isActive} 
                                    onChange={() => toggleDay(dayIdx)}
                                    className="sr-only peer" 
                                />
                                <div className="w-12 h-6 bg-primary/10 rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                                <span className="ml-3 text-[10px] font-black italic text-primary/40 uppercase tracking-widest peer-checked:text-primary transition-colors">
                                    {isActive ? 'Ativo' : 'Folga'}
                                </span>
                             </label>
                          </div>
                        </div>

                        {isActive ? (
                          <motion.div 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-wrap gap-4"
                          >
                            {dayIntervalsIndices.map((globalIdx) => (
                              <div key={globalIdx} className="flex items-center gap-3 bg-background border border-primary/5 rounded-2xl px-5 py-3 shadow-[0_4px_12px_rgba(15,76,92,0.03)] group/shift">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="time" 
                                    value={availability[globalIdx].startTime} 
                                    onChange={(e) => updateIntervalTime(globalIdx, 'startTime', e.target.value)}
                                    className="bg-transparent text-sm font-black italic text-primary outline-none font-title" 
                                  />
                                  <span className="text-primary/20 text-[10px] uppercase font-black italic">às</span>
                                  <input 
                                    type="time" 
                                    value={availability[globalIdx].endTime} 
                                    onChange={(e) => updateIntervalTime(globalIdx, 'endTime', e.target.value)}
                                    className="bg-transparent text-sm font-black italic text-primary outline-none font-title" 
                                  />
                                </div>
                                <button 
                                  onClick={() => removeInterval(globalIdx)}
                                  className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover/shift:opacity-100"
                                >
                                  <Trash2 size={16} strokeWidth={2.5} />
                                </button>
                              </div>
                            ))}
                            
                            <button 
                              onClick={() => addInterval(dayIdx)}
                              className="h-12 px-6 rounded-2xl border-2 border-dashed border-primary/10 text-[10px] font-black italic uppercase tracking-widest text-primary/40 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all flex items-center gap-2"
                            >
                              <Plus size={14} strokeWidth={3} />
                              Novo Turno
                            </button>
                          </motion.div>
                        ) : (
                          <div className="flex-1 flex items-center border-2 border-dashed border-primary/5 rounded-[32px] p-8">
                            <span className="text-[10px] font-black italic text-primary/10 uppercase tracking-[0.4em]">Dia de descanso e recuperação</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Datas Especiais Elite */}
              <section className="bg-white border border-primary/5 rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)] p-8 sm:p-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-cta/10 flex items-center justify-center text-cta">
                        <Calendar size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-primary font-title tracking-tight leading-none mb-1">Datas Especiais</h3>
                        <p className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.2em]">Sobrescreve a jornada para turnos pontuais</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-background p-2 rounded-3xl border border-primary/5">
                    <button 
                        onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()-1, 1))} 
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-primary/40 hover:text-cta transition-colors shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-[11px] font-black italic uppercase tracking-[0.2em] text-primary min-w-[160px] text-center font-title">
                        {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </div>
                    <button 
                        onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()+1, 1))} 
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-primary/40 hover:text-cta transition-colors shadow-sm"
                    >
                        <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-6">
                  {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                    <div key={d} className="py-2 text-[10px] font-black italic text-primary/20 uppercase tracking-[0.3em] text-center">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-3 sm:gap-6">
                  {calendarMatrix(currentMonth).map((cell, idx) => (
                    <div 
                      key={idx} 
                      className={`group relative p-4 h-28 sm:h-36 rounded-[32px] transition-all flex flex-col justify-between border-2 ${
                        cell.isCurrentMonth 
                        ? 'bg-white border-primary/5 hover:border-cta/20 cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1' 
                        : 'bg-transparent border-transparent opacity-0 pointer-events-none'
                      }`} 
                      onClick={() => cell.isCurrentMonth && openDay(cell.date)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black italic text-primary font-title leading-none">{cell.day}</span>
                        {availMap[cell.date] && availMap[cell.date].length > 0 && (
                          <div className="w-2.5 h-2.5 rounded-full bg-cta shadow-[0_0_12px_rgba(230,126,34,0.5)]" />
                        )}
                      </div>
                      <div className="space-y-1">
                        {availMap[cell.date] && availMap[cell.date].slice(0,2).map((a, i) => (
                          <div key={i} className="text-[9px] font-black italic text-primary/40 uppercase tracking-tighter truncate leading-none">
                            {a.startTime}—{a.endTime}
                          </div>
                        ))}
                        {availMap[cell.date] && availMap[cell.date].length > 2 && (
                          <div className="text-[9px] text-cta font-black italic uppercase tracking-widest">+ {availMap[cell.date].length - 2}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Day Modal Elite */}
                <AnimatePresence>
                  {showDayModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDayModal(false)}
                        className="absolute inset-0 bg-primary/40 backdrop-blur-xl"
                      />
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                        animate={{ scale: 1, opacity: 1, y: 0 }} 
                        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                        className="bg-white w-full max-w-xl rounded-[48px] p-10 sm:p-16 shadow-[0_48px_96px_-12px_rgba(15,76,92,0.3)] relative z-10"
                      >
                        <button 
                            onClick={() => setShowDayModal(false)} 
                            className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center rounded-2xl bg-background text-primary/20 hover:text-primary transition-all group"
                        >
                            <Plus size={24} className="rotate-45 group-hover:scale-110 transition-transform" strokeWidth={3} />
                        </button>
                        
                        <div className="mb-12">
                          <h4 className="text-3xl sm:text-4xl font-black italic uppercase text-primary font-title leading-none mb-3">
                            {new Date(selectedDate + "T00:00:00").toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                          </h4>
                          <p className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.2em]">Configuração de Turnos Pontuais</p>
                        </div>

                        <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar-hidden pr-2 mb-12">
                          {dailyShifts.map((s, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row items-center gap-6 bg-background p-6 rounded-[32px] border border-primary/5 group relative">
                              <div className="flex items-center gap-4 flex-1">
                                <input type="time" value={s.startTime} onChange={e => setDailyShifts(ds => { const n = [...ds]; n[idx].startTime = e.target.value; return n })} className="flex-1 bg-white border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-black italic text-primary focus:border-cta/20 outline-none font-title shadow-sm" />
                                <span className="text-primary/20 font-black italic text-[10px] uppercase">às</span>
                                <input type="time" value={s.endTime} onChange={e => setDailyShifts(ds => { const n = [...ds]; n[idx].endTime = e.target.value; return n })} className="flex-1 bg-white border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-black italic text-primary focus:border-cta/20 outline-none font-title shadow-sm" />
                              </div>
                              <div className="flex items-center gap-6 w-full sm:w-auto">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={s.isActive} onChange={e => setDailyShifts(ds => { const n = [...ds]; n[idx].isActive = e.target.checked; return n })} className="sr-only peer" />
                                  <div className="w-12 h-6 bg-primary/10 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6 relative"></div>
                                </label>
                                <button onClick={() => setDailyShifts(ds => ds.filter((_, i) => i !== idx))} className="w-12 h-12 flex items-center justify-center rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 size={20} strokeWidth={2.5} /></button>
                              </div>
                            </div>
                          ))}

                          <button 
                            onClick={() => setDailyShifts(ds => [...ds, { startTime: '09:00', endTime: '12:00', isActive: true }])} 
                            className="w-full py-8 border-2 border-dashed border-primary/10 rounded-[32px] text-primary/30 flex items-center justify-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-all"
                          >
                            <Plus size={20} strokeWidth={3} />
                            <span className="text-[10px] font-black italic uppercase tracking-[0.2em]">Adicionar Novo Bloco de Tempo</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button 
                            onClick={async () => {
                              try {
                                const payload = dailyShifts.map(s => ({ date: selectedDate, startTime: s.startTime, endTime: s.endTime, isActive: s.isActive }));
                                await dailyAvailabilityApi.sync(payload);
                                toast.success('Agenda salva com sucesso!');
                                await loadMonthAvailabilities(currentMonth);
                                setShowDayModal(false);
                              } catch (err) {
                                toast.error('Erro ao salvar disponibilidade');
                              }
                            }} 
                            className="bg-primary text-white py-6 rounded-3xl text-[10px] font-black italic uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            Consolidar Horários
                          </button>
                          <button 
                            onClick={async () => { 
                              try { 
                                await dailyAvailabilityApi.clearDate(selectedDate); 
                                await loadMonthAvailabilities(currentMonth); 
                                setDailyShifts([]); 
                                toast.success('Removido'); 
                                setShowDayModal(false); 
                              } catch (err) { 
                                toast.error('Erro ao limpar'); 
                              } 
                            }} 
                            className="bg-red-50 text-red-500 py-6 rounded-3xl text-[10px] font-black italic uppercase tracking-widest hover:bg-red-100 transition-all"
                          >
                            Limpar Data
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </section>

              {/* Bloqueios & Exceções Elite */}
              <section className="bg-white border border-primary/5 rounded-[48px] p-8 sm:p-16 shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)]">
                <div className="flex items-center gap-8 mb-16">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                    <AlertTriangle size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-4xl font-black italic uppercase text-primary font-title tracking-tight text-red-600 leading-none mb-2">Bloqueios Críticos</h3>
                    <p className="text-[10px] font-black italic text-primary/30 uppercase tracking-[0.2em]">Feriados e ausências que travam a agenda</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  {/* Nova Exceção */}
                  <div className="bg-background border border-primary/5 rounded-[40px] p-10 relative overflow-hidden">
                    <h4 className="text-[10px] font-black italic text-primary uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                      <Plus size={16} className="text-cta" strokeWidth={3} />
                      Registrar Novo Bloqueio
                    </h4>
                    
                    <div className="space-y-8">
                      <div>
                        <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-4 block tracking-[0.2em]">Impacto na Agenda</label>
                        <select 
                          value={newException.type}
                          onChange={(e) => setNewException({...newException, type: e.target.value as any})}
                          className="w-full bg-white border-2 border-transparent rounded-[24px] px-6 py-5 text-sm font-black italic text-primary focus:border-cta/20 outline-none appearance-none shadow-sm font-title"
                        >
                          <option value="blocked">Bloqueio Total (Folga/Feriado)</option>
                          <option value="extended">Horário Especial (Exceção)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-4 block tracking-widest">Data</label>
                          <input 
                            type="date" 
                            value={newException.date}
                            onChange={(e) => setNewException({...newException, date: e.target.value})}
                            className="w-full bg-white border-2 border-transparent rounded-[24px] px-6 py-5 text-sm font-black italic text-primary focus:border-cta/20 outline-none shadow-sm font-title"
                          />
                        </div>
                        {newException.type === 'extended' && (
                          <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-4 block">Início</label>
                                <input type="time" value={newException.startTime} onChange={(e) => setNewException({...newException, startTime: e.target.value})} className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-5 text-sm font-black italic text-primary focus:border-cta/20 outline-none shadow-sm font-title" />
                             </div>
                             <div>
                                <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-4 block">Fim</label>
                                <input type="time" value={newException.endTime} onChange={(e) => setNewException({...newException, endTime: e.target.value})} className="w-full bg-white border-2 border-transparent rounded-2xl px-4 py-5 text-sm font-black italic text-primary focus:border-cta/20 outline-none shadow-sm font-title" />
                             </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-black italic text-primary/30 uppercase mb-4 ml-4 block tracking-widest">Motivo do Bloqueio</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Treinamento Barber Elite"
                          value={newException.reason}
                          onChange={(e) => setNewException({...newException, reason: e.target.value})}
                          className="w-full bg-white border-2 border-transparent rounded-[24px] px-8 py-5 text-sm font-black italic text-primary focus:border-cta/20 outline-none shadow-sm font-title placeholder:text-primary/5"
                        />
                      </div>

                      <button 
                        onClick={handleAddException}
                        className="w-full bg-primary text-white py-6 rounded-[28px] text-[10px] font-black italic uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/[0.95] transition-all"
                      >
                        Ativar Bloqueio No Fluxo
                      </button>
                    </div>
                  </div>

                  {/* Listagem de Exceções */}
                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black italic text-primary/20 uppercase tracking-[0.4em] flex items-center justify-between">
                        Bloqueios Ativos <span className="text-cta">{exceptions.length}</span>
                    </h4>
                      
                    <AnimatePresence mode="popLayout">
                        {exceptions.length === 0 ? (
                          <motion.div layout className="bg-primary/[0.02] border-2 border-dashed border-primary/5 rounded-[40px] p-20 text-center">
                            <Calendar size={48} className="text-primary/5 mx-auto mb-6" />
                            <p className="text-[10px] font-black italic text-primary/10 uppercase tracking-widest">Nenhum bloqueio registrado</p>
                          </motion.div>
                        ) : (
                          <div className="space-y-4">
                            {exceptions.map((ex) => (
                              <motion.div 
                                layout
                                key={ex.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white border border-primary/5 rounded-[32px] p-8 flex justify-between items-center group shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all"
                              >
                                <div className="flex items-center gap-6">
                                  <div className={`w-3 h-3 rounded-full ${ex.type === 'blocked' ? 'bg-red-500 shadow-[0_0_12_rgba(239,68,68,0.4)]' : 'bg-primary shadow-[0_0_12_rgba(15,76,92,0.4)]'}`}></div>
                                  <div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-lg font-black italic text-primary uppercase font-title leading-none">
                                        {new Date(ex.date + "T00:00:00").toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                      </span>
                                      <span className={`text-[8px] font-black italic px-3 py-1 rounded-full uppercase tracking-tighter ${ex.type === 'blocked' ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-primary'}`}>
                                        {ex.type === 'blocked' ? 'Total' : 'Parcial'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] font-black italic text-primary/30 uppercase tracking-widest mt-2">{ex.reason}</p>
                                    {ex.type === 'extended' && (
                                      <p className="text-primary text-[10px] mt-3 font-black italic flex items-center gap-2">
                                        <Clock size={12} strokeWidth={3} /> {ex.startTime} {'\u003e'} {ex.endTime}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteException(ex.id)}
                                  className="w-12 h-12 flex items-center justify-center rounded-2xl text-primary/10 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </AnimatePresence>
                      
                      <div className="bg-cta/5 border border-cta/10 rounded-[32px] p-8 mt-12">
                        <div className="flex items-center gap-3 mb-3 text-cta">
                            <ShieldAlert size={20} strokeWidth={2.5} />
                            <span className="text-[10px] font-black italic uppercase tracking-widest">Protocolo de Segurança</span>
                        </div>
                        <p className="text-xs text-cta/70 font-medium leading-relaxed italic">
                          Bloqueios de agenda são prioritários. Se houver agendamentos prévios nessas datas, você deverá notificá-los manualmente ou o sistema enviará um alerta de cancelamento automático conforme suas configurações.
                        </p>
                      </div>
                    </div>
                  </div>
              </section>
            </motion.div>
          )}

        </div>

        {/* Lado Direito Elite - Resumo e Performance */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Dica Profissional Elite */}
          <div className="bg-primary border border-primary/5 rounded-[48px] p-10 sm:p-12 relative overflow-hidden group shadow-[0_32px_64px_-16px_rgba(15,76,92,0.25)]">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform text-white">
                <Sparkles size={140} strokeWidth={1} />
            </div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-cta">
                    <Sparkles size={20} strokeWidth={2.5} />
                 </div>
                 <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic font-title">Master Intelligence</h4>
            </div>
            <p className="text-base text-white/80 leading-relaxed font-black italic uppercase tracking-tight relative z-10 font-title">
                "Fotos de alta definição no seu <span className="text-cta">Banner</span> e no seu <span className="text-cta">Perfil</span> aumentam a conversão de novos clientes em até 40%."
            </p>
            <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                <span className="text-[9px] font-black italic text-white/30 uppercase tracking-[0.3em]">Protocolo Elite #042</span>
            </div>
          </div>

          {/* Status da Assinatura Elite */}
          <div className="bg-white border border-primary/5 rounded-[48px] p-10 sm:p-12 shadow-[0_32px_64px_-16px_rgba(15,76,92,0.08)]">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldAlert size={24} strokeWidth={2.5} />
                </div>
                <h4 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.3em] italic font-title">Plano de Assinatura</h4>
             </div>

             <div className="space-y-8">
                <div className="flex items-center justify-between group">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic group-hover:text-primary transition-colors">Nível Atual</span>
                    <span className="text-sm font-black italic text-primary uppercase font-title bg-primary/5 px-4 py-2 rounded-full border border-primary/10 shadow-sm">Barber Pro Elite</span>
                </div>
                <div className="flex items-center justify-between group pt-4 border-t border-primary/5">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic">Performance Mensal</span>
                    <span className="text-lg font-black italic text-primary font-title">R$ 14.850<span className="text-[10px] text-primary/30">,00</span></span>
                </div>
                <div className="flex items-center justify-between group">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic">Fidelização</span>
                    <span className="text-sm font-black italic text-green-500 font-title">+24%</span>
                </div>
             </div>
             
             <button className="w-full mt-12 py-6 bg-background border border-primary/5 text-[10px] font-black italic text-primary/40 uppercase tracking-[0.2em] hover:text-cta hover:border-cta/20 hover:bg-cta/[0.02] transition-all rounded-[28px] shadow-sm">
                Upgrade de Licença
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const ToggleOption: React.FC<{ label: string, checked: boolean }> = ({ label, checked }) => (
  <div className="flex items-center justify-between group py-2">
    <span className="text-[10px] font-black italic text-primary/40 uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} readOnly className="sr-only peer" />
      <div className="w-12 h-6 bg-primary/10 rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
    </label>
  </div>
);

export default SettingsView;

