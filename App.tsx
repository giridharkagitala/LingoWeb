
import React, { useState, useCallback, useEffect } from 'react';
import { translationService } from './services/geminiService';
import { LANGUAGES, Language } from './types';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[0]); // Default Telugu
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [translatedHtml, setTranslatedHtml] = useState<string | null>(null);
  const [originalHtml, setOriginalHtml] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'full'>('split');

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setTranslatedHtml(null);
    setOriginalHtml(null);
    setStatusMessage('Fetching webpage content...');

    try {
      // Using a CORS proxy to fetch page content since browsers block cross-origin requests
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const fetchResponse = await fetch(proxyUrl);
      const data = await fetchResponse.json();
      
      if (!data.contents) {
        throw new Error("Could not retrieve content from the URL.");
      }

      setStatusMessage('Analyzing and translating page content...');
      
      // Basic cleaning to prevent Gemini from getting overwhelmed by JS/CSS
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      // Remove scripts and unnecessary styles for the translation process
      doc.querySelectorAll('script, style, iframe, noscript').forEach(el => el.remove());
      
      const cleanHtml = doc.body.innerHTML;
      setOriginalHtml(cleanHtml);

      const translated = await translationService.translateWebpage(cleanHtml, targetLang.name);
      setTranslatedHtml(translated);
      setStatusMessage('');
    } catch (error: any) {
      console.error(error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">LingoWeb</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">AI Page Translator</p>
          </div>
        </div>

        <form onSubmit={handleTranslate} className="flex-1 max-w-2xl w-full flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              type="url"
              placeholder="Paste any website URL (e.g. https://example.com)"
              className="w-full pl-4 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm transition-all outline-none"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <select
              className="bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              value={targetLang.code}
              onChange={(e) => {
                const lang = LANGUAGES.find(l => l.code === e.target.value);
                if (lang) setTargetLang(lang);
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.native})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Translate'}
            </button>
          </div>
        </form>

        <div className="hidden lg:flex items-center gap-2">
          <button 
            onClick={() => setViewMode('split')}
            className={`p-2 rounded-md ${viewMode === 'split' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}`}
            title="Split View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>
          </button>
          <button 
            onClick={() => setViewMode('full')}
            className={`p-2 rounded-md ${viewMode === 'full' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}`}
            title="Full Translation View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
        {statusMessage && (
          <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 relative mb-4">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Patience is a Virtue</h3>
            <p className="text-slate-600 max-w-md animate-pulse">{statusMessage}</p>
          </div>
        )}

        {!translatedHtml && !isLoading && !statusMessage && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-2xl">
              <div className="mb-6 inline-block p-4 bg-indigo-50 rounded-full">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Transform the Web</h2>
              <p className="text-slate-600 mb-8 text-lg">Enter any URL above to translate the entire webpage content into {targetLang.name} using Gemini 3's advanced language model.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="text-indigo-600 font-bold mb-1">Step 1</div>
                  <p className="text-sm text-slate-500">Paste the URL of any English news or article.</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="text-indigo-600 font-bold mb-1">Step 2</div>
                  <p className="text-sm text-slate-500">Select your target language (like Telugu).</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="text-indigo-600 font-bold mb-1">Step 3</div>
                  <p className="text-sm text-slate-500">Read the translated content in its original layout.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {translatedHtml && (
          <div className={`flex-1 flex overflow-hidden ${viewMode === 'split' ? 'flex-row' : 'flex-col'}`}>
            {viewMode === 'split' && (
              <div className="flex-1 flex flex-col border-r border-slate-200">
                <div className="bg-white px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                  <span>Original Content</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">English</span>
                </div>
                <div className="flex-1 overflow-auto p-8 bg-white prose max-w-none custom-scrollbar" dangerouslySetInnerHTML={{ __html: originalHtml || '' }} />
              </div>
            )}
            
            <div className="flex-1 flex flex-col bg-white">
              <div className="bg-white px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                <span>Translated Content</span>
                <span className="bg-indigo-100 px-2 py-0.5 rounded text-indigo-700">{targetLang.name}</span>
              </div>
              <div className="flex-1 overflow-auto p-8 bg-white prose max-w-none custom-scrollbar" dangerouslySetInnerHTML={{ __html: translatedHtml }} />
            </div>
          </div>
        )}
      </main>

      {/* Footer / Stats Bar */}
      {translatedHtml && (
        <footer className="bg-slate-900 text-slate-400 py-3 px-6 flex justify-between items-center text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Translation Ready
            </span>
            <span>Powered by Gemini 3 Flash</span>
          </div>
          <div className="flex gap-4">
            <button className="hover:text-white transition-colors">Download PDF</button>
            <button className="hover:text-white transition-colors" onClick={() => window.print()}>Print Page</button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
