
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, CardType, TextToolType, TextToolOutput } from "../types";

const aiClient = (apiKey: string) => new GoogleGenAI({ apiKey });

// --- EXISTING VISUAL CARD GENERATION ---
const processNewsText = async (rawText: string, mode: CardType = 'news'): Promise<GeneratedContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = aiClient(apiKey);
  let systemInstruction = '';
  let schemaDescription = {};

  if (mode === 'quote') {
    systemInstruction = `
      You are a specialized Bengali Editor for Basherkella Quote Cards.
      CRITICAL RULE: ALL OUTPUT MUST BE IN BENGALI LANGUAGE ONLY.
      
      Your Task:
      1. Analyze the input text carefully.
      2. Extract the CORE QUOTE (what the person actually said) translated to or kept in Bengali.
      3. Extract the Speaker's Name and Designation in Bengali.
      
      Output Rules:
      - 'headline': The Quote text itself in Bengali. (Do not add quotation marks).
      - 'body': The Speaker's Name + Designation in Bengali (e.g. "ড. মুহাম্মদ ইউনূস, প্রধান উপদেষ্টা").
      - 'caption': Write a short, engaging social media caption in Bengali (2-3 sentences).
    `;
    schemaDescription = {
      headline: { type: Type.STRING, description: "The direct quote text in Bengali script" },
      body: { type: Type.STRING, description: "Speaker name and designation in Bengali script" },
      caption: { type: Type.STRING, description: "Social media caption in Bengali script" }
    };
  } else {
    systemInstruction = `
      You are a Senior News Editor for a top-tier Bengali News Portal (Basherkella).
      CRITICAL RULE: ALL OUTPUT MUST BE IN BENGALI LANGUAGE ONLY. DO NOT USE ENGLISH WORDS.
      
      Your Goal: 
      1. Create a CATCHY and ATTRACTIVE headline in Bengali.
      2. Write a DETAILED "News Analysis" (নিউজ বিশ্লেষণ) report in Bengali.

      INPUT ANALYSIS RULES:
      - Read the whole text carefully.
      - Extract the core facts.
      - Neutralize any bias.

      OUTPUT FIELDS:
      1. 'headline': 
         - Must be VERY CATCHY and ATTRACTIVE.
         - Max 3 lines visually (approx 5-15 words).
         - Language: Bengali.
      
      2. 'body':
         - Leave empty or max 1 very short sentence in Bengali if context is needed.
      
      3. 'caption':
         - This is the Detailed News Analysis (নিউজ বিশ্লেষণ).
         - Format: Full journalistic report style.
         - Language: Strictly Bengali.
         - Length: Detailed and Long.
    `;
    schemaDescription = {
      headline: { type: Type.STRING, description: "A catchy news headline in Bengali (max 3 lines)" },
      body: { type: Type.STRING, description: "Optional short context in Bengali" },
      caption: { type: Type.STRING, description: "Detailed news analysis/report in Bengali language" }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: rawText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaDescription,
          required: ["headline", "body", "caption"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as GeneratedContent;
  } catch (error) {
    console.error("Error processing text:", error);
    throw error;
  }
};

// --- NEW TEXT TOOL GENERATION ---
const processTextTool = async (rawText: string, tool: TextToolType): Promise<TextToolOutput> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  const ai = aiClient(apiKey);

  let systemInstruction = '';
  let responseSchema: any = {};

  if (tool === 'translator') {
    systemInstruction = `
      You are an expert English-to-Bengali News Translator.
      Convert the input text (English/Banglish) into Standard High-Quality Journalistic Bengali (Prothom Alo/BBC Bangla style).
      - Maintain accuracy but ensure flow is natural.
      - Do not transliterate names unless necessary.
      - 'mainContent': The full translated text.
      - 'notes': Any specific difficult terms you translated or context notes.
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        mainContent: { type: Type.STRING, description: "The professional Bengali translation" },
        notes: { type: Type.STRING, description: "Notes on specific terms or context" }
      },
      required: ["mainContent"]
    };
  } 
  else if (tool === 'proofreader') {
    systemInstruction = `
      You are a Chief Sub-Editor (Magic Editor) for a Bengali News Desk.
      Fix the input text for: Spelling errors, Grammar, Sentence Structure, and Journalistic Tone.
      - 'mainContent': The polished, error-free version of the text.
      - 'notes': List of major corrections made (e.g., "বানান সংশোধন: ...", "বাক্য বিন্যাস পরিবর্তন...").
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        mainContent: { type: Type.STRING, description: "Polished and corrected Bengali text" },
        notes: { type: Type.STRING, description: "Summary of changes made" }
      },
      required: ["mainContent"]
    };
  }
  else if (tool === 'script-writer') {
    systemInstruction = `
      You are a TV News Script Writer. Convert the input news into a video script.
      Structure:
      - 'title': A catchy video title.
      - 'scriptSegments': An array of scenes. Each scene has 'visual' (what to show, B-roll ideas) and 'audio' (what the anchor says).
      Language: Bengali.
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        scriptSegments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              visual: { type: Type.STRING, description: "Visual description/Camera angle/B-roll" },
              audio: { type: Type.STRING, description: "Voiceover text for the anchor" }
            }
          }
        }
      },
      required: ["title", "scriptSegments"]
    };
  }
  else if (tool === 'social-manager') {
    systemInstruction = `
      You are a Senior Social Media Manager. Create engaging content for social platforms based on the news.
      - 'fbCaption': Engaging caption for Facebook with emojis. 
      - 'twitterThread': A short, punchy version for Twitter/X (max 280 chars).
      - 'tags': 10-15 relevant, high-traffic hashtags in Bengali and English.
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        fbCaption: { type: Type.STRING, description: "Facebook post caption" },
        twitterThread: { type: Type.STRING, description: "Twitter post content" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["fbCaption", "twitterThread", "tags"]
    };
  }
  // --- NEW TOOLS IMPLEMENTATION ---
  else if (tool === 'headline-generator') {
    systemInstruction = `
      You are a Viral News Headline Expert.
      Generate 5 different styles of Bengali headlines for the input news.
      Styles needed:
      1. Viral/Clicky (সোশ্যাল মিডিয়ায় যা চলে)
      2. SEO Friendly (সার্চ ইঞ্জিনের জন্য)
      3. Formal/Journalistic (পত্রিকার জন্য)
      4. Emotional (আবেগপূর্ণ)
      5. Question/Mystery (প্রশ্নবোধক)
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        headlines: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING, description: "The style of headline (e.g. Viral, SEO)" },
              text: { type: Type.STRING, description: "The Bengali headline text" }
            }
          }
        }
      },
      required: ["headlines"]
    };
  }
  else if (tool === 'thumbnail-prompter') {
    systemInstruction = `
      You are an AI Art Prompt Engineer for Midjourney and DALL-E.
      Read the news content and generate 4 high-quality, detailed ENGLISH prompts to generate a thumbnail image.
      - Focus on: Lighting, Camera Angle, Mood, Style (Photorealistic, Cinematic, Illustration).
      - DO NOT use text in the image prompts.
      - Output strictly in English.
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        prompts: {
          type: Type.ARRAY,
          items: { type: Type.STRING, description: "Detailed English image prompt" }
        }
      },
      required: ["prompts"]
    };
  }
  else if (tool === 'interview-prep') {
    systemInstruction = `
      You are a Senior Investigative Journalist.
      Based on the topic or person provided, generate a list of interview questions.
      Categorize them:
      1. Ice Breaker (Introduction)
      2. Deep Dive (Core topic)
      3. Controversial/Hard-hitting (Tough questions)
      4. Forward-looking (Future)
      Language: Bengali.
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Category of the question" },
              question: { type: Type.STRING, description: "The question in Bengali" }
            }
          }
        }
      },
      required: ["questions"]
    };
  }
  else if (tool === 'ticker-writer') {
    systemInstruction = `
      You are a TV News Producer.
      Convert the input news into "Ticker/Scroll" format for the bottom of a TV screen.
      - Generate 6-8 very short, punchy sentences.
      - Each sentence must be less than 8 words.
      - Language: Bengali.
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        tickers: {
          type: Type.ARRAY,
          items: { type: Type.STRING, description: "Short ticker text" }
        }
      },
      required: ["tickers"]
    };
  }
  else if (tool === 'seo-optimizer') {
    systemInstruction = `
      You are a SEO Expert for News Websites.
      Optimize the input news for Search Engines (Google).
      Output:
      - 'metaTitle': SEO friendly title (approx 60 chars).
      - 'metaDescription': Engaging description (approx 160 chars).
      - 'focusKeyphrase': The main keyword.
      - 'keywords': List of LSI keywords and tags.
      Language: Bengali (Keywords can be mixed).
    `;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        seo: {
          type: Type.OBJECT,
          properties: {
            metaTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            focusKeyphrase: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
      required: ["seo"]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: rawText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as TextToolOutput;
  } catch (error) {
    console.error("Error processing tool:", error);
    throw error;
  }
}

export { processNewsText, processTextTool };
