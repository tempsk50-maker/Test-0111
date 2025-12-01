import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, Upload, Trash2, RefreshCcw, Settings, Star, Copy, CheckCircle2, Download, ChevronDown, ChevronUp, Image as ImageIcon, X, Smartphone, WifiOff } from 'lucide-react';
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
  { id: 'noto-serif', name: 'নোটো সেরিফ', css: "'Noto Serif Bengali', serif" },
  { id: 'oswald', name: 'অসওয়াল্ড', css: "'Oswald', sans-serif" },
];

const NEWS_TEMPLATES: { id: NewsCardTemplate; label: string }[] = [
  { id: 'bk-classic-center', label: 'ক্লাসিক' },
  { id: 'bk-modern-split', label: 'মডার্ন স্প্লিট' },       
  { id: 'bk-ruby-prime', label: 'রুবি প্রাইম' },
  { id: 'bk-dark-studio', label: 'ডার্ক স্টুডিও' },
  { id: 'bk-focus-red', label: 'ফোকাস রেড' },
];

const QUOTE_TEMPLATES: { id: NewsCardTemplate; label: string }[] = [
  { id: 'bk-quote-block-red', label: 'ব্লক রেড' },
  { id: 'bk-quote-soft-gradient', label: 'সফট গ্রেডিয়েন্ট' },
  { id: 'bk-quote-circle-headline', label: 'সার্কেল হেডলাইন' },
  { id: 'bk-quote-modern', label: 'মডার্ন উক্তি' },
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
  
  // Mobile Preview State (For Android WebView Long-Press Save)
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isManualEditOpen, setIsManualEditOpen] = useState(true);

  const templateList = cardType === 'quote' ? QUOTE_TEMPLATES : NEWS_TEMPLATES;
  
  const [selectedTemplate, setSelectedTemplate] = useState<NewsCardTemplate>(
    cardType === 'quote' ? 'bk-quote-block-red' : 'bk-classic-center'
  );
  
  const [selectedFont, setSelectedFont] = useState<string>(FONT_OPTIONS[0].css);
  const [showFontMenu, setShowFontMenu] = useState(false);
  
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset data on mode switch
    setGeneratedData({ headline: '', body: '', caption: '' });
    setImages([]);
    const defaultTpl = cardType === 'quote' ? 'bk-quote-block-red' : 'bk-classic-center';
    setSelectedTemplate(defaultTpl);
  }, [cardType]);

  // Responsive Scale
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const padding = 20; 
      const availableWidth = containerWidth - padding;
      const targetWidth = 600; 
      const newScale = Math.min(availableWidth / targetWidth, 1);
      setScale(newScale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newImageUrls = Array.from(files).map((file) => URL.createObjectURL(file as Blob));
    setImages(prev => [...prev, ...newImageUrls]);
  };

  const handleGenerate = async () => {
    if (!inputText) return;
    if (!navigator.onLine) {
       alert("AI জেনারেশনের জন্য ইন্টারনেট প্রয়োজন।");
       return;
    }
    setIsProcessing(true);
    try {
      const result = await processNewsText(inputText, cardType as CardType);
      setGeneratedData(result);
    } catch (error: any) {
      if (error.message && error.message.includes('API Key')) {
          onApiKeyInvalid();
      } else {
        alert("জেনারেশন সম্ভব হয়নি।");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const captureImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    setIsCapturing(true);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    try {
      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: null,
        logging: false,
        allowTaint: true
      });
      return canvas.toDataURL('image/png', 1.0);
    } catch (err) {
      console.error("Capture failed:", err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }

  // Primary method for Android App
  const handleMobileSave = async () => {
    const dataUrl = await captureImage();
    if (dataUrl) {
      setPreviewImage(dataUrl);
    }
  };

  return (
    <>
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Controls Section */}
        <div className="w-full lg:col-span-4 space-y-4">
          
          {/* Input */}
          <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-bk-border-dark">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-24 p-3 rounded-lg bg-bk-input-light dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark focus:border-bk-green text-sm"
              placeholder={navigator.onLine ? "নিউজ পেস্ট করুন..." : "অফলাইন মোড..."}
            />
            <button
               onClick={handleGenerate}
               disabled={isProcessing || !inputText || !navigator.onLine}
               className="w-full mt-3 py-2.5 bg-bk-green text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
               {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : (navigator.onLine ? <Sparkles className="w-4 h-4" /> : <WifiOff className="w-4 h-4"/>)}
               {isProcessing ? 'তৈরি হচ্ছে...' : 'জেনারেট করুন'}
            </button>
          </div>

          {/* Manual Edit Accordion */}
          <div className="bg-bk-surface-light dark:bg-bk-surface-dark rounded-xl border border-gray-100 dark:border-bk-border-dark overflow-hidden">
               <button 
                  onClick={() => setIsManualEditOpen(!isManualEditOpen)}
                  className="w-full p-3 flex items-center justify-between text-xs font-bold text-gray-400"
               >
                   <span className="flex items-center gap-2"><RefreshCcw size={14}/> ম্যানুয়াল এডিট</span>
                   {isManualEditOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
               </button>
               {isManualEditOpen && (
                   <div className="p-3 pt-0 space-y-2">
                       <input 
                          value={generatedData.headline}
                          onChange={(e) => setGeneratedData({...generatedData, headline: e.target.value})}
                          className="w-full bg-bk-input-light dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded p-2 text-sm dark:text-white"
                          placeholder="হেডলাইন"
                       />
                       <input 
                          value={generatedData.body}
                          onChange={(e) => setGeneratedData({...generatedData, body: e.target.value})}
                          className="w-full bg-bk-input-light dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded p-2 text-sm dark:text-white"
                          placeholder="বডি টেক্সট"
                       />
                       <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer bg-bk-input-light dark:bg-bk-input-dark p-2 rounded border border-dashed border-gray-300 dark:border-gray-700">
                          <ImageIcon size={14} />
                          <span>ছবি আপলোড (বা গ্যালারি)</span>
                          <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                       </label>
                   </div>
               )}
          </div>

          {/* Template Selector */}
          <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-3 rounded-xl border border-gray-100 dark:border-bk-border-dark">
               <h3 className="text-xs font-bold text-gray-400 mb-2">টেমপ্লেট</h3>
               <div className="flex flex-wrap gap-2">
                   {templateList.map((t) => (
                      <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border ${selectedTemplate === t.id ? 'bg-bk-green text-white border-bk-green' : 'bg-gray-50 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-gray-700'}`}
                      >
                          {t.label}
                      </button>
                   ))}
               </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="w-full lg:col-span-8 space-y-4">
           
           <div 
              ref={containerRef}
              className="w-full bg-gray-200 dark:bg-black/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden min-h-[350px] relative"
           >
               <div 
                  className={`transition-transform duration-200 origin-center ${isCapturing ? 'scale-100' : ''}`}
                  style={{ transform: isCapturing ? 'none' : `scale(${scale})` }}
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
               {showFlash && <div className="absolute inset-0 bg-white animate-flash z-50 pointer-events-none"></div>}
           </div>

           {/* Mobile Action Buttons */}
           <div className="grid grid-cols-1 gap-3">
               <button
                  onClick={handleMobileSave}
                  className="w-full py-3.5 bg-bk-green text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
               >
                  <Smartphone className="w-5 h-5" />
                  সেভ (অ্যাপ মোড)
               </button>
           </div>
           
           {/* Caption Copy */}
           {generatedData.caption && (
             <div className="p-4 bg-bk-surface-light dark:bg-bk-surface-dark rounded-xl border border-gray-100 dark:border-bk-border-dark relative">
                 <button 
                    onClick={() => {
                       navigator.clipboard.writeText(generatedData.caption || '');
                       setCopiedCaption(true);
                       setTimeout(() => setCopiedCaption(false), 2000);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-white/10 rounded text-gray-500"
                 >
                    {copiedCaption ? <CheckCircle2 size={14} className="text-green-500"/> : <Copy size={14}/>}
                 </button>
                 <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pr-6">{generatedData.caption}</p>
             </div>
           )}

        </div>
      </div>

      {/* Preview Modal for Mobile Save */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
               <h3 className="text-white font-bold text-sm">ছবি সেভ করতে ট্যাপ করে ধরে রাখুন</h3>
               <button onClick={() => setPreviewImage(null)} className="p-2 bg-white/20 rounded-full text-white">
                 <X size={20} />
               </button>
           </div>
           
           <div className="w-full h-full flex items-center justify-center p-2">
              <img 
                src={previewImage} 
                alt="Generated Card" 
                className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
              />
           </div>
           
           <div className="absolute bottom-8 px-6 py-2 bg-bk-green rounded-full text-white text-xs font-bold shadow-lg animate-bounce">
              Long Press on Image to Save
           </div>
        </div>
      )}
    </>
  );
};

export default NewsCardGenerator;