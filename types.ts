
export interface NewsData {
  headline: string;
  body: string;
  source?: string;
  caption?: string;
}

// --- VISUAL CARD TEMPLATES ---
export enum CardTemplate {
  QUOTE = 'QUOTE',
  HEADLINE = 'HEADLINE'
}

export interface GeneratedContent {
  headline: string;
  body: string;
  caption?: string;
}

export type CardType = 'news' | 'quote';

// --- USER & ADMIN TYPES ---
export type UserRole = 'admin' | 'editor' | 'user';
export type UserStatus = 'pending' | 'approved' | 'blocked';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  lastLogin: number;
  phone?: string | null;
}

// --- NEW TEXT TOOL TYPES ---
export type TextToolType = 
  | 'translator' 
  | 'proofreader' 
  | 'script-writer' 
  | 'social-manager'
  // NEW TOOLS
  | 'headline-generator'
  | 'thumbnail-prompter'
  | 'interview-prep'
  | 'ticker-writer'
  | 'seo-optimizer';

export interface TextToolOutput {
  // Common
  title?: string;
  
  // Translator & Proofreader
  mainContent?: string; 
  notes?: string;
  
  // Script Writer
  scriptSegments?: Array<{ visual: string; audio: string }>;
  
  // Social Manager
  fbCaption?: string;
  twitterThread?: string;
  tags?: string[];

  // Headline Generator
  headlines?: Array<{ style: string; text: string }>;

  // Thumbnail Prompter
  prompts?: Array<string>;

  // Interview Prep
  questions?: Array<{ category: string; question: string }>;

  // Ticker Writer
  tickers?: Array<string>;

  // SEO Optimizer
  seo?: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    focusKeyphrase: string;
  };
}


export type NewsCardTemplate = 
  // --- CENTERED DESIGNS ---
  | 'bk-classic-center'   // Design 1: White, Centered
  | 'bk-dark-studio'      // Design 2: Dark, Centered
  | 'bk-ruby-prime'       // Design 3: White/Red Accent, Centered
  | 'bk-emerald-slate'    // Design 4: Dark Green/Slate, Centered
  
  // --- PREVIOUS ADDITIONS ---
  | 'bk-crimson-focus'    // Design 5: Deep Red, Centered
  | 'bk-elegant-border'   // Design 6: White with Border, Centered
  | 'bk-midnight-impact'  // Design 7: Deep Blue/Black, Centered

  // --- REBRANDED ADDITIONS ---
  | 'bk-golden-hour'      // Design 8: Royal Green, Centered
  | 'bk-clean-teal'       // Design 9: Clean Green, Centered
  | 'bk-bold-monochrome'  // Design 10: Black/White, High Contrast, Centered

  // --- NEW BRAND FOCUSED ADDITIONS ---
  | 'bk-vibrant-overlay'  // Design 11: Full Image with Green Gradient
  | 'bk-modern-split'     // Design 12: Half Image, Half Solid Green
  | 'bk-red-headline'     // Design 13: White with Thick Red Left Border

  // --- NEW USER REQUESTED DESIGNS (JAMUNA/DAILY CAMPUS STYLE) ---
  | 'bk-focus-red'        // Design 14: Top Image, Bottom Red Solid (Jamuna Style)
  | 'bk-elegant-light'    // Design 15: Header Bar, Image Frame, Light BG (Daily Campus Style)

  // --- NEW PROFESSIONAL PREMIUM DESIGNS ---
  | 'bk-premium-minimal'  // Design 16: Very clean, magazine style
  | 'bk-corporate-dark'   // Design 17: Professional dark mode with geometry

  // --- QUOTE TEMPLATES ---
  | 'bk-quote-modern'
  | 'bk-quote-glass'
  | 'bk-quote-red-classic' // NEW: Based on user reference (Portrait 4:5)
  | 'bk-quote-author-focus' // NEW: Author focus design
  | 'bk-quote-minimal-serif' // NEW: Clean Minimal
  | 'bk-quote-dark-pro'      // NEW: Professional Dark
  | 'bk-quote-image-overlay' // NEW: Full Image Overlay
  | 'bk-quote-impact-yellow' // Bold Dark/Green (Rebranded)
  | 'bk-quote-simple-border' // Classic White with Border
  | 'bk-quote-gradient-flow' // Modern Gradient
  
  // --- NEW SIDEBAR SPLIT DESIGNS ---
  | 'bk-quote-sidebar-green' // Green Sidebar Left
  | 'bk-quote-sidebar-red'   // Red Sidebar Left
  | 'bk-quote-sidebar-right' // Green Sidebar Right (NEW)
  | 'bk-quote-tv-style'      // Bottom Bar TV Style (NEW)
  | 'bk-quote-magazine'      // Magazine Minimal (NEW)
  
  // --- NEWEST ADDITIONS ---
  | 'bk-quote-dynamic-angle'   // Diagonal Shape
  | 'bk-quote-corporate-clean' // Top Header Bar
  | 'bk-quote-outline-pop'     // Dark with Pop-out effect

  // --- NEW PROFESSIONAL BATCH ---
  | 'bk-quote-pro-minimal'    // Clean White Professional
  | 'bk-quote-glass-elegance' // Modern Glass Effect
  | 'bk-quote-brand-focus'    // Brand Identity Heavy

  // --- NEW USER REQUESTED BATCH (IMAGE BASED) ---
  | 'bk-quote-block-red'       // Red Block Left (Reference 1)
  | 'bk-quote-soft-gradient'   // Soft Gradient (Reference 2)
  | 'bk-quote-circle-headline'; // Top Circle (Reference 3)
