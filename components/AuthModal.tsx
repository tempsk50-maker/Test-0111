import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, LogIn, Chrome, Loader2, AlertCircle, Smartphone, ArrowRight, CheckCircle2, Copy, ExternalLink, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMethod = 'email' | 'phone';

const ADMIN_SECRET_CODE = 'basherkella24';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, refreshProfile } = useAuth();
  
  // UI State
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);

  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Admin Code State
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setDomainError(null);
      setLoading(false);
      setShowOtpInput(false);
      setOtp('');
      setShowAdminInput(false);
      setAdminCode('');
      // Clean up recaptcha if closed mid-process
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = undefined;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- HELPER: Handle Admin Upgrade ---
  const handleAdminUpgrade = async (uid: string) => {
    if (adminCode === ADMIN_SECRET_CODE) {
      try {
        const userRef = doc(db, 'users', uid);
        // Force update role to admin and status to approved
        await setDoc(userRef, {
          role: 'admin',
          status: 'approved',
          lastLogin: Date.now()
        }, { merge: true });
        console.log("User upgraded to Admin via secret code");
      } catch (e) {
        console.error("Failed to upgrade admin:", e);
      }
    }
  };

  // --- HANDLERS ---

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDomainError(null);
    setLoading(true);

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
      
      // Check for Admin Code and Upgrade if valid
      if (adminCode) {
        if (adminCode === ADMIN_SECRET_CODE) {
           await handleAdminUpgrade(userCredential.user.uid);
        } else {
           // If code is wrong but auth succeeded, we just warn or ignore? 
           // Let's ignore for login flow simplicity, or maybe alert user
           console.warn("Invalid Admin Code provided");
        }
      }

      // Refresh profile in context to reflect role changes immediately
      await refreshProfile();
      onClose();
    } catch (err: any) {
      console.error(err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setDomainError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      // Google sign in doesn't support the custom code flow directly here easily 
      // without modifying the auth provider flow, but we can't inject it mid-popup.
      // So for Google Login, they become user/pending by default unless we add a separate "Claim Admin" step.
      onClose();
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = undefined;
    }

    if (recaptchaRef.current) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
           setError('ReCAPTCHA মেয়াদ শেষ। আবার চেষ্টা করুন।');
           setLoading(false);
        }
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDomainError(null);
    
    if (phone.length < 11) {
      setError("সঠিক ফোন নাম্বার দিন (যেমন: +88017...)");
      return;
    }
    
    setLoading(true);
    
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error("Recaptcha not initialized");

      const formattedPhone = phone.startsWith('+') ? phone : `+880${phone.replace(/^0+/, '')}`; 
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setShowOtpInput(true);
      setError(null);
    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      handleAuthError(err);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch(e) {}
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(otp);
        
        // Check Admin Code
        if (adminCode === ADMIN_SECRET_CODE) {
          await handleAdminUpgrade(result.user.uid);
        }

        await refreshProfile();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError('OTP ভুল হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    const code = err.code;
    const msg = err.message || '';

    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      setDomainError(window.location.hostname);
      setError(null);
    } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      setError('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।');
    } else if (code === 'auth/email-already-in-use') {
      setError('এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট খোলা আছে।');
    } else if (code === 'auth/weak-password') {
      setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
    } else if (code === 'auth/popup-closed-by-user') {
      setError('লগিন পপ-আপটি বন্ধ করা হয়েছে।');
    } else if (code === 'auth/invalid-phone-number') {
      setError('ফোন নাম্বারটি সঠিক নয়।');
    } else if (code === 'auth/too-many-requests') {
      setError('অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।');
    } else if (code === 'auth/captcha-check-failed') {
      setError('ReCAPTCHA ভেরিফিকেশন ব্যর্থ হয়েছে (ডোমেইন পারমিশন চেক করুন)।');
    } else if (code === 'auth/internal-error') {
      setError('সার্ভার এরর। ডোমেইন অথোরাইজেশন বা ইন্টারনেট সংযোগ চেক করুন।');
      if (window.location.hostname !== 'localhost') {
         setDomainError(window.location.hostname);
      }
    } else {
      setError(`সমস্যা হয়েছে: ${code}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-bk-surface-dark w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-gray-200 dark:border-bk-border-dark">
        
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-500 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-2 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              {showOtpInput ? 'যাচাইকরণ' : (isLogin ? 'লগিন করুন' : 'নতুন একাউন্ট')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {showOtpInput ? 'আপনার ফোনে পাঠানো কোডটি লিখুন' : 'নিউজ জেনারেটর এক্সেস করতে'}
            </p>
        </div>

        {/* Domain Error Specific UI */}
        {domainError ? (
           <div className="p-6 pt-2">
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 text-center">
                 <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                    <AlertCircle className="w-6 h-6" />
                 </div>
                 <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">ডোমেইন পারমিশন নেই</h3>
                 <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Firebase Console এ এই ডোমেইনটি যুক্ত করা নেই। লগিন চালু করতে নিচের ডোমেইনটি কপি করে Authorized Domains এ যুক্ত করুন।
                 </p>
                 
                 <div className="flex items-center gap-2 bg-white dark:bg-black/20 p-2 rounded-lg border border-gray-200 dark:border-white/10 mb-3">
                    <code className="flex-1 text-xs font-mono text-gray-800 dark:text-gray-200 truncate text-left">
                       {domainError}
                    </code>
                    <button 
                       onClick={() => navigator.clipboard.writeText(domainError)}
                       className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md text-gray-500"
                       title="Copy"
                    >
                       <Copy className="w-4 h-4" />
                    </button>
                 </div>

                 <a 
                   href="https://console.firebase.google.com/" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                 >
                   Firebase Console এ যান <ExternalLink className="w-3 h-3" />
                 </a>
              </div>
              <button 
                 onClick={() => { setDomainError(null); setError(null); }}
                 className="mt-4 w-full py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10"
              >
                 ফিরে যান
              </button>
           </div>
        ) : (
          <>
            {/* Tabs (Email vs Phone) */}
            {!showOtpInput && (
              <div className="px-6 flex gap-2 mb-4">
                <button
                  onClick={() => { setAuthMethod('email'); setError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${authMethod === 'email' ? 'bg-bk-green text-white border-bk-green' : 'bg-gray-50 dark:bg-white/5 text-gray-500 border-transparent hover:bg-gray-100'}`}
                >
                  <Mail size={14} /> ইমেইল
                </button>
                <button
                  onClick={() => { setAuthMethod('phone'); setError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${authMethod === 'phone' ? 'bg-bk-green text-white border-bk-green' : 'bg-gray-50 dark:bg-white/5 text-gray-500 border-transparent hover:bg-gray-100'}`}
                >
                  <Smartphone size={14} /> মোবাইল
                </button>
              </div>
            )}

            <div className="px-8 pb-6">
                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold flex items-center gap-2 break-all">
                        <AlertCircle size={14} className="shrink-0" /> 
                        <span>{error}</span>
                    </div>
                )}

                {/* --- EMAIL FORM --- */}
                {authMethod === 'email' && !showOtpInput && (
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                      {!isLogin && (
                          <div className="relative">
                              <input 
                                  type="text" 
                                  placeholder="আপনার নাম"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  required
                                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded-xl text-sm focus:border-bk-green outline-none transition-colors dark:text-white"
                              />
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LogIn size={16} /></div>
                          </div>
                      )}

                      <div className="relative">
                          <input 
                              type="email" 
                              placeholder="ইমেইল এড্রেস"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded-xl text-sm focus:border-bk-green outline-none transition-colors dark:text-white"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={16} /></div>
                      </div>
                      
                      <div className="relative">
                          <input 
                              type="password" 
                              placeholder="পাসওয়ার্ড"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded-xl text-sm focus:border-bk-green outline-none transition-colors dark:text-white"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></div>
                      </div>

                      {/* Admin Code Toggle (Shared) */}
                      <div className="pt-1">
                          <button 
                             type="button" 
                             onClick={() => setShowAdminInput(!showAdminInput)}
                             className="text-xs text-bk-green font-bold flex items-center gap-1 hover:underline"
                          >
                             <KeyRound size={12} /> অ্যাডমিন কোড আছে?
                          </button>
                          
                          {showAdminInput && (
                             <div className="mt-2 relative animate-in slide-in-from-top-2">
                                <input 
                                   type="text" 
                                   placeholder="সিক্রেট কোড দিন"
                                   value={adminCode}
                                   onChange={(e) => setAdminCode(e.target.value)}
                                   className="w-full pl-10 pr-4 py-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg text-sm text-yellow-800 dark:text-yellow-500 focus:border-yellow-500 outline-none placeholder:text-yellow-800/50"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-600"><ShieldCheck size={14} /></div>
                             </div>
                          )}
                      </div>

                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-bk-green hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-bk-green/20 transition-colors flex items-center justify-center gap-2 mt-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLogin ? 'লগিন করুন' : 'সাইন আপ'}
                      </button>
                  </form>
                )}

                {/* --- PHONE FORM --- */}
                {authMethod === 'phone' && (
                  <div className="space-y-4">
                    {!showOtpInput ? (
                      <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="relative">
                          <input 
                              type="tel" 
                              placeholder="+88017..." 
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded-xl text-sm focus:border-bk-green outline-none transition-colors dark:text-white font-mono"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Smartphone size={16} /></div>
                        </div>
                        {/* Invisible ReCaptcha Container */}
                        <div ref={recaptchaRef}></div>
                        
                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 bg-bk-green hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-bk-green/20 transition-colors flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                          OTP কোড পাঠান
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="text-center mb-4">
                          <div className="text-sm text-gray-500 mb-2">কোড পাঠানো হয়েছে: <span className="font-mono font-bold text-gray-800 dark:text-white">{phone}</span></div>
                        </div>
                        
                        <input 
                            type="text" 
                            placeholder="123456" 
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full py-3 text-center text-2xl tracking-[0.5em] bg-gray-50 dark:bg-bk-input-dark border border-gray-200 dark:border-bk-border-dark rounded-xl focus:border-bk-green outline-none transition-colors dark:text-white font-mono"
                        />
                        
                        {/* Admin Code Toggle (Shared) */}
                        <div className="pt-1">
                          <button 
                             type="button" 
                             onClick={() => setShowAdminInput(!showAdminInput)}
                             className="text-xs text-bk-green font-bold flex items-center gap-1 hover:underline mx-auto"
                          >
                             <KeyRound size={12} /> অ্যাডমিন কোড ব্যবহার করুন
                          </button>
                          
                          {showAdminInput && (
                             <div className="mt-2 relative animate-in slide-in-from-top-2">
                                <input 
                                   type="text" 
                                   placeholder="সিক্রেট কোড দিন"
                                   value={adminCode}
                                   onChange={(e) => setAdminCode(e.target.value)}
                                   className="w-full pl-10 pr-4 py-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg text-sm text-yellow-800 dark:text-yellow-500 focus:border-yellow-500 outline-none placeholder:text-yellow-800/50"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-600"><ShieldCheck size={14} /></div>
                             </div>
                          )}
                        </div>

                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 bg-bk-green hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-bk-green/20 transition-colors flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          যাচাই করুন
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => setShowOtpInput(false)}
                          className="w-full py-2 text-xs text-gray-500 hover:text-bk-green"
                        >
                          নাম্বার পরিবর্তন করুন
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Social Login Separator */}
                {!showOtpInput && (
                  <>
                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                        <span className="flex-shrink mx-4 text-xs text-gray-400">অথবা</span>
                        <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                    </div>

                    <button 
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-700 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4 text-bk-red" />}
                      Google দিয়ে লগিন
                    </button>
                  </>
                )}

                {/* Footer Text */}
                {!showOtpInput && authMethod === 'email' && (
                  <div className="mt-4 text-center">
                      <button 
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="text-sm text-gray-500 hover:text-bk-green transition-colors"
                      >
                        {isLogin ? 'একাউন্ট নেই? রেজিস্ট্রেশন করুন' : 'ইতিমধ্যে একাউন্ট আছে? লগিন'}
                      </button>
                  </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

export default AuthModal;