
import React, { useState } from 'react';
import { Loader2, Sparkles, Copy, CheckCircle2, RotateCcw, MonitorPlay, Video, Hash, Type, Languages, Wand2, Share2, FileText, Mic2, Tv, Search, Image as ImageIcon } from 'lucide-react';
import { processTextTool } from '../services/geminiService';
import { TextToolType, TextToolOutput } from '../types';

interface TextToolGeneratorProps {
  toolType: TextToolType;
  onApiKeyInvalid: () => void;
}

const TOOL_CONFIG: Record<string, { title: string; desc: string; placeholder: string; icon: any; color: string; btnBg: string }> = {
  'translator': {
    title: 'নিউজ অনুবাদক',
    desc: 'ইংরেজি বা অন্য ভাষার সংবাদকে প্রফেশনাল বাংলা সাংবাদিকতার ভাষায় রূপান্তর করুন।',
    placeholder: 'এখানে ইংরেজি নিউজ পেস্ট করুন...',
    icon: Languages,
    color: 'text-blue-500',
    btnBg: 'bg-blue-600 hover:bg-blue-700'
  },
  'proofreader': {
    title: 'ম্যাজিক এডিটর',
    desc: 'বানান ভুল, ব্যাকরণ এবং বাক্যের গঠন ঠিক করে প্রমিত সংবাদ তৈরি করুন।',
    placeholder: 'অগোছালো বা ভুল বানান যুক্ত টেক্সট এখানে দিন...',
    icon: Wand2,
    color: 'text-purple-500',
    btnBg: 'bg-purple-600 hover:bg-purple-700'
  },
  'script-writer': {
    title: 'ভিডিও স্ক্রিপ্ট রাইটার',
    desc: 'যেকোনো সংবাদ থেকে টিভি বা সোশ্যাল মিডিয়ার জন্য ভিডিও স্ক্রিপ্ট তৈরি করুন।',
    placeholder: 'নিউজ রিপোর্টটি এখানে পেস্ট করুন...',
    icon: Video,
    color: 'text-red-500',
    btnBg: 'bg-red-600 hover:bg-red-700'
  },
  'social-manager': {
    title: 'সোশ্যাল ম্যানেজার',
    desc: 'Facebook, Twitter এবং Telegram এর জন্য আকর্ষণীয় ক্যাপশন ও হ্যাশট্যাগ।',
    placeholder: 'নিউজের বিস্তারিত এখানে দিন...',
    icon: Share2,
    color: 'text-indigo-500',
    btnBg: 'bg-indigo-600 hover:bg-indigo-700'
  },
  // NEW TOOLS
  'headline-generator': {
    title: 'হেডলাইন মাস্টার',
    desc: 'একটি সংবাদের জন্য ৫টি ভিন্ন ধরণের (ভাইরাল, ফরমাল, আবেগপূর্ণ) শিরোনাম তৈরি করুন।',
    placeholder: 'মূল সংবাদ বা বিষয়বস্তু এখানে দিন...',
    icon: Type,
    color: 'text-pink-500',
    btnBg: 'bg-pink-600 hover:bg-pink-700'
  },
  'thumbnail-prompter': {
    title: 'থাম্বনেইল প্রম্পটার',
    desc: 'Midjourney বা DALL-E এর জন্য হাই-কোয়ালিটি ইমেজ প্রম্পট তৈরি করুন।',
    placeholder: 'নিউজ স্টোরি বা ভিজুয়াল আইডিয়া এখানে লিখুন...',
    icon: ImageIcon,
    color: 'text-orange-500',
    btnBg: 'bg-orange-600 hover:bg-orange-700'
  },
  'interview-prep': {
    title: 'ইন্টারভিউ প্রস্তুতি',
    desc: 'যেকোনো গেস্ট বা টপিকের উপর ভিত্তি করে কঠিন ও গুরুত্বপূর্ণ প্রশ্ন তৈরি করুন।',
    placeholder: 'গেস্টের নাম, পদবী এবং আলোচনার বিষয় লিখুন...',
    icon: Mic2,
    color: 'text-teal-500',
    btnBg: 'bg-teal-600 hover:bg-teal-700'
  },
  'ticker-writer': {
    title: 'টিভি স্ক্রল/টিকার',
    desc: 'টিভির নিচের স্ক্রল বা ব্রেকিং বারের জন্য ছোট ছোট বাক্য তৈরি করুন।',
    placeholder: 'পুরো সংবাদটি এখানে দিন...',
    icon: Tv,
    color: 'text-cyan-500',
    btnBg: 'bg-cyan-600 hover:bg-cyan-700'
  },
  'seo-optimizer': {
    title: 'SEO অপ্টিমাইজার',
    desc: 'ওয়েবসাইটের জন্য মেটা টাইটেল, ডেসক্রিপশন এবং ফোকাস কি-ওয়ার্ড জেনারেট করুন।',
    placeholder: 'নিউজ আর্টিকেলটি এখানে দিন...',
    icon: Search,
    color: 'text-green-500',
    btnBg: 'bg-green-600 hover:bg-green-700'
  }
};

const TextToolGenerator: React.FC<TextToolGeneratorProps> = ({ toolType, onApiKeyInvalid }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<TextToolOutput | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const config = TOOL_CONFIG[toolType] || TOOL_CONFIG['translator'];

  const handleGenerate = async () => {
    if (!inputText) return;
    setIsProcessing(true);
    setOutput(null);
    try {
      const result = await processTextTool(inputText, toolType);
      setOutput(result);
    } catch (error: any) {
      if (error.message && error.message.includes('API Key')) {
        onApiKeyInvalid();
      } else {
        alert("সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string, id: string }) => (
    <button 
      onClick={() => handleCopy(text, id)}
      className="p-2 rounded-lg bg-gray-100 dark:bg-bk-surface-light/10 text-gray-500 dark:text-gray-400 hover:text-bk-green hover:bg-bk-green/10 transition-colors"
      title="কপি করুন"
    >
      {copiedSection === id ? <CheckCircle2 size={16} className="text-bk-green" /> : <Copy size={16} />}
    </button>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-500">
      
      {/* Input Section */}
      <div className="space-y-4">
        <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark">
           <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl bg-gray-100 dark:bg-bk-input-dark ${config.color}`}>
                <config.icon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{config.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{config.desc}</p>
              </div>
           </div>

           <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-64 p-4 rounded-xl bg-bk-input-light dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark focus:ring-2 focus:ring-bk-green/20 focus:border-bk-green transition-all resize-none text-slate-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm leading-relaxed custom-scrollbar"
              placeholder={config.placeholder}
            />

            <div className="mt-4 flex items-center justify-end gap-3">
               {inputText && (
                 <button 
                   onClick={() => { setInputText(''); setOutput(null); }}
                   className="px-4 py-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-bold flex items-center gap-2"
                 >
                   <RotateCcw size={14} /> রিসেট
                 </button>
               )}
               <button
                  onClick={handleGenerate}
                  disabled={isProcessing || !inputText}
                  className={`px-8 py-3 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${config.btnBg}`}
               >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isProcessing ? 'কাজ চলছে...' : 'জেনারেট করুন'}
               </button>
            </div>
        </div>
      </div>

      {/* Output Section */}
      <div className="space-y-4">
         {output ? (
           <div className="space-y-4">
             
             {/* 1. Translator & Proofreader Output */}
             {(toolType === 'translator' || toolType === 'proofreader') && output.mainContent && (
               <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark relative group">
                  <div className="absolute top-4 right-4"><CopyButton text={output.mainContent} id="main" /></div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={14} /> ফলাফল
                  </h3>
                  <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 text-base leading-loose whitespace-pre-wrap font-bengali">
                    {output.mainContent}
                  </div>
                  {output.notes && (
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl text-sm text-yellow-800 dark:text-yellow-500">
                      <span className="font-bold block mb-1">নোট:</span> {output.notes}
                    </div>
                  )}
               </div>
             )}

             {/* 2. Script Writer Output */}
             {toolType === 'script-writer' && output.scriptSegments && (
                <div className="bg-bk-surface-light dark:bg-bk-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-bk-border-dark bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                       <div>
                         <h3 className="font-bold text-gray-800 dark:text-white">{output.title || 'ভিডিও স্ক্রিপ্ট'}</h3>
                         <p className="text-xs text-gray-500">{output.scriptSegments.length} টি সিন</p>
                       </div>
                       <CopyButton text={output.scriptSegments.map(s => `[${s.visual}] - ${s.audio}`).join('\n\n')} id="full-script" />
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-bk-border-dark">
                       {output.scriptSegments.map((segment, idx) => (
                         <div key={idx} className="grid grid-cols-12 p-4 gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="col-span-1 text-xs font-bold text-gray-400 mt-1">{(idx + 1).toString().padStart(2, '0')}</div>
                            <div className="col-span-11 md:col-span-4 text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded h-fit">
                               <span className="font-bold block text-[10px] uppercase opacity-50 mb-1">Visual / Shot</span>
                               {segment.visual}
                            </div>
                            <div className="col-span-1 md:hidden"></div>
                            <div className="col-span-11 md:col-span-7 text-sm text-gray-800 dark:text-gray-200">
                               <span className="font-bold block text-[10px] uppercase opacity-50 mb-1 md:hidden">Audio / VO</span>
                               {segment.audio}
                            </div>
                         </div>
                       ))}
                    </div>
                </div>
             )}

             {/* 3. Social Manager Output */}
             {toolType === 'social-manager' && (
               <>
                 <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-bk-border-dark relative">
                    <div className="absolute top-4 right-4"><CopyButton text={output.fbCaption || ''} id="fb" /></div>
                    <h3 className="text-xs font-bold text-blue-600 mb-3 flex items-center gap-2"><Share2 size={14} /> Facebook Caption</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{output.fbCaption}</p>
                 </div>
                 <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-bk-border-dark relative">
                    <div className="absolute top-4 right-4"><CopyButton text={output.twitterThread || ''} id="tw" /></div>
                    <h3 className="text-xs font-bold text-sky-500 mb-3 flex items-center gap-2"><Hash size={14} /> Twitter / X</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{output.twitterThread}</p>
                 </div>
                 {output.tags && output.tags.length > 0 && (
                   <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-bk-border-dark">
                      <div className="flex justify-between items-center mb-3">
                         <h3 className="text-xs font-bold text-gray-400 uppercase">Tags</h3>
                         <CopyButton text={output.tags.join(' ')} id="tags" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {output.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-md text-xs text-gray-600 dark:text-gray-400 font-mono">
                            {tag}
                          </span>
                        ))}
                      </div>
                   </div>
                 )}
               </>
             )}

             {/* 4. Headline Generator Output */}
             {toolType === 'headline-generator' && output.headlines && (
               <div className="bg-bk-surface-light dark:bg-bk-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark overflow-hidden">
                 <div className="p-4 border-b border-gray-100 dark:border-bk-border-dark bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Type size={16} /> ৫ ধরণের হেডলাইন</h3>
                    <CopyButton text={output.headlines.map(h => `${h.style}: ${h.text}`).join('\n')} id="headlines" />
                 </div>
                 <div className="divide-y divide-gray-100 dark:divide-bk-border-dark">
                    {output.headlines.map((item, idx) => (
                      <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group relative">
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={item.text} id={`hl-${idx}`} />
                         </div>
                         <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 mb-1">
                           {item.style}
                         </span>
                         <p className="text-lg font-bold text-gray-800 dark:text-gray-100 font-bengali leading-snug pr-12">
                           {item.text}
                         </p>
                      </div>
                    ))}
                 </div>
               </div>
             )}

             {/* 5. Thumbnail Prompter Output */}
             {toolType === 'thumbnail-prompter' && output.prompts && (
               <div className="space-y-3">
                  {output.prompts.map((prompt, idx) => (
                    <div key={idx} className="bg-bk-surface-light dark:bg-bk-surface-dark p-4 rounded-xl border border-gray-100 dark:border-bk-border-dark relative group hover:border-orange-500/50 transition-colors">
                       <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         <CopyButton text={prompt} id={`pmt-${idx}`} />
                       </div>
                       <div className="flex gap-3">
                          <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 font-mono leading-relaxed pr-8">
                            {prompt}
                          </p>
                       </div>
                    </div>
                  ))}
               </div>
             )}

             {/* 6. Interview Prep Output */}
             {toolType === 'interview-prep' && output.questions && (
               <div className="bg-bk-surface-light dark:bg-bk-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-bk-border-dark overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-bk-border-dark flex justify-between items-center bg-teal-50/50 dark:bg-teal-900/10">
                     <h3 className="font-bold text-teal-800 dark:text-teal-400 flex items-center gap-2"><Mic2 size={16} /> ইন্টারভিউ প্রশ্নমালা</h3>
                     <CopyButton text={output.questions.map(q => `[${q.category}] ${q.question}`).join('\n')} id="questions" />
                  </div>
                  <div className="p-2 space-y-2">
                    {output.questions.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-teal-500/30 transition-all">
                         <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block mb-1">
                           {q.category}
                         </span>
                         <p className="text-gray-800 dark:text-gray-200 font-medium">
                           {q.question}
                         </p>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {/* 7. Ticker Writer Output */}
             {toolType === 'ticker-writer' && output.tickers && (
               <div className="bg-black text-white p-6 rounded-2xl shadow-lg border-2 border-gray-800 relative overflow-hidden">
                  <div className="absolute top-4 right-4"><CopyButton text={output.tickers.join(' | ')} id="ticker" /></div>
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2 animate-pulse">
                     <div className="w-2 h-2 rounded-full bg-red-500"></div> লাইভ স্ক্রল প্রিভিউ
                  </h3>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 mb-4 overflow-hidden whitespace-nowrap">
                     <div className="animate-marquee inline-block">
                        {output.tickers.map((t, i) => (
                           <span key={i} className="mx-4 text-xl font-bold text-yellow-400 font-bengali">
                              • {t}
                           </span>
                        ))}
                     </div>
                  </div>
                  <div className="grid gap-2">
                     {output.tickers.map((t, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-gray-400 font-mono">
                           <span className="text-gray-600">{(i+1).toString().padStart(2,'0')}</span>
                           <span className="text-gray-300">{t}</span>
                        </div>
                     ))}
                  </div>
               </div>
             )}

             {/* 8. SEO Optimizer Output */}
             {toolType === 'seo-optimizer' && output.seo && (
               <div className="space-y-4">
                  <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-bk-border-dark">
                     <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">গুগল সার্চ প্রিভিউ</h3>
                     <div className="font-sans">
                        <div className="text-sm text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                           <span>example.com › news</span>
                        </div>
                        <h4 className="text-xl text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mb-1 line-clamp-1">
                           {output.seo.metaTitle}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                           {output.seo.metaDescription}
                        </p>
                     </div>
                     <div className="mt-4 pt-4 border-t border-gray-100 dark:border-bk-border-dark flex justify-end gap-2">
                        <CopyButton text={output.seo.metaTitle} id="seo-title" />
                        <CopyButton text={output.seo.metaDescription} id="seo-desc" />
                     </div>
                  </div>

                  <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-bk-border-dark">
                     <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Focus Keyphrase</h3>
                        <CopyButton text={output.seo.focusKeyphrase} id="seo-key" />
                     </div>
                     <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg text-green-800 dark:text-green-300 font-bold text-center border border-green-100 dark:border-green-900/30">
                        {output.seo.focusKeyphrase}
                     </div>
                  </div>

                  {output.seo.keywords && (
                     <div className="bg-bk-surface-light dark:bg-bk-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-bk-border-dark">
                        <div className="flex justify-between items-center mb-3">
                           <h3 className="text-xs font-bold text-gray-400 uppercase">LSI Keywords & Tags</h3>
                           <CopyButton text={output.seo.keywords.join(', ')} id="seo-tags" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {output.seo.keywords.map((k, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                                 {k}
                              </span>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
             )}

           </div>
         ) : (
           // Empty State
           <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-bk-border-dark text-center p-8">
              <div className={`p-4 rounded-full bg-white dark:bg-bk-surface-dark shadow-sm mb-4 ${config.color}`}>
                 <config.icon size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">ফলাফল এখানে দেখা যাবে</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 max-w-xs">
                বাম পাশের বক্সে আপনার টেক্সট দিন এবং জেনারেট বাটনে ক্লিক করুন।
              </p>
           </div>
         )}
      </div>
    </div>
  );
};

export default TextToolGenerator;
