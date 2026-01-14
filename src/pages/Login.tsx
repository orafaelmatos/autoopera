import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Lock, User, ArrowRight, Scissors, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showNameField, setShowNameField] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(true);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await login(phone, password, showNameField ? name : undefined);
            navigate('/');
        } catch (err: any) {
            if (err.error === 'USER_NOT_FOUND') {
                setShowNameField(true);
                setError(err.message);
            } else {
                setError(err.error || 'Erro ao entrar. Verifique seus dados.');
            }
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
                    <p className="text-gray-400 text-sm">Entre com seu WhatsApp para agendar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 ml-4 tracking-widest">WhatsApp</label>
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(11) 99999-9999"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 ml-4 tracking-widest">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {showNameField && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
                                <label className="text-[10px] uppercase font-bold text-[#007AFF] ml-4 tracking-widest">Seu Nome (Primeiro Acesso)</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007AFF]" size={18} />
                                    <input 
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Como devemos te chamar?"
                                        className="w-full bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#007AFF]/50 outline-none transition-all"
                                        required={showNameField}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                        <button type="button" className="text-xs text-[#007AFF] hover:underline">Esqueci a senha</button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs flex gap-3 items-center">
                            <Info size={16} />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#007AFF] hover:bg-[#0066CC] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 relative overflow-hidden group shadow-lg shadow-[#007AFF]/20"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {showNameField ? 'Concluir Cadastro' : 'Entrar na Barbearia'}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

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
