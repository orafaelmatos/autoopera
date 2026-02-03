import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPrompt: React.FC<{ forceShow?: boolean, onOpenChange?: (open: boolean) => void }> = ({ forceShow, onOpenChange }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (forceShow !== undefined) {
      setShowPrompt(forceShow);
    }
  }, [forceShow]);

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(showPrompt);
    }
  }, [showPrompt, onOpenChange]);

  useEffect(() => {
    // Detect if already installed/standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!isStandaloneMode);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Auto-show prompt after 10 seconds if not installed and never dismissed
      if (!isStandaloneMode) {
        const hasDismissed = localStorage.getItem('install_prompt_dismissed');
        if (!hasDismissed) {
          setTimeout(() => setShowPrompt(true), 10000);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for custom event to open prompt
    const openHandler = () => setShowPrompt(true);
    window.addEventListener('openInstallPrompt', openHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('openInstallPrompt', openHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setShowPrompt(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('install_prompt_dismissed', 'true');
  };

  // If already standalone or NOT a mobile device, don't show anything
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isStandalone || !isMobile) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
        >
          <motion.div 
            className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
          >
            {/* Background Decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <button 
              onClick={dismissPrompt}
              className="absolute top-6 right-6 p-2 text-text/20 hover:text-text transition-colors bg-background rounded-full"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mb-6 border border-primary/10 group">
                <Download className="text-primary group-hover:bounce" size={32} />
              </div>
              
              <h4 className="text-2xl font-black text-text italic uppercase tracking-tighter leading-tight mb-2">
                App BarberFlow
              </h4>
              <p className="text-xs text-text/40 font-bold uppercase tracking-widest italic leading-relaxed mb-8 max-w-[200px]">
                Instale para ter acesso rápido e notificações exclusivas.
              </p>

              {isIOS ? (
                <div className="w-full space-y-4">
                  <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 text-left">
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Instalação no iPhone
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-text/60">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-border shadow-sm shrink-0">
                          <Share size={18} className="text-primary" />
                        </div>
                        <span className="text-[11px] uppercase font-black tracking-tight leading-tight">1. Toque no ícone de compartilhar</span>
                      </div>
                      <div className="flex items-center gap-4 text-text/60">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-border shadow-sm shrink-0">
                          <PlusSquare size={18} className="text-primary" />
                        </div>
                        <span className="text-[11px] uppercase font-black tracking-tight leading-tight">2. Escolha "Tela de Início"</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={dismissPrompt}
                    className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest text-xs italic rounded-2xl shadow-xl shadow-primary/20"
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-3">
                  <button 
                    onClick={handleInstallClick}
                    className="w-full bg-cta text-white font-black py-5 rounded-2xl shadow-xl shadow-cta/20 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] italic hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Download size={20} />
                    Instalar Agora
                  </button>
                  <button 
                    onClick={dismissPrompt}
                    className="w-full py-4 text-text/30 hover:text-text/60 font-black transition-colors text-[10px] uppercase tracking-widest italic"
                  >
                    Mais tarde
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
