import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../services/api';
import { Globe, Loader2 } from 'lucide-react';

interface TranslatedTextProps {
  text: string;
  originalLanguage?: string;
  className?: string;
}

// Module-level in-memory cache to prevent redundant HTTP requests across mounts/renders
const clientTranslationCache = new Map<string, string>();

// Instant dictionary for high-frequency civic infrastructure seed phrases
const INSTANT_PHRASES: Record<string, Record<string, string>> = {
  // Project 1
  'Sub-base gravel compaction and drainage trenching': {
    ta: 'அடிமட்ட சரளை சுருக்கம் மற்றும் வடிகால் பள்ளம் அமைத்தல்',
    hi: 'सब-बेस बजरी संघनन और जल निकासी खाई निर्माण',
    ml: 'സബ്-ബേസ് ചരൽ കോംപാക്ഷനും ഡ്രെയിനേജ് ട്രെഞ്ചും',
    te: 'సబ్-బేస్ కంకర సంపీడనం మరియు డ్రైనేజీ కందకాలు',
    kn: 'ಉಪ-ತಳ ಜಲ್ಲಿಕಲ್ಲು ಸಾಂದ್ರತೆ ಮತ್ತು ಚರಂಡಿ ತೋಡು ನಿರ್ಮಾಣ',
  },
  'Dense Bituminous Macadam (DBM) layer 75mm': {
    ta: 'அடர்ந்த தார் மெக்கடாம் (DBM) அடுக்கு 75மிமீ',
    hi: 'सघन बिटुमिनस मैकाडैम (DBM) परत 75मिमी',
    ml: 'ഡെൻസ് ബിറ്റുമിനസ് മക്കാഡം (DBM) പാളി 75 മി.മീ',
    te: 'సాంద్రమైన బిటుమినస్ మెకాడమ్ (DBM) పొర 75మి.మీ',
    kn: 'ಸಾಂದ್ರವಾದ ಬಿಟುಮಿನಸ್ ಮೆಕಾಡಮ್ (DBM) ಪದರ 75ಮಿ.ಮೀ',
  },
  'Bituminous Concrete (BC) wearing course 40mm and road marking': {
    ta: 'தார் கான்கிரீட் (BC) மேல் பூச்சு 40மிமீ மற்றும் சாலைக் குறியீடுகள்',
    hi: 'बिटुमिनस कंक्रीट (BC) ऊपरी परत 40मिमी और सड़क अंकन',
    ml: 'ബിറ്റുമിനസ് കോൺക്രീറ്റ് (BC) വെയറിംഗ് കോഴ്സ് 40 മി.മീ ഒപ്പം റോഡ് അടയാളപ്പെടുത്തലും',
    te: 'బిటుమినస్ కాంక్రీట్ (BC) పై పొర 40మి.మీ మరియు రహదారి గుర్తులు',
    kn: 'ಬಿಟುಮಿನಸ್ ಕಾಂಕ್ರೀಟ್ (BC) ಮೇಲ್ಪದರ 40ಮಿ.ಮೀ ಮತ್ತು ರಸ್ತೆ ಗುರುತುಗಳು',
  },
  'Initial Execution': {
    ta: 'ஆரம்பக் கட்டப் பணி',
    hi: 'प्रारंभिक निष्पादन',
    ml: 'പ്രാരംഭ നിർവ്വഹണം',
    te: 'ప్రారంభ అమలు',
    kn: 'ಆರಂಭಿಕ ಅನುಷ್ಠಾನ',
  },
  'Site preparation and material mobilization': {
    ta: 'களத் தயாரிப்பு மற்றும் கட்டுமானப் பொருள் திரட்டுதல்',
    hi: 'कार्यस्थल तैयारी और निर्माण सामग्री संग्रहण',
    ml: 'സൈറ്റ് ഒരുക്കലും സാമഗ്രികൾ എത്തിക്കലും',
    te: 'సైట్ తయారీ మరియు సామాగ్రి సమీకరణ',
    kn: 'ಸ್ಥಳ ಸಿದ್ಧತೆ ಮತ್ತು ಸಾಮಗ್ರಿಗಳ ಕ್ರೋಢೀಕರಣ',
  },
  'Damaged road with deep potholes causing accidents': {
    ta: 'விபத்துக்களை ஏற்படுத்தும் ஆழமான குழிகளுடன் சேதமடைந்த சாலை',
    hi: 'दुर्घटनाओं का कारण बनने वाले गहरे गड्ढों वाली क्षतिग्रस्त सड़क',
    ml: 'അപകടങ്ങൾ ഉണ്ടാക്കുന്ന ആഴത്തിലുള്ള കുഴികളുള്ള തകർന്ന റോഡ്',
    te: 'ప్రమాదాలకు కారణమవుతున్న లోతైన గుంతలతో పాడైన రహదారి',
    kn: 'ಅಪಘಾತಗಳಿಗೆ ಕಾರಣವಾಗುವ ಆಳವಾದ ಗುಂಡಿಗಳನ್ನು ಹೊಂದಿರುವ ಹಾನಿಗೊಳಗಾದ ರಸ್ತೆ',
  },
  'Comprehensive restorative civil re-engineering and surface pavement rehabilitation.': {
    ta: 'விரிவான சிவில் மறுசீரமைப்பு மற்றும் சாலை மேற்பரப்பு புதுப்பித்தல் பணி.',
    hi: 'व्यापक पुनर्स्थापनात्मक सिविल री-इंजीनियरिंग और सड़क सतह पुनर्वास।',
    ml: 'സമഗ്രമായ സിവിൽ പുനർനിർമ്മാണവും റോഡ് ഉപരിതല പുനരുദ്ധാരണവും.',
    te: 'సమగ్ర పునరుద్ధరణ సివిల్ రీ-ఇంజనీరింగ్ మరియు రోడ్డు ఉపరితల పునరుద్ధరణ.',
    kn: 'ಸಮಗ್ರ ಪುನರುತ್ಥಾನ ಸಿವಿಲ್ ಮರು-ಎಂಜಿನಿಯರಿಂಗ್ ಮತ್ತು ರಸ್ತೆ ಮೇಲ್ಮೈ ಪುನರ್ವಸತಿ.',
  },
  'Official site inspection confirms AI discrepancy analysis. Core compaction density or layer finishing does not satisfy PWD IRC criteria. Remediation mandated.': {
    ta: 'உத்தியோகபூர்வ கள ஆய்வு AI முரண்பாட்டு பகுப்பாய்வை உறுதி செய்கிறது. சுருக்க அடர்த்தி அல்லது தார் பூச்சு PWD IRC அளவுகோல்களை பூர்த்தி செய்யவில்லை. திருத்தப்பணி கட்டாயமாக்கப்பட்டுள்ளது.',
    hi: 'आधिकारिक साइट निरीक्षण एआई विसंगति विश्लेषण की पुष्टि करता है। संघनन घनत्व या परत परिष्करण पीडब्ल्यूडी आईआरसी मानदंडों को पूरा नहीं करता है। सुधार अनिवार्य किया गया है।',
    ml: 'ഔദ്യോഗിക സൈറ്റ് പരിശോധന AI വൈരുദ്ധ്യ വിശകലനം സ്ഥിരീകരിക്കുന്നു. സാന്ദ്രതയോ ലെയർ ഫിനിഷിംഗോ PWD IRC മാനദണ്ഡങ്ങൾ പാലിക്കുന്നില്ല. പുനർനിർമ്മാണം നിർബന്ധമാക്കി.',
    te: 'అధికారిక సైట్ తనిఖీ AI వ్యత్యాస విశ్లేషణను నిర్ధారిస్తుంది. కోర్ సాంద్రత లేదా లేయర్ ఫినిషింగ్ PWD IRC ప్రమాణాలను అందుకోలేదు. నివారణ చర్య తప్పనిసరి చేయబడింది.',
    kn: 'ಅಧಿಕೃತ ಸ್ಥಳ ಪರಿಶೀಲನೆಯು AI ವ್ಯತ್ಯಾಸ ವಿಶ್ಲೇಷಣೆಯನ್ನು ದೃಢೀಕರಿಸುತ್ತದೆ. ಸಾಂದ್ರತೆ ಅಥವಾ ಪದರದ ಮುಕ್ತಾಯವು PWD IRC ಮಾನದಂಡಗಳನ್ನು ಪೂರೈಸುವುದಿಲ್ಲ. ಪರಿಹಾರ ಕಡ್ಡಾಯಗೊಳಿಸಲಾಗಿದೆ.',
  },
  'Visual inspection, core compaction test reports, and site geometry satisfy PWD engineering quality specifications': {
    ta: 'நேரடி ஆய்வு, சுருக்க சோதனை அறிக்கைகள் மற்றும் தள வடிவமைப்பு PWD தரக் கட்டுப்பாட்டு விவரக்குறிப்புகளை பூர்த்தி செய்கின்றன',
    hi: 'प्रत्यक्ष निरीक्षण, कोर संघनन परीक्षण रिपोर्ट और स्थल ज्यामिति पीडब्ल्यूडी इंजीनियरिंग गुणवत्ता विनिर्देशों को पूरा करते हैं',
    ml: 'നേരിട്ടുള്ള പരിശോധന, കോർ ടെസ്റ്റ് റിപ്പോർട്ടുകൾ, സൈറ്റ് അളവുകൾ എന്നിവ PWD എഞ്ചിനീയറിംഗ് ഗുണനിലവാര മാനദണ്ഡങ്ങൾ പാലിക്കുന്നു',
    te: 'దృశ్య తనిఖీ, కోర్ కాంపాక్షన్ పరీక్ష నివేదికలు మరియు సైట్ జ్యామితి PWD ఇంజనీరింగ్ నాణ್ಯతా ప్రమాణాలను సంతృప్తిపరుస్తాయి',
    kn: 'ದೃಶ್ಯ ತಪಾಸಣೆ, ಪರೀಕ್ಷಾ ವರದಿಗಳು ಮತ್ತು ಸ್ಥಳದ ಜ್ಯಾಮಿತಿಯು PWD ಎಂಜಿನಿಯರಿಂಗ್ ಗುಣಮಟ್ಟದ ವಿಶೇಷಣಗಳನ್ನು ತೃಪ್ತಿಪಡಿಸುತ್ತದೆ',
  },
};

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  originalLanguage = 'en',
  className = '',
}) => {
  const { language: currentLang } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string>('');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const normalizeLangCode = (lang: string): string => {
    const l = (lang || '').toLowerCase().trim();
    if (l.includes('ta') || l.includes('tamil') || l.includes('தமிழ்')) return 'ta';
    if (l.includes('hi') || l.includes('hindi') || l.includes('हिन्दी')) return 'hi';
    if (l.includes('ml') || l.includes('malayalam') || l.includes('മലയാളം')) return 'ml';
    if (l.includes('te') || l.includes('telugu') || l.includes('తెలుగు')) return 'te';
    if (l.includes('kn') || l.includes('kannada') || l.includes('ಕನ್ನಡ')) return 'kn';
    return 'en';
  };

  const autoDetectLangCode = (str: string, providedLang?: string): string => {
    if (providedLang && providedLang !== 'en' && providedLang !== 'English') {
      const norm = normalizeLangCode(providedLang);
      if (norm !== 'en') return norm;
    }
    if (!str) return 'en';
    if (/[\u0B80-\u0BFF]/.test(str)) return 'ta';
    if (/[\u0900-\u097F]/.test(str)) return 'hi';
    if (/[\u0D00-\u0D7F]/.test(str)) return 'ml';
    if (/[\u0C00-\u0C7F]/.test(str)) return 'te';
    if (/[\u0C80-\u0CFF]/.test(str)) return 'kn';
    return normalizeLangCode(providedLang || 'en');
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

  const origNormalized = autoDetectLangCode(text, originalLanguage);
  const destNormalized = normalizeLangCode(currentLang);

  useEffect(() => {
    if (origNormalized === destNormalized || !text?.trim()) {
      setTranslatedText('');
      return;
    }

    const trimmedText = text.trim();

    // 1. Check instant phrase dictionary
    if (INSTANT_PHRASES[trimmedText]?.[destNormalized]) {
      setTranslatedText(INSTANT_PHRASES[trimmedText][destNormalized]);
      setIsLoading(false);
      return;
    }

    // Check partial phrase match
    for (const [phrase, transMap] of Object.entries(INSTANT_PHRASES)) {
      if (trimmedText.startsWith(phrase) && transMap[destNormalized]) {
        setTranslatedText(transMap[destNormalized]);
        setIsLoading(false);
        return;
      }
    }

    // 2. Check module cache
    const cacheKey = `${trimmedText}_${destNormalized}`;
    if (clientTranslationCache.has(cacheKey)) {
      const cached = clientTranslationCache.get(cacheKey)!;
      if (cached && cached !== trimmedText) {
        setTranslatedText(cached);
        setIsLoading(false);
        return;
      }
    }

    // 3. Dynamic API Translation
    let isMounted = true;
    const fetchTranslation = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.translateText(trimmedText, destNormalized);
        if (isMounted) {
          const resultText = res.text || trimmedText;
          if (resultText && resultText !== trimmedText) {
            clientTranslationCache.set(cacheKey, resultText);
            setTranslatedText(resultText);
          } else {
            // If server returned original text due to cooldown or no change
            setTranslatedText(resultText);
          }
        }
      } catch (err) {
        console.warn('Failed to translate content:', err);
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

  // When viewing original or identical language
  if (origNormalized === destNormalized || showOriginal) {
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

  // When loading dynamic translation
  if (isLoading && !translatedText) {
    return (
      <div className={className}>
        <div className="flex items-center gap-1.5 text-slate-400 text-xs py-0.5 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin text-emerald-600 shrink-0" />
          <span className="italic text-[11px] truncate">
            {text.slice(0, 30)}... ({getLanguageNameInNative(destNormalized)})
          </span>
        </div>
      </div>
    );
  }

  const displayText = translatedText || text;

  return (
    <div className={className}>
      <p className="whitespace-pre-line">{displayText}</p>
      {translatedText && translatedText !== text && (
        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
          <Globe className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{getLanguageNameInNative(destNormalized)}</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setShowOriginal(true)}
            className="text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
          >
            Original
          </button>
        </div>
      )}
    </div>
  );
};
