import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, Upload, Trash2, RefreshCcw, Settings, Star, Copy, Newspaper, CheckCircle2, Download, ChevronDown, ChevronUp, Image as ImageIcon, X, Smartphone } from 'lucide-react';
import { NewsCardCanvas } from './NewsCardCanvas';
import { processNewsText } from '../services/geminiService';
import { NewsData, CardType, NewsCardTemplate } from '../types';

declare const html2canvas: any;

interface NewsCardGeneratorProps {
  customLogo: string | null;
  cardType?: CardType; 
  onApiKeyInvalid: () => void;
}

const FONT_OPTIONS = [
  { id: 'hind', name: 'হিন্দ শিলিগুড়ি', css: "'Hind Siliguri', sans-serif" },
  { id: 'anek', name: 'অনেক বাংলা', css: "'Anek Bangla', sans-serif" },
  { id: 'tiro', name: 'তিরো বাংলা', css: "'Tiro Bangla', serif" },
  { id: 'noto-serif', name: 'নোটো সেরিফ', css: "'Noto Serif Bengali', serif" },
  { id: 'noto-sans', name: 'নোটো স্যান্স', css: "'Noto Sans Bengali', sans-serif" },
  { id: 'baloo', name: 'বালু দা ২', css: "'Baloo Da 2', sans-serif" },
  { id: 'mina', name: 'মিনা', css: "'Mina', sans-serif" },
  { id: 'galada', name: 'গলাদা', css: "'Galada', cursive" },
  { id: 'kalam', name: 'কালাম', css: "'Kalam', cursive" },
  { id: 'merriweather', name: 'মেরিওয়েদার', css: "'Merriweather', serif" },
  { id: 'oswald', name: 'অসওয়াল্ড', css: "'Oswald', sans-serif" },
];

const NEWS_TEMPLATES: { id: NewsCardTemplate; label: string }[] = [
  { id: 'bk-classic-center', label: 'ক্লাসিক ব্র্যান্ড' },
  { id: 'bk-dark-studio', label: 'ডার্ক স্টুডিও' },
  { id: 'bk-ruby-prime', label: 'রুবি প্রাইম' },
  { id: 'bk-emerald-slate', label: 'এমারল্ড স্লেট' },
  { id: 'bk-crimson-focus', label: 'ক্রিমসন ফোকাস' },
  { id: 'bk-elegant-border', label: 'এলিগেন্ট বর্ডার' },
  { id: 'bk-midnight-impact', label: 'মিডনাইট ইমপ্যাক্ট' },
  { id: 'bk-golden-hour', label: 'রয়্যাল গ্রিন' }, 
  { id: 'bk-clean-teal', label: 'ক্লিন গ্রিন' },   
  { id: 'bk-bold-monochrome', label: 'মডার্ন কার্ড' },
  { id: 'bk-vibrant-overlay', label: 'ভাইব্রেন্ট ওভারলে' }, 
  { id: 'bk-modern-split', label: 'মডার্ন স্প্লিট' },       
  { id: 'bk-red-headline', label: 'রেড হেডলাইন' },
  { id: 'bk-focus-red', label: 'ফোকাস রেড' },
  { id: 'bk-elegant-light', label: 'এলিগেন্ট লাইট' },
  { id: 'bk-premium-minimal', label: 'প্রিমিয়াম মিনিমাল' },
  { id: 'bk-corporate-dark', label: 'কর্পোরেট ডার্ক' },
];

const QUOTE_TEMPLATES: { id: NewsCardTemplate; label: string }[] = [
  { id: 'bk-quote-block-red', label: 'ব্লক রেড (সলিড)' },
  { id: 'bk-quote-soft-gradient', label: 'সফট গ্রেডিয়েন্ট' },
  { id: 'bk-quote-circle-headline', label: 'সার্কেল হেডলাইন' },
  { id: 'bk-quote-pro-minimal', label: 'প্রো মিনিমাল' },
  { id: 'bk-quote-glass-elegance', label: 'গ্লাস এলিগেন্স' },
  { id: 'bk-quote-brand-focus', label: 'ব্র্যান্ড ফোকাস' },
  { id: 'bk-quote-sidebar-green', label: 'ব্র্যান্ড স্প্লিট (গ্রিন)' },
  { id: 'bk-quote-sidebar-red', label: 'ব্র্যান্ড স্প্লিট (রেড)' },
  { id: 'bk-quote-sidebar-right', label: 'রাইট সাইডবার' },
  { id: 'bk-quote-tv-style', label: 'টিভি স্টাইল' },
  { id: 'bk-quote-magazine', label: 'ম্যাগাজিন' },
  { id: 'bk-quote-dynamic-angle', label: 'ডায়নামিক অ্যাঙ্গেল' },
  { id: 'bk-quote-corporate-clean', label: 'কর্পোরেট ক্লিন' },
  { id: 'bk-quote-outline-pop', label: 'আউটলাইন পপ' },
  { id: 'bk-quote-red-classic', label: 'পোর্ট্রেট ক্লাসিক' },
  { id: 'bk-quote-author-focus', label: 'অথর ফোকাস' },
  { id: 'bk-quote-modern', label: 'মডার্ন উক্তি' },
  { id: 'bk-quote-glass', label: 'গ্লাস এফেক্ট' },
  { id: 'bk-quote-minimal-serif', label: 'মিনিমাল সেরিফ' },
  { id: 'bk-quote-dark-pro', label: 'প্রফেশনাল ডার্ক' },
  { id: 'bk-quote-image-overlay', label: 'ইমেজ ওভারলে' },
  { id: 'bk-quote-impact-yellow', label: 'ইমপ্যাক্ট গ্রিন' },
  { id: 'bk-quote-simple-border', label: 'সিম্পল বর্ডার' },
  { id: 'bk-quote-gradient-flow', label: 'গ্রেডিয়েন্ট ফ্লো' },
];

const NewsCardGenerator: React.FC<NewsCardGeneratorProps> = ({ 
  customLogo, 
  cardType = 'news',
  onApiKeyInvalid
}) => {
  const [inputText, setInputText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedData, setGeneratedData] = useState<NewsData>({ headline: '', body: '', caption: '' });
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  
  const [isImageTransparent, setIsImageTransparent] = useState(false);
  const [quoteIconIndex, setQuoteIconIndex] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  
  // Mobile Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Manual Edit Accordion State
  const [isManualEditOpen, setIsManualEditOpen] = useState(true);

  const templateList = cardType === 'quote' ? QUOTE_TEMPLATES : NEWS_TEMPLATES;

  const [defaultTemplate, setDefaultTemplate] = useState<NewsCardTemplate>(() => {
    try {
      const storedTemplate = localStorage.getItem('bk_default_template') as NewsCardTemplate | null;
      const allIds = [...NEWS_TEMPLATES, ...QUOTE_TEMPLATES].map(t => t.id);
      if (storedTemplate && allIds.includes(storedTemplate)) {
        return storedTemplate;
      }
      return cardType === 'quote' ? 'bk-quote-block-red' : 'bk-classic-center';
    } catch {
      return cardType === 'quote' ? 'bk-quote-block-red' : 'bk-classic-center';
    }
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<NewsCardTemplate>(defaultTemplate);
  
  useEffect(() => {
    const validIds = templateList.map(t => t.id);
    if (!validIds.includes(selectedTemplate)) {
      setSelectedTemplate(validIds[0]);
    }
  }, [cardType, templateList]);

  const [defaultFont, setDefaultFont] = useState<string>(() => {
    try {
      return localStorage.getItem('bk_default_font') || FONT_OPTIONS[0].css;
    } catch {
      return FONT_OPTIONS[0].css;
    }
  });

  const [selectedFont, setSelectedFont] = useState<string>(defaultFont);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const fontMenuRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGeneratedData({ headline: '', body: '', caption: '' });
    setInputText('');
    setImages([]);
    setIsImageTransparent(cardType === 'quote');
  }, [cardType]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fontMenuRef.current && !fontMenuRef.current.contains(event.target as Node)) {
        setShowFontMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFontSelect = (fontCss: string) => {
    setSelectedFont(fontCss);
    setTimeout(() => setShowFontMenu(false), 150);
  };

  const handleSetDefault = (e: React.MouseEvent, fontCss: string) => {
    e.stopPropagation(); 
    setDefaultFont(fontCss);
    try {
      localStorage.setItem('bk_default_font', fontCss);
    } catch (e) {
      console.error("Could not save default font");
    }
  };

  const handleSetDefaultTemplate = (e: React.MouseEvent, templateId: NewsCardTemplate) => {
    e.stopPropagation();
    setDefaultTemplate(templateId);
    try {
      localStorage.setItem('bk_default_template', templateId);
    } catch (e) {
      console.error("Could not save default template");
    }
  };

  const handleCycleQuoteIcon = () => {
    setQuoteIconIndex(prev => prev + 1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newImageUrls = Array.from(files).map((file) => URL.createObjectURL(file as Blob));
    setImages(prev => [...prev, ...newImageUrls]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const padding = 32; 
      const availableWidth = containerWidth - padding;
      const targetWidth = 600; 
      const newScale = Math.min(availableWidth / targetWidth, 1);
      setScale(newScale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleGenerate = async () => {
    if (!inputText) return;
    setIsProcessing(true);
    try {
      const result = await processNewsText(inputText, cardType as CardType);
      setGeneratedData(result);
    } catch (error: any) {
      console.error("Generation failed:", error);
      if (error.message && error.message.includes('API Key')) {
          onApiKeyInvalid();
      } else {
        alert("দুঃখিত, জেনারেশন সম্ভব হয়নি। আবার চেষ্টা করুন।");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    setIsCapturing(true);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    try {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: null,
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc: Document) => {
           const clonedCard = clonedDoc.querySelector('[data-card-root]') as HTMLElement;
           if (clonedCard) {
               clonedCard.style.transform = 'none';
           }
        }
      });
      return canvas.toDataURL('image/png', 1.0);
    } catch (err) {
      console.error("Capture failed:", err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) {
      alert("ছবি ডাউনলোড করতে সমস্যা হয়েছে।");
      return;
    }

    const link = document.createElement('a');
    link.download = `basherkella-${cardType}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleMobileSave = async () => {
    const dataUrl = await generateImage();
    if (dataUrl) {
      setPreviewImage(dataUrl);
    } else {
       alert("প্রিভিউ তৈরি করা সম্ভব হয়নি।");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls (Restored Order) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 1. Input Section */}
          <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 p-4 rounded-xl bg-bk-input-light dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark focus:ring-2 focus:ring-bk-green/20 focus:border-bk-green transition-all resize-none text-slate-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="এখানে দীর্ঘ, অগোছালো বা বায়াসড টেক্সট পেস্ট করুন। AI এটি ঠিক করে দিবে..."
            />
            
            <div className="mt-4">
               <button
                  onClick={handleGenerate}
                  disabled={isProcessing || !inputText}
                  className="w-full py-3 bg-bk-green hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-bk-green/20 hover:shadow-bk-green/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isProcessing ? 'তৈরি হচ্ছে...' : 'এনালাইসিস ও তৈরি করুন'}
               </button>
            </div>
          </div>

          {/* 2. Image Upload */}
          <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark">
               <label className="text-sm font-bold text-gray-300 dark:text-gray-400 mb-3 flex items-center gap-2">
                   <ImageIcon size={16} /> নিউজ ছবি
               </label>
              <div className="bg-bk-input-light dark:bg-bk-input-dark rounded-xl p-3 border border-gray-200 dark:border-bk-border-dark border-dashed">
                  <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                          {images.length > 0 ? `${images.length}টি ছবি সিলেক্ট করা হয়েছে` : "ছবি আপলোড করুন"}
                      </div>
                       <label className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-bk-green hover:text-white dark:hover:bg-bk-green text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                          ব্রাউজ
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                  </div>
                  {images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                           {images.map((img, idx) => (
                              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden">
                                  <img src={img} alt="upload" className="w-full h-full object-cover" />
                                  <button onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          {/* 3. Manual Edit (Restored Position) */}
          <div className="bg-bk-surface-light dark:bg-bk-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark overflow-hidden">
               <button 
                  onClick={() => setIsManualEditOpen(!isManualEditOpen)}
                  className="w-full p-4 flex items-center justify-between text-sm font-bold text-gray-300 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
               >
                   <span className="flex items-center gap-2"><RefreshCcw size={16}/> ম্যানুয়াল এডিট</span>
                   {isManualEditOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </button>
               
               {isManualEditOpen && (
                   <div className="p-4 pt-0 space-y-3">
                       <div>
                           <input 
                              value={generatedData.headline}
                              onChange={(e) => setGeneratedData({...generatedData, headline: e.target.value})}
                              className="w-full bg-bk-input-light dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-white focus:border-bk-green outline-none placeholder:text-gray-500"
                              placeholder="হেডলাইন লিখুন"
                           />
                       </div>
                       <div>
                           <input 
                              value={generatedData.body}
                              onChange={(e) => setGeneratedData({...generatedData, body: e.target.value})}
                              className="w-full bg-bk-input-light dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-white focus:border-bk-green outline-none placeholder:text-gray-500"
                              placeholder={cardType === 'quote' ? "নাম ও পদবী" : "সাব-হেডলাইন বা বডি"}
                           />
                       </div>
                   </div>
               )}
          </div>

          {/* 4. Template Selector (Buttons Style) */}
          <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark">
               <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                   {templateList.map((t) => (
                      <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`
                              px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border flex items-center gap-1
                              ${selectedTemplate === t.id 
                                  ? 'bg-bk-green text-white border-bk-green shadow-sm' 
                                  : 'bg-gray-50 dark:bg-bk-input-dark text-gray-600 dark:text-gray-300 border-gray-200 dark:border-bk-border-dark hover:bg-gray-100 dark:hover:bg-white/10'}
                          `}
                      >
                          {defaultTemplate === t.id && <Star size={8} className="fill-current" />}
                          {t.label}
                      </button>
                   ))}
               </div>
               <button 
                    onClick={(e) => handleSetDefaultTemplate(e, selectedTemplate)}
                    className="mt-3 text-[10px] text-gray-400 hover:text-bk-green flex items-center gap-1 font-bold transition-colors w-full justify-center"
                  >
                    <Star size={10} /> বর্তমান টেমপ্লেটটি ডিফল্ট করুন
               </button>
          </div>

          {/* 5. Font Selector */}
          <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark relative" ref={fontMenuRef}>
              <button
                  onClick={() => setShowFontMenu(!showFontMenu)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-bk-input-light dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 hover:border-bk-green transition-colors"
              >
                  <span style={{ fontFamily: selectedFont }}>
                      {FONT_OPTIONS.find(f => f.css === selectedFont)?.name || 'ফন্ট সিলেক্ট করুন'}
                  </span>
                  <Settings size={14} className="opacity-50" />
              </button>

              {showFontMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-bk-surface-dark border border-gray-200 dark:border-bk-border-dark rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar p-1">
                      {FONT_OPTIONS.map((font) => (
                          <div
                              key={font.id}
                              onClick={() => handleFontSelect(font.css)}
                              className={`
                                  flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors
                                  ${selectedFont === font.css ? 'bg-bk-green/10 text-bk-green' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200'}
                              `}
                          >
                              <span style={{ fontFamily: font.css }} className="text-lg">{font.name}</span>
                              <div className="flex items-center gap-2">
                                      {defaultFont === font.css && <Star size={12} className="text-yellow-400 fill-current" />}
                                      <button 
                                      onClick={(e) => handleSetDefault(e, font.css)}
                                      className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-bk-green"
                                      title="Set as Default"
                                      >
                                          <Star size={12} />
                                      </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* Quote Specific Toggles */}
          {cardType === 'quote' && (
              <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark flex items-center gap-2">
                  <button 
                      onClick={() => setIsImageTransparent(!isImageTransparent)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${isImageTransparent ? 'bg-bk-green/10 border-bk-green text-bk-green' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                  >
                      {isImageTransparent ? 'PNG মোড (ব্যাকগ্রাউন্ড নেই)' : 'JPG মোড (সলিড)'}
                  </button>
                  <button
                      onClick={handleCycleQuoteIcon}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-bk-green hover:border-bk-green transition-all"
                      title="আইকন পরিবর্তন করুন"
                  >
                      <RefreshCcw size={14} />
                  </button>
              </div>
          )}
        </div>

        {/* RIGHT COLUMN: Preview & Actions */}
        <div className="lg:col-span-8 flex flex-col gap-6 sticky top-24">
           
           {/* Canvas Area */}
           <div 
              ref={containerRef}
              className="w-full bg-gray-200 dark:bg-black/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden relative min-h-[400px]"
           >
               <div 
                  className={`transition-all duration-300 ${isCapturing ? 'scale-100' : ''}`}
                  style={{ 
                      transform: isCapturing ? 'none' : `scale(${scale})`, 
                      transformOrigin: 'center center' 
                  }}
               >
                   <div ref={cardRef} data-card-root>
                      <NewsCardCanvas 
                          headline={generatedData.headline}
                          body={generatedData.body}
                          images={images}
                          customLogo={customLogo}
                          template={selectedTemplate}
                          selectedFont={selectedFont}
                          isQuote={cardType === 'quote'}
                          isImageTransparent={isImageTransparent}
                          quoteIconIndex={quoteIconIndex}
                      />
                   </div>
               </div>
               
               {/* Flash Effect */}
               {showFlash && <div className="absolute inset-0 bg-white animate-flash pointer-events-none z-50"></div>}
           </div>

           {/* Action Buttons */}
           <div className="flex gap-2 sm:gap-4">
               {/* Desktop/Standard Download */}
               <button
                  onClick={handleDownload}
                  className="flex-1 py-4 bg-slate-900 dark:bg-white dark:text-black text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
               >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">ডাউনলোড ইমেজ</span>
                  <span className="sm:hidden">ডাউনলোড</span>
               </button>

               {/* Mobile/WebView Friendly Save */}
               <button
                  onClick={handleMobileSave}
                  className="flex-1 py-4 bg-bk-green text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
               >
                  <Smartphone className="w-5 h-5" />
                  <span className="hidden sm:inline">সেভ (অ্যাপ মোড)</span>
                  <span className="sm:hidden">সেভ</span>
               </button>
           </div>

           {/* Caption Copy */}
           {generatedData.caption && (
              <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-bk-border-dark relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                          onClick={() => {
                              navigator.clipboard.writeText(generatedData.caption || '');
                              setCopiedCaption(true);
                              setTimeout(() => setCopiedCaption(false), 2000);
                          }}
                          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 hover:text-bk-green"
                      >
                          {copiedCaption ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      </button>
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">সোশ্যাল মিডিয়া ক্যাপশন</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {generatedData.caption}
                  </p>
              </div>
           )}
        </div>
      </div>

      {/* Full Screen Image Preview Modal for Mobile/WebView */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
           <button 
             onClick={() => setPreviewImage(null)}
             className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-10"
           >
             <X size={24} />
           </button>
           
           <div className="text-center mb-6 px-4">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bk-green/20 text-bk-green mb-3">
               <CheckCircle2 size={24} />
             </div>
             <h3 className="text-white font-bold text-lg">কার্ড তৈরি সম্পন্ন হয়েছে!</h3>
             <p className="text-gray-400 text-sm mt-1">গ্যালারিতে সেভ করতে নিচের ইমেজে ট্যাপ করে ধরে রাখুন (Long Press)।</p>
           </div>

           <div className="relative max-w-full max-h-[70vh] overflow-auto rounded-lg shadow-2xl border border-white/10">
              <img 
                src={previewImage} 
                alt="Generated Card" 
                className="max-w-full h-auto object-contain" 
                style={{ touchAction: 'none' }} // Hint to browser/webview
              />
           </div>
           
           <button 
             onClick={() => setPreviewImage(null)}
             className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
           >
             বন্ধ করুন
           </button>
        </div>
      )}
    </>
  );
};

export default NewsCardGenerator;