import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  Save, AlertCircle, X, Check, Edit2, Loader2, Info, ArrowRight, Trash2
} from 'lucide-react';
import { format, addDays, getDay, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isBefore, startOfDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { availabilityApi, dailyAvailabilityApi } from '../api';
import { Availability, DailyAvailability } from '../types';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

const Schedule: React.FC = () => {
    const { user } = useAuth();
    const [view, setView] = useState<'daily' | 'weekly'>('daily');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // Editor Diário
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [hasDailyOverride, setHasDailyOverride] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadDailyStatus();
    }, [selectedDate, availability]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await availabilityApi.getAll();
            setAvailability(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadDailyStatus = async () => {
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const data = await dailyAvailabilityApi.getForDate(dateStr);
            if (data && data.length > 0) {
                setStartTime(data[0].startTime);
                setEndTime(data[0].endTime);
                setHasDailyOverride(true);
            } else {
                const dayIdx = getDay(selectedDate);
                const weekStandard = availability.find(a => a.dayOfWeek === dayIdx);
                setStartTime(weekStandard?.startTime || '09:00');
                setEndTime(weekStandard?.endTime || '18:00');
                setHasDailyOverride(false);
            }
        } catch (error) {
            setHasDailyOverride(false);
        }
    };

    const handleSaveDaily = async () => {
        try {
            setSaving(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const payload = [{
                date: dateStr,
                startTime,
                endTime,
                isActive: true
            }];
            await dailyAvailabilityApi.sync(payload);
            setHasDailyOverride(true);
            toast.success(`Horário de ${format(selectedDate, "dd/MM")} atualizado!`);
        } catch (error) {
            toast.error("Erro ao salvar horário");
        } finally {
            setSaving(false);
        }
    };

    const handleClearDaily = async () => {
        try {
            setSaving(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await dailyAvailabilityApi.clearDate(dateStr);
            setHasDailyOverride(false);
            loadDailyStatus();
            toast.success("Dia resetado para o padrão");
        } catch (error) {
            toast.error("Erro ao limpar dia");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveWeekly = async () => {
        try {
            setSaving(true);
            const payload = availability.map(a => ({
                day_of_week: a.dayOfWeek,
                start_time: a.startTime,
                end_time: a.endTime,
                is_active: a.isActive
            }));
            await availabilityApi.sync(payload as any);
            toast.success("Jornada padrão atualizada!");
        } catch (error) {
            toast.error("Erro ao salvar jornada");
        } finally {
            setSaving(false);
        }
    };

    const renderDailyEditor = () => {
        const days = eachDayOfInterval({
          start: startOfMonth(currentMonth),
          end: endOfMonth(currentMonth)
        });
        const firstDayOfMonth = getDay(days[0]);
        const blanks = Array(firstDayOfMonth).fill(null);

        return (
            <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    {/* Calendário Compacto */}
                    <div className="lg:col-span-7 bg-white border border-primary/5 rounded-[32px] p-6 sm:p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex flex-col">
                            <h3 className="text-xl font-black italic uppercase text-primary tracking-tighter leading-none">
                                    {format(currentMonth, 'MMMM', { locale: ptBR })}
                                </h3>
                                <span className="text-[9px] font-black italic uppercase text-primary/20 tracking-widest">{format(currentMonth, 'yyyy')}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 sm:p-2.5 rounded-xl bg-background hover:bg-primary/5 text-primary active:scale-90 transition-all"><ChevronLeft size={18} /></button>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 sm:p-2.5 rounded-xl bg-background hover:bg-primary/5 text-primary active:scale-90 transition-all"><ChevronRight size={18} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                <div key={`cal-header-${i}`} className="text-center text-[9px] font-black italic text-primary/20 uppercase py-1">{d}</div>
                            ))}
                            {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                            {days.map((day) => {
                                const isSel = isSameDay(day, selectedDate);
                                const isPast = isBefore(day, startOfDay(new Date()));
                                return (
                                    <button
                                        key={day.toString()}
                                        onClick={() => !isPast && setSelectedDate(day)}
                                        className={`
                                            aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all relative
                                            ${isSel ? 'bg-cta text-white scale-105 shadow-md z-10' : 'bg-background hover:bg-primary/5 text-primary'}
                                            ${isPast ? 'opacity-10 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        <span className="text-xs sm:text-base font-black italic">{format(day, 'd')}</span>
                                        {isToday(day) && !isSel && <div className="w-1 h-1 rounded-full bg-cta absolute bottom-1.5" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Editor Lateral sem Banner */}
                    <div className="lg:col-span-5 bg-white border border-primary/5 rounded-[32px] p-6 sm:p-8 shadow-xl space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-primary/5">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black italic uppercase text-cta tracking-widest">Editando Dia</span>
                                <h4 className="text-xl font-black italic uppercase text-primary tracking-tighter leading-none">
                                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                                </h4>
                            </div>
                            {hasDailyOverride && (
                                <div className="px-3 py-1.5 bg-cta/10 rounded-lg text-[8px] font-black italic uppercase text-cta flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-cta" /> Editado
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black italic text-primary/30 uppercase tracking-widest ml-1">Início</label>
                                <input 
                                    type="time" 
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    className="w-full bg-background border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-black italic text-primary focus:border-cta/20 outline-none transition-all shadow-sm" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black italic text-primary/30 uppercase tracking-widest ml-1">Fim</label>
                                <input 
                                    type="time" 
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    className="w-full bg-background border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-black italic text-primary focus:border-cta/20 outline-none transition-all shadow-sm" 
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button 
                                onClick={handleSaveDaily}
                                disabled={saving}
                                className="w-full bg-cta text-white py-5 rounded-2xl font-black italic uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg hover:bg-cta/90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={3} />}
                                Confirmar Horário
                            </button>
                            
                            {hasDailyOverride && (
                                <button 
                                    onClick={handleClearDaily}
                                    disabled={saving}
                                    className="w-full py-3 text-red-500/40 hover:text-red-500 text-[9px] font-black italic uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={12} /> Resetar p/ Padrão
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderWeeklyView = () => (
        <div className="bg-white border border-primary/5 rounded-[32px] p-6 sm:p-10 shadow-xl animate-fadeIn space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-primary/5">
                <Info size={16} className="text-cta" />
                <p className="text-[10px] font-black italic uppercase text-primary/40 tracking-widest leading-tight">Estes são seus horários base. Eles valem para todos os dias que não tiverem uma regra especial no "Dia a Dia".</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
                    const config = availability.find(a => a.dayOfWeek === dayIndex);
                    if (!config) return null;
                    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                    return (
                        <div key={`weekly-${dayIndex}`} className={`p-5 rounded-2xl border-2 transition-all ${config.isActive ? 'bg-white border-primary/10 shadow-sm' : 'bg-background/50 border-transparent opacity-40'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setAvailability(prev => prev.map(a => a.dayOfWeek === dayIndex ? {...a, isActive: !a.isActive} : a))}
                                        className={`w-11 h-6 rounded-full relative transition-all ${config.isActive ? 'bg-cta' : 'bg-primary/10'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${config.isActive ? 'left-6' : 'left-1'}`} />
                                    </button>
                                    <h4 className="text-base font-black italic uppercase text-primary tracking-tight w-24">{dayNames[dayIndex]}</h4>
                                </div>
                                {config.isActive && (
                                    <div className="flex items-center gap-3 bg-background rounded-xl p-2 px-4 border border-primary/5 shadow-inner">
                                        <input 
                                            type="time" 
                                            value={config.startTime}
                                            onChange={e => setAvailability(prev => prev.map(a => a.dayOfWeek === dayIndex ? {...a, startTime: e.target.value} : a))}
                                            className="bg-transparent border-none p-0 text-xs font-black italic text-primary w-14 focus:ring-0"
                                        />
                                        <ArrowRight size={12} className="text-primary/20" />
                                        <input 
                                            type="time" 
                                            value={config.endTime}
                                            onChange={e => setAvailability(prev => prev.map(a => a.dayOfWeek === dayIndex ? {...a, endTime: e.target.value} : a))}
                                            className="bg-transparent border-none p-0 text-xs font-black italic text-primary w-14 focus:ring-0"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <button 
                onClick={handleSaveWeekly}
                disabled={saving}
                className="w-full bg-primary text-white py-6 rounded-2xl font-black italic uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Confirmar Jornada Base
            </button>
        </div>
    );

    return (
        <div className="space-y-10 animate-fadeIn max-w-[1400px] mx-auto pb-32 px-4 sm:px-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4">
                <div className="space-y-1">
                    <h2 className="text-3xl sm:text-6xl font-black italic uppercase tracking-tighter text-primary font-title">
                        Meus <span className="text-cta">Horários</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-[2px] bg-cta/30 rounded-full" />
                        <p className="text-primary/30 font-black italic text-[9px] sm:text-xs uppercase tracking-widest font-title">
                            Disponibilidade Profissional
                        </p>
                    </div>
                </div>
                
                <div className="bg-primary/5 p-1.5 rounded-[24px] flex gap-1.5 self-start shadow-inner border border-primary/5">
                    <button 
                        onClick={() => setView('daily')}
                        className={`px-8 sm:px-10 py-3.5 rounded-[20px] text-[10px] font-black italic uppercase tracking-widest transition-all ${view === 'daily' ? 'bg-primary text-white shadow-xl scale-105' : 'text-primary/30 hover:text-primary'}`}
                    >
                        Dia a Dia
                    </button>
                    <button 
                        onClick={() => setView('weekly')}
                        className={`px-8 sm:px-10 py-3.5 rounded-[20px] text-[10px] font-black italic uppercase tracking-widest transition-all ${view === 'weekly' ? 'bg-primary text-white shadow-xl scale-105' : 'text-primary/30 hover:text-primary'}`}
                    >
                        Padrão Semanal
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-primary/10">
                    <Loader2 size={48} className="animate-spin" strokeWidth={1} />
                    <span className="text-[10px] font-black italic uppercase tracking-widest">Sincronizando...</span>
                </div>
            ) : (
                view === 'daily' ? renderDailyEditor() : renderWeeklyView()
            )}
        </div>
    );
};

export default Schedule;
