
import React, { useState, useMemo, useEffect } from 'react';
import { Newspaper, Quote, LayoutTemplate, Menu, X, FolderOpen, Settings, ChevronRight, MonitorPlay, Layers, Edit3, Moon, Sun, Languages, FileText, Wand2, Share2, Type, Mic2, Tv, Search, Image as ImageIcon, Download, Smartphone, LogIn, User, LogOut, ShieldCheck } from 'lucide-react';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenGallery: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const TOOL_CATEGORIES = {
  'graphics': {
    label: 'ডিজাইন ও গ্রাফিক্স',
    icon: Newspaper,
    description: 'কার্ড, থাম্বনেইল প্রম্পট',
    tools: [
      { id: 'news-card', label: 'নিউজ কার্ড', icon: Newspaper },
      { id: 'quote-card', label: 'উক্তি কার্ড', icon: Quote },
      { id: 'thumbnail-prompter', label: 'থাম্বনেইল প্রম্পটার', icon: ImageIcon },
    ]
  },
  'editorial': {
    label: 'নিউজ ও এডিটোরিয়াল',
    icon: Edit3,
    description: 'অনুবাদ, হেডিং, ইন্টারভিউ',
    tools: [
      { id: 'translator', label: 'নিউজ অনুবাদক', icon: Languages },
      { id: 'proofreader', label: 'ম্যাজিক এডিটর', icon: Wand2 },
      { id: 'headline-generator', label: 'হেডলাইন মাস্টার', icon: Type },
      { id: 'interview-prep', label: 'ইন্টারভিউ প্রস্তুতি', icon: Mic2 },
    ]
  },
  'broadcast': {
    label: 'ভিডিও ও ব্রডকাস্ট',
    icon: MonitorPlay,
    description: 'স্ক্রিপ্ট, টিভি স্ক্রল',
    tools: [
      { id: 'script-writer', label: 'ভিডিও স্ক্রিপ্ট', icon: FileText },
      { id: 'ticker-writer', label: 'টিভি স্ক্রল/টিকার', icon: Tv },
    ]
  },
  'digital': {
    label: 'ডিজিটাল ও সোশ্যাল',
    icon: Share2,
    description: 'সোশ্যাল, SEO, ট্যাগ',
    tools: [
      { id: 'social-manager', label: 'সোশ্যাল ম্যানেজার', icon: Share2 },
      { id: 'seo-optimizer', label: 'SEO অপ্টিমাইজার', icon: Search },
    ]
  }
};

const InstallModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-bk-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-bk-green relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5 text-gray-500" />
      </button>
      
      <div className="flex flex-col items-center text-center mb-6">
         <div className="w-16 h-16 bg-bk-green/10 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-8 h-8 text-bk-green" />
         </div>
         <h3 className="text-xl font-bold text-gray-800 dark:text-white">
           অ্যাপ ইনস্টল করবেন যেভাবে
         </h3>
         <p className="text-sm text-gray-500 mt-2">
            আপনার ব্রাউজারের মেনু থেকে খুব সহজেই অ্যাপটি হোম স্ক্রিনে যুক্ত করতে পারেন।
         </p>
      </div>

      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
          <p className="font-bold text-bk-green mb-1 flex items-center gap-2">
             <span className="w-5 h-5 rounded-full bg-bk-green text-white flex items-center justify-center text-xs">১</span>
             Android (Chrome)
          </p>
          <p className="pl-7 opacity-80">ব্রাউজারের মেনুতে (উপরে ৩টি ডট) ক্লিক করুন এবং <b>"Add to Home Screen"</b> বা <b>"Install App"</b> সিলেক্ট করুন।</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
          <p className="font-bold text-bk-green mb-1 flex items-center gap-2">
             <span className="w-5 h-5 rounded-full bg-bk-green text-white flex items-center justify-center text-xs">২</span>
             iOS (Safari)
          </p>
          <p className="pl-7 opacity-80">নিচে <b>"Share"</b> বাটনে ক্লিক করুন এবং লিস্ট থেকে <b>"Add to Home Screen"</b> সিলেক্ট করুন।</p>
        </div>
      </div>
      
      <button onClick={onClose} className="mt-6 w-full py-3 bg-bk-green text-white font-bold rounded-xl shadow-lg shadow-bk-green/20">
        বুঝেছি
      </button>
    </div>
  </div>
);

const TopBar: React.FC<TopBarProps> = React.memo(({ activeTab, setActiveTab, onOpenGallery, isDarkMode, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  
  // Auth & Modal State
  const { user, logout, isAdmin } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Check if installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("Install prompt captured");
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallHelp(true);
    }
    setIsMobileMenuOpen(false);
  };

  const activeCategoryKey = useMemo(() => {
    if (activeTab === 'admin-panel') return 'admin';
    for (const [key, category] of Object.entries(TOOL_CATEGORIES)) {
      if (category.tools.find(t => t.id === activeTab)) {
        return key;
      }
    }
    return 'graphics';
  }, [activeTab]);

  const currentTools = activeCategoryKey === 'admin' 
      ? [{ id: 'admin-panel', label: 'এডমিন ড্যাশবোর্ড', icon: ShieldCheck }] 
      : TOOL_CATEGORIES[activeCategoryKey as keyof typeof TOOL_CATEGORIES].tools;

  const handleCategorySelect = (catKey: string) => {
    const category = TOOL_CATEGORIES[catKey as keyof typeof TOOL_CATEGORIES];
    if (category && category.tools.length > 0) {
      setActiveTab(category.tools[0].id);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-bk-surface-light/80 dark:bg-bk-surface-dark/80 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-bk-border-dark transition-all duration-500">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Left: Logo Section */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer group" onClick={() => handleCategorySelect('graphics')}>
              <div className="w-9 h-9 rounded-full border-2 border-bk-red flex items-center justify-center overflow-hidden bg-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <div className="w-1.5 h-full bg-bk-green mx-[1px]"></div>
                <div className="w-1.5 h-full bg-bk-green mx-[1px]"></div>
              </div>
              <span className="font-bold text-xl text-bk-green tracking-tight hidden lg:block">
                বাঁশের<span className="text-bk-red">কেল্লা</span>
              </span>
            </div>
            
            {/* Center: Dynamic Tool Tabs */}
            <div className="flex-1 flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden mask-linear-fade -mx-2 px-2 sm:mx-0 sm:px-0">
              <div className="flex items-center bg-gray-100/50 dark:bg-bk-surface-dark p-1 rounded-full border border-gray-200/50 dark:border-bk-border-dark shadow-inner transition-colors duration-300">
                {currentTools.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-shrink-0 flex items-center px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap
                      ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-bk-green/10 text-bk-green dark:text-bk-green shadow-sm scale-105 ring-1 ring-gray-200 dark:ring-bk-green/20'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/5'
                      }
                    `}
                  >
                    <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 ${activeTab === tab.id ? 'text-bk-red' : 'text-gray-400 dark:text-gray-500'}`} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Menu & Actions */}
            <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2 pl-2">
                
                {/* Install Button (Desktop) */}
                {!isInstalled && (
                  <button
                    onClick={handleInstallClick}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-bk-green text-white rounded-full text-xs font-bold hover:bg-green-700 transition-colors shadow-sm animate-in fade-in zoom-in"
                  >
                    <Download className="w-3.5 h-3.5" /> অ্যাপ
                  </button>
                )}

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                  title={isDarkMode ? "লাইট মোড" : "ডার্ক মোড"}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Profile / Login */}
                <div className="hidden md:block">
                  {user ? (
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-white/10 ml-2">
                       {isAdmin && (
                         <button 
                           onClick={() => setActiveTab('admin-panel')}
                           className={`p-2 rounded-full ${activeTab === 'admin-panel' ? 'bg-bk-green text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'} transition-colors`}
                           title="এডমিন প্যানেল"
                         >
                           <ShieldCheck className="w-5 h-5" />
                         </button>
                       )}
                       <button 
                         onClick={logout}
                         className="flex items-center gap-2 group"
                         title="লগ আউট"
                       >
                         {user.photoURL ? (
                           <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border-2 border-bk-green shadow-sm" />
                         ) : (
                           <div className="w-8 h-8 rounded-full bg-bk-green/10 text-bk-green flex items-center justify-center font-bold">
                             {user.displayName?.charAt(0) || <User className="w-4 h-4"/>}
                           </div>
                         )}
                         <div className="text-left hidden lg:block">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">{user.displayName?.split(' ')[0]}</p>
                            <p className="text-[10px] text-gray-400">Online</p>
                         </div>
                       </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full text-xs font-bold hover:opacity-90 transition-all ml-2"
                    >
                      <LogIn className="w-3.5 h-3.5" /> লগিন
                    </button>
                  )}
                </div>

                {/* Menu Toggle */}
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-2 rounded-full transition-all duration-200 ${isMobileMenuOpen ? 'bg-bk-green text-white rotate-90' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 inset-x-0 md:inset-x-auto md:right-4 w-full md:w-80 bg-bk-surface-light/95 dark:bg-bk-surface-dark/95 backdrop-blur-xl border-b md:border border-gray-200 dark:border-bk-border-dark shadow-2xl z-40 animate-in slide-in-from-top-2 md:rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="p-2 space-y-1">
              
              {/* User Profile in Mobile Menu */}
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl mb-2 flex items-center justify-between">
                {user ? (
                   <div className="flex items-center gap-3">
                      {user.photoURL ? (
                           <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-bk-green shadow-sm" />
                         ) : (
                           <div className="w-10 h-10 rounded-full bg-bk-green/10 text-bk-green flex items-center justify-center font-bold">
                             {user.displayName?.charAt(0) || <User className="w-5 h-5"/>}
                           </div>
                         )}
                      <div>
                         <p className="font-bold text-gray-800 dark:text-white">{user.displayName || 'User'}</p>
                         <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                   </div>
                ) : (
                   <div className="flex flex-col gap-1">
                      <p className="font-bold text-gray-800 dark:text-white">গেস্ট ইউজার</p>
                      <p className="text-xs text-gray-500">সকল ফিচার পেতে লগিন করুন</p>
                   </div>
                )}

                {user ? (
                   <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100">
                      <LogOut className="w-4 h-4" />
                   </button>
                ) : (
                   <button onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }} className="px-4 py-2 bg-bk-green text-white text-xs font-bold rounded-full">
                      লগিন
                   </button>
                )}
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => { setActiveTab('admin-panel'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center px-3 py-3 mb-2 rounded-xl bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 font-bold text-sm"
                >
                  <ShieldCheck className="w-5 h-5 mr-3" />
                  এডমিন প্যানেল
                </button>
              )}

              {/* Install Button (Mobile Menu) */}
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 mb-2 bg-bk-green text-white rounded-xl text-sm font-bold shadow-md"
                >
                  <Download className="w-4 h-4" /> অ্যাপ ইনস্টল করুন
                </button>
              )}

              <div className="px-3 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">টুলস ক্যাটাগরি</div>
              
              {Object.entries(TOOL_CATEGORIES).map(([key, cat]) => {
                const isActive = key === activeCategoryKey && activeCategoryKey !== 'admin';
                return (
                  <button
                    key={key}
                    onClick={() => handleCategorySelect(key)}
                    className={`w-full flex items-center px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-bk-green/10 dark:bg-bk-green/10 text-bk-green ring-1 ring-bk-green/20' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200'}`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${isActive ? 'bg-white dark:bg-bk-bg-dark text-bk-green shadow-sm' : 'bg-gray-100 dark:bg-bk-input-dark text-gray-500 dark:text-gray-400'}`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">{cat.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 opacity-80">{cat.description}</div>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                  </button>
                );
              })}

              <div className="border-t border-gray-100 dark:border-bk-border-dark my-2 mx-2"></div>
              <div className="px-3 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">অন্যান্য</div>

              <button
                  onClick={() => {
                    onOpenGallery();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors group"
                >
                  <FolderOpen className="w-5 h-5 mr-3 text-yellow-500 group-hover:scale-110 transition-transform" />
                  ফাইল গ্যালারি
              </button>

              <button className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5 cursor-not-allowed">
                  <Settings className="w-5 h-5 mr-3" />
                  সেটিংস (শীঘ্রই আসছে)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Install Help Modal */}
      {showInstallHelp && <InstallModal onClose={() => setShowInstallHelp(false)} />}
      
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
});

export default TopBar;
