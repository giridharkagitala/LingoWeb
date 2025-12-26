
import { GoogleGenAI } from "@google/genai";

export class TranslationService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async translateWebpage(html: string, targetLanguage: string): Promise<string> {
    try {
      // Use gemini-3-flash-preview for fast translation with high context
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          Translate the following web content into ${targetLanguage}. 
          IMPORTANT INSTRUCTIONS:
          1. Keep the HTML tags exactly as they are. 
          2. Only translate the human-readable text inside the tags.
          3. Do not translate code blocks, script contents, or technical attributes (like IDs, classes, URLs).
          4. Return ONLY the translated HTML content. No explanations.
          5. Ensure the resulting HTML is valid.

          CONTENT TO TRANSLATE:
          ${html.substring(0, 15000)} 
        `,
        config: {
          temperature: 0.1, // Lower temperature for more accurate translation
        }
      });

      return response.text || "Translation failed.";
    } catch (error) {
      console.error("Gemini Translation Error:", error);
      throw new Error("Failed to translate page content.");
    }
  }

  async detectLanguage(text: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Detect the language of the following text and return ONLY the language name: "${text.substring(0, 500)}"`,
    });
    return response.text?.trim() || "Unknown";
  }
}

export const translationService = new TranslationService();
