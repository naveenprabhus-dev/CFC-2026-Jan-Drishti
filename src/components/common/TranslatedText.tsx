import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../services/api';
import { Globe, Loader2 } from 'lucide-react';

interface TranslatedTextProps {
  text: string;
  originalLanguage?: string; // e.g. "ta", "Tamil", "English", "en"
  className?: string;
}

// Module-level in-memory cache to prevent redundant HTTP requests across mounts/renders
const clientTranslationCache = new Map<string, string>();

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  originalLanguage = 'en',
  className = '',
}) => {
  const { language: currentLang } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string>('');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Normalize language codes / names to standard en, ta, hi, ml, te, kn
  const normalizeLangCode = (lang: string): string => {
    const l = (lang || '').toLowerCase();
    if (l === 'tamil' || l === 'ta') return 'ta';
    if (l === 'hindi' || l === 'hi') return 'hi';
    if (l === 'malayalam' || l === 'ml') return 'ml';
    if (l === 'telugu' || l === 'te') return 'te';
    if (l === 'kannada' || l === 'kn') return 'kn';
    return 'en';
  };

  const getLanguageNameInNative = (langCode: string): string => {
    switch (langCode) {
      case 'ta': return 'தமிழ்';
      case 'hi': return 'हिन्दी';
      case 'ml': return 'മലയാളം';
      case 'te': return 'తెలుగు';
      case 'kn': return 'ಕನ್ನಡ';
      default: return 'English';
    }
  };

  const origNormalized = normalizeLangCode(originalLanguage);
  const destNormalized = normalizeLangCode(currentLang);

  useEffect(() => {
    if (origNormalized === destNormalized || !text?.trim()) {
      setTranslatedText('');
      return;
    }

    const cacheKey = `${text.trim()}_${destNormalized}`;
    if (clientTranslationCache.has(cacheKey)) {
      setTranslatedText(clientTranslationCache.get(cacheKey)!);
      return;
    }

    let isMounted = true;
    const fetchTranslation = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.translateText(text, destNormalized);
        if (isMounted) {
          const resultText = res.text || text;
          clientTranslationCache.set(cacheKey, resultText);
          setTranslatedText(resultText);
        }
      } catch (err) {
        console.warn('Failed to translate content:', err);
        // Cache fallback so we do not repeatedly slam the endpoint
        clientTranslationCache.set(cacheKey, text);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTranslation();

    return () => {
      isMounted = false;
    };
  }, [text, destNormalized, origNormalized]);

  if (origNormalized === destNormalized || !translatedText || showOriginal) {
    return (
      <div className={className}>
        <p className="whitespace-pre-line">{text}</p>
        {translatedText && showOriginal && (
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOriginal(false)}
              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
            >
              Show Translation ({getLanguageNameInNative(destNormalized)})
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400 py-1 text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="italic">Translating to {getLanguageNameInNative(destNormalized)}...</span>
        </div>
      ) : (
        <div>
          <p className="whitespace-pre-line text-slate-800">{translatedText}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Translated from {getLanguageNameInNative(origNormalized)}</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowOriginal(true)}
              className="text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
            >
              View Original
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
