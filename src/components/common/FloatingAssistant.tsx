import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../services/api';
import {
  MessageSquare,
  X,
  Minus,
  Maximize2,
  Send,
  Loader2,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Globe,
  ChevronDown,
} from 'lucide-react';

interface FloatingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  actions?: Array<{ label: string; target: string }>;
  timestamp: string;
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({ isOpen, onClose }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { language: appLanguage, t } = useLanguage();

  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Dedicated assistant display language override
  const [assistantLanguage, setAssistantLanguage] = useState<string>(appLanguage);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synced assistant language to app language initially
  useEffect(() => {
    setAssistantLanguage(appLanguage);
  }, [appLanguage]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMinimized]);

  if (!isOpen) return null;

  const role = currentUser?.role || 'PUBLIC_VIEWER';
  const name = currentUser?.name || 'Guest User';

  // Context-specific suggestions
  const getSuggestedQuestions = () => {
    switch (role) {
      case 'CITIZEN':
        return [
          { q: 'What is a Work Token?', label: 'What is a Work Token?' },
          { q: 'How do I report an issue?', label: 'How do I report an issue?' },
          { q: 'How do I submit an observation?', label: 'Submit observation' },
          { q: 'What is public transparency?', label: 'Public transparency' },
        ];
      case 'OFFICIAL':
        return [
          { q: 'What is administrative triage?', label: 'What is Triage?' },
          { q: 'How do I issue a Work Token?', label: 'Issue a Work Token' },
          { q: 'Explain AI discrepancy screening', label: 'AI Discrepancy details' },
        ];
      case 'CONTRACTOR':
        return [
          { q: 'How do I submit milestone evidence?', label: 'Submit Evidence help' },
          { q: 'What should I do if rework is required?', label: 'Rework guide' },
        ];
      case 'NGO':
        return [
          { q: 'How do I perform a ground truth audit?', label: 'NGO auditing help' },
          { q: 'How do I submit NGO evidence?', label: 'Submit NGO evidence' },
        ];
      case 'POLICYMAKER':
        return [
          { q: 'Show strategic capital funding summary', label: 'Strategic Funding' },
          { q: 'What are the main service gaps?', label: 'Service Gaps summary' },
        ];
      case 'PUBLIC_VIEWER':
      default:
        return [
          { q: 'What is CFC-2026?', label: 'About CFC-2026' },
          { q: 'How can I view funding expenditure?', label: 'Funding audit' },
          { q: 'Are citizen reports public?', label: 'Public citizen reports' },
        ];
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputInputText('');
    setIsLoading(true);
    setErrorText(null);

    try {
      // Map message history to gemini format
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await apiClient.queryAssistant({
        query: text,
        currentRoute: window.location.pathname + window.location.hash,
        selectedLanguage: appLanguage,
        assistantLanguage,
        conversationHistory: history,
      });

      const modelMessage: ChatMessage = {
        id: `msg-${Date.now()}-m`,
        role: 'model',
        text: res.text,
        actions: res.actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Failed to get answer from assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (target: string) => {
    if (!target) return;

    // Dispatch global navigate event
    if (target === 'TRANSPARENCY') {
      window.dispatchEvent(new CustomEvent('cfc-navigate-transparency'));
    } else {
      window.dispatchEvent(new CustomEvent('cfc-navigate', { detail: target }));
    }

    // Optionally minimize assistant so user can see the navigated screen
    setIsMinimized(true);
  };

  const languages = [
    { code: 'en', nativeName: 'English' },
    { code: 'ta', nativeName: 'தமிழ் (Tamil)' },
    { code: 'hi', nativeName: 'हिन्दी (Hindi)' },
    { code: 'ml', nativeName: 'മലയാളം (Malayalam)' },
    { code: 'te', nativeName: 'తెలుగు (Telugu)' },
    { code: 'kn', nativeName: 'ಕನ್ನಡ (Kannada)' },
  ];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col transition-all duration-300 ${
        isMinimized
          ? 'w-72 h-14 overflow-hidden border-emerald-500 shadow-lg'
          : 'w-[370px] sm:w-[410px] h-[550px] max-h-[85vh]'
      }`}
    >
      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 to-slate-950 text-white px-4 py-3 flex items-center justify-between shrink-0 select-none rounded-t-2xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-sm text-white animate-pulse shrink-0">
            ✦
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[13px] tracking-tight">Gemini Civic Assistant</span>
              <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 py-0.5 rounded uppercase">
                AI Assist
              </span>
            </div>
            {!isMinimized && (
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                CFC-2026 Platform Explainer & Guide
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Minimize button */}
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-rose-400 cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className="flex-1 px-4 flex items-center justify-between text-xs text-slate-500 font-medium hover:bg-slate-50 cursor-pointer"
        >
          <span>Chat minimized. Click to resume.</span>
          <MessageSquare className="w-4 h-4 text-emerald-500" />
        </div>
      )}

      {/* Main Assistant Body */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
          {/* Language Selector inside Assistant */}
          <div className="bg-white border-b border-slate-100 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span className="font-semibold">Assistant Language:</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-1 px-2 py-1 font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition cursor-pointer"
              >
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>{languages.find((l) => l.code === assistantLanguage)?.nativeName || 'English'}</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {showLanguageDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 space-y-0.5">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setAssistantLanguage(l.code);
                        setShowLanguageDropdown(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                        assistantLanguage === l.code
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {l.nativeName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4 py-2">
                {/* Intro message */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-sm mb-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-spin-slow" />
                    <span>How can I help you, {name}?</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    I can explain CFC-2026 features (like Work Tokens, physical evidence, independent audits, or human governance) or navigate you directly to your desired workspace page.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    Active Role: <span className="font-bold text-slate-600">{role}</span>
                  </p>
                </div>

                {/* Suggestions header */}
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Suggested Topics
                </div>

                {/* Suggestions Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {getSuggestedQuestions().map((sq, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(sq.q)}
                      className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 hover:border-emerald-300 text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center justify-between group shadow-2xs"
                    >
                      <span>{sq.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Avatar / Name label */}
                  <span className="text-[9px] text-slate-400 font-bold mb-1 px-1 uppercase font-mono">
                    {m.role === 'user' ? name : '✦ Gemini Civic Assistant'}
                  </span>

                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-3xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {/* Navigation Buttons inside bubble response */}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                        {m.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => handleActionClick(act.target)}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 hover:border-emerald-300 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[8px] text-slate-400 mt-1 px-1 font-mono">{m.timestamp}</span>
                </div>
              ))
            )}

            {/* Loading bubble */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <span className="text-[9px] text-slate-400 font-bold mb-1 px-1 uppercase font-mono">
                  ✦ Gemini Civic Assistant
                </span>
                <div className="bg-white border border-slate-100 text-slate-600 rounded-2xl rounded-tl-none px-4 py-3 shadow-3xs text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>AI reasoning...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorText && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl p-3 shadow-3xs">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Error Response
                </p>
                <p className="mt-1 leading-relaxed">{errorText}</p>
                <button
                  type="button"
                  onClick={() => handleSend(messages[messages.length - 1]?.text || 'CFC-2026')}
                  className="mt-2 text-[10px] font-bold text-rose-700 underline cursor-pointer"
                >
                  Retry Request
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="p-3 border-t border-slate-200/80 bg-white rounded-b-2xl flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputInputText(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-xs"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
