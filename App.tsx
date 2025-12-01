import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import NewsCardGenerator from './components/NewsCardGenerator';
import TextToolGenerator from './components/TextToolGenerator';
import StorageManager from './components/StorageManager';
import AdminPanel from './components/AdminPanel';
import { LayoutTemplate, Sparkles, KeyRound, Loader2, ShieldAlert, Lock, UserX, WifiOff } from 'lucide-react';
import { TextToolType } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState('news-card');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isKeyReady, setIsKeyReady] = useState(true);
  const [showAuthForGuest, setShowAuthForGuest] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { user, userProfile, loading, isApproved, isAdmin } = useAuth();

  // Network Status Monitor for App
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dark Mode - Force Dark Mode by default for this brand
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('bk_theme');
      return savedMode === 'light' ? false : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bk_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bk_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setIsKeyReady(true);
    }
  };

  const handleInvalidKey = () => {
    setIsKeyReady(false);
  };

  const updateLogo = (logoData: string) => {
    setCustomLogo(logoData);
    try {
      localStorage.setItem('bk_custom_logo', logoData);
    } catch (e) {
      console.error("Failed to save logo", e);
    }
  };

  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('bk_custom_logo');
      if (savedLogo) {
        setCustomLogo(savedLogo);
      }
    } catch (e) {
      console.error("Failed to load logo", e);
    }
  }, []);

  const renderContent = () => {
    if (activeTab === 'admin-panel') {
      return isAdmin ? <AdminPanel /> : null;
    }

    switch (activeTab) {
      case 'news-card':
      case 'quote-card':
        return (
          <NewsCardGenerator 
            customLogo={customLogo}
            cardType={activeTab === 'quote-card' ? 'quote' : 'news'}
            onApiKeyInvalid={handleInvalidKey}
          />
        );
      
      case 'translator':
      case 'proofreader':
      case 'script-writer':
      case 'social-manager':
      case 'headline-generator':
      case 'thumbnail-prompter':
      case 'interview-prep':
      case 'ticker-writer':
      case 'seo-optimizer':
        return (
          <TextToolGenerator 
            toolType={activeTab as TextToolType}
            onApiKeyInvalid={handleInvalidKey}
          />
        );
        
      default:
        return (
          <NewsCardGenerator 
            customLogo={customLogo} 
            cardType="news"
            onApiKeyInvalid={handleInvalidKey}
          />
        );
    }
  };

  if (!isKeyReady) {
    return (
      <div className="min-h-screen bg-bk-bg-light dark:bg-bk-bg-dark flex items-center justify-center p-4">
        <div className="max-w-xs w-full bg-white dark:bg-bk-surface-dark p-6 rounded-2xl shadow-xl text-center">
           <div className="mx-auto w-12 h-12 flex items-center justify-center bg-bk-green/10 rounded-full mb-3">
               <KeyRound className="w-6 h-6 text-bk-green" />
           </div>
           <h1 className="text-lg font-bold text-gray-800 dark:text-white mb-1">API Key Missing</h1>
           <button onClick={handleSelectKey} className="w-full py-2 bg-bk-green text-white rounded-lg text-sm font-bold mt-4">
               Setup API Key
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bk-bg-light dark:bg-bk-bg-dark font-bengali text-slate-800 dark:text-gray-100 pb-20 transition-colors duration-300">
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-bk-red text-white px-4 py-2 text-center text-[10px] font-bold flex items-center justify-center gap-2 sticky top-0 z-[60] shadow-md animate-in slide-in-from-top">
           <WifiOff size={12} />
           ইন্টারনেট সংযোগ নেই। AI ফিচার কাজ করবে না, অফলাইন মোড চালু।
        </div>
      )}

      <TopBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenGallery={() => setIsGalleryOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      
      <main className="max-w-5xl mx-auto p-2 md:p-6">
        {loading ? (
           <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <Loader2 className="w-8 h-8 animate-spin text-bk-green" />
           </div>
        ) : (
           renderContent()
        )}
      </main>

      <StorageManager 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(imageData) => updateLogo(imageData)}
      />
      
      {showAuthForGuest && <AuthModal isOpen={true} onClose={() => setShowAuthForGuest(false)} />}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}