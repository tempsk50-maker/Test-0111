
import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import NewsCardGenerator from './components/NewsCardGenerator';
import TextToolGenerator from './components/TextToolGenerator';
import StorageManager from './components/StorageManager';
import AdminPanel from './components/AdminPanel';
import { LayoutTemplate, PenTool, Image as ImageIcon, MonitorPlay, Sparkles, KeyRound, ExternalLink, Loader2, ShieldAlert, Lock, UserX } from 'lucide-react';
import { TextToolType } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState('news-card');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isKeyReady, setIsKeyReady] = useState(true);
  const [showAuthForGuest, setShowAuthForGuest] = useState(false);
  
  const { user, userProfile, loading, isApproved, isAdmin } = useAuth();

  // Dark Mode State - Defaulting to Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('bk_theme');
      return savedMode === 'light' ? false : true;
    } catch {
      return true;
    }
  });

  // Apply Dark Mode Class
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
      console.error("Failed to save logo to local storage", e);
    }
  };

  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('bk_custom_logo');
      if (savedLogo) {
        setCustomLogo(savedLogo);
      }
    } catch (e) {
      console.error("Failed to load logo from local storage", e);
    }
  }, []);

  // --- ACCESS CONTROL RENDER ---
  const renderAccessControl = () => {
    if (loading) {
       return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <Loader2 className="w-10 h-10 animate-spin text-bk-green mb-4" />
             <p className="text-gray-500">অপেক্ষা করুন...</p>
          </div>
       );
    }

    if (!user) {
      // Guest View: Limit access or show login prompt
      // For now, let's show login prompt if they try to do anything
      if (showAuthForGuest) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in">
             <div className="w-20 h-20 bg-bk-green/10 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-bk-green" />
             </div>
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">লগিন প্রয়োজন</h2>
             <p className="text-gray-500 max-w-sm mb-8">
                এই অ্যাপটি ব্যবহার করতে আপনাকে অবশ্যই লগিন করতে হবে।
             </p>
             <button 
               onClick={() => setShowAuthForGuest(true)} // Actually triggers modal via effect/prop in TopBar? No, need explicit modal here
               className="px-8 py-3 bg-bk-green text-white font-bold rounded-xl"
             >
                লগিন করুন
             </button>
             <AuthModal isOpen={true} onClose={() => {}} /> {/* Force open for demo or handle differently */}
          </div>
        );
      }
      // Actually, allow guest to see UI but maybe not generate?
      // Let's stick to the current flow: guests can access, but admin system is for when they login
      // If user IS logged in but NOT approved:
    }

    if (user && !isApproved) {
       return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 max-w-lg mx-auto animate-in fade-in">
             <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${userProfile?.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {userProfile?.status === 'blocked' ? <UserX className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
             </div>
             <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
                {userProfile?.status === 'blocked' ? 'একাউন্ট ব্লকড' : 'অ্যাকাউন্ট পেন্ডিং'}
             </h2>
             <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                {userProfile?.status === 'blocked' 
                  ? 'আপনার অ্যাকাউন্টটি এডমিন দ্বারা ব্লক করা হয়েছে। অনুগ্রহ করে কর্তৃপক্ষের সাথে যোগাযোগ করুন।' 
                  : 'আপনার রেজিস্ট্রেশন সফল হয়েছে, কিন্তু এডমিন এখনো অ্যাপ্রুভ করেনি। অ্যাপ্রুভালের জন্য অপেক্ষা করুন।'}
             </p>
             <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl w-full text-left mb-6">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">আপনার ডিটেইলস</p>
                <p className="font-bold text-gray-800 dark:text-white">{user.displayName}</p>
                <p className="text-sm text-gray-500">{user.email || user.phoneNumber}</p>
                <p className="mt-2 text-xs text-bk-green font-mono">UID: {user.uid.slice(0, 8)}...</p>
             </div>
             <button onClick={() => window.location.reload()} className="text-bk-green font-bold hover:underline">
                রিফ্রেশ করুন
             </button>
          </div>
       );
    }

    return renderContent();
  };

  const renderContent = () => {
    // Admin Panel Route
    if (activeTab === 'admin-panel') {
      if (isAdmin) {
        return <AdminPanel />;
      } else {
        setActiveTab('news-card'); // Redirect
        return null;
      }
    }

    switch (activeTab) {
      // VISUAL TOOLS
      case 'news-card':
        return (
          <NewsCardGenerator 
            customLogo={customLogo}
            cardType="news"
            onApiKeyInvalid={handleInvalidKey}
          />
        );
      case 'quote-card':
        return (
          <NewsCardGenerator 
            customLogo={customLogo}
            cardType="quote"
            onApiKeyInvalid={handleInvalidKey}
          />
        );
      
      // TEXT TOOLS
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

      // PLACEHOLDERS
      case 'poster-maker':
        return <Placeholder title="পোস্টার মেকার" icon={<LayoutTemplate className="w-16 h-16 text-purple-400/40 mb-4"/>} desc="সোশ্যাল মিডিয়া পোস্ট ও বিজ্ঞাপন তৈরি করুন।" />;
      
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
      <div className="min-h-screen bg-bk-bg-light dark:bg-bk-bg-dark flex items-center justify-center p-4 font-bengali transition-colors duration-500">
        <div className="max-w-lg w-full bg-bk-surface-light dark:bg-bk-surface-dark p-8 rounded-2xl shadow-xl border border-white dark:border-bk-border-dark text-center animate-in fade-in zoom-in-95">
           <div className="mx-auto w-16 h-16 flex items-center justify-center bg-bk-green/10 rounded-full mb-4">
               <KeyRound className="w-8 h-8 text-bk-green" />
           </div>
           <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 mb-2">API কী পারমিশন সমস্যা</h1>
           <p className="text-slate-600 dark:text-gray-400 mb-6">
               AI ফিচারটি ব্যবহার করতে একটি সমস্যা হয়েছে, সম্ভবত API কী পারমিশনের কারণে। অনুগ্রহ করে একটি বৈধ, বিলিং-সক্ষম Google AI Studio API কী নির্বাচন করুন।
           </p>
           <button
               onClick={handleSelectKey}
               className="w-full py-3 bg-bk-green text-white font-bold rounded-xl shadow-lg hover:shadow-bk-green/30 hover:-translate-y-0.5 transform active:scale-[0.98] transition-all flex justify-center items-center"
           >
               সঠিক API কী নির্বাচন করুন
           </button>
           <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-bk-green transition-colors"
           >
              বিলিং সম্পর্কে আরও জানুন <ExternalLink className="w-3 h-3" />
           </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bk-bg-light dark:bg-bk-bg-dark font-bengali text-slate-800 dark:text-gray-100 pb-12 transition-colors duration-500 selection:bg-bk-green/30 selection:text-bk-green">
      <TopBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenGallery={() => setIsGalleryOpen(true)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      
      <main className="max-w-7xl mx-auto p-2 lg:p-8">
        {renderAccessControl()}
      </main>

      <StorageManager 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(imageData) => updateLogo(imageData)}
      />
    </div>
  );
}

const Placeholder = ({ title, icon, desc }: { title: string, icon: React.ReactNode, desc: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] bg-bk-surface-light dark:bg-bk-surface-dark rounded-3xl border border-dashed border-slate-200 dark:border-bk-border-dark shadow-sm animate-in fade-in zoom-in-95 duration-300 text-center p-8 max-w-2xl mx-auto mt-4">
    <div className="bg-bk-input-light dark:bg-bk-input-dark p-6 rounded-full mb-6 shadow-inner">
      {icon}
    </div>
    <h2 className="text-3xl font-bold text-slate-800 dark:text-gray-100 mb-2">{title}</h2>
    <p className="text-slate-500 dark:text-gray-400 mb-8 text-lg max-w-md">{desc}</p>
    
    <button className="group relative px-8 py-3 bg-slate-900 dark:bg-black text-white rounded-full font-medium hover:bg-bk-green transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 overflow-hidden">
      <span className="relative z-10 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> কাজ চলছে...
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </button>
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
