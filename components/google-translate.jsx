"use client";

import { useEffect, useState } from 'react';
import { Languages, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const INDIAN_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'en', name: 'English', native: 'English' },
];

const GoogleTranslate = () => {
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    setMounted(true);
    
    // Check existing cookie to set initial state
    const getInitialLang = () => {
      const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
      return match ? match[1] : 'en';
    };
    setCurrentLang(getInitialLang());

    // Initialize Google Translate but don't force a language yet
    if (window.googleTranslateElementInit) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: INDIAN_LANGUAGES.map(l => l.code).join(','),
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    const addScript = () => {
      if (document.querySelector('script[src*="translate.google.com"]')) return;
      const s = document.createElement('script');
      s.setAttribute('src', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
      s.async = true;
      document.body.appendChild(s);
    };

    addScript();
  }, []);

  const handleLanguageSelect = (langCode) => {
    // Set the cookie that Google Translate looks for
    const langConfig = langCode === 'en' ? '' : `/en/${langCode}`;
    
    // Clear existing cookies first to avoid conflicts
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    
    if (langCode !== 'en') {
      document.cookie = `googtrans=${langConfig}; path=/`;
      document.cookie = `googtrans=${langConfig}; path=/; domain=${window.location.hostname}`;
    }

    setCurrentLang(langCode);
    
    // Reload to apply translation reliably
    window.location.reload();
  };

  if (!mounted) {
    return <div className="h-8 w-8 sm:h-9 sm:w-9 mx-0.5 rounded-full bg-slate-800/20 animate-pulse" />;
  }

  return (
    <div className="flex items-center mx-0.5 relative notranslate">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-full transition-all hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 focus:outline-none outline-none">
            <Languages className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border-border p-1 shadow-2xl rounded-xl z-[200]">
          <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Select Language
          </div>
          {INDIAN_LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg transition-colors",
                currentLang === lang.code ? "bg-sky-500/10 text-sky-500 font-semibold" : "hover:bg-accent"
              )}
            >
              <div className="flex flex-col">
                <span className="text-sm">{lang.native}</span>
                <span className="text-[10px] opacity-70">{lang.name}</span>
              </div>
              {currentLang === lang.code && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden Google Translate Target (Required for the engine to work) */}
      <div id="google_translate_element" className="hidden"></div>
      
      <style jsx global>{`
        /* Hide the Google Translate top banner permanently */
        iframe.goog-te-banner-frame {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          top: 0 !important;
          position: static !important;
        }
        .skiptranslate {
          display: none !important;
        }
        /* Hide tooltips and other unwanted Google UI elements */
        #goog-gt-tt,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Extra safety for the banner */
        .goog-te-banner {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default GoogleTranslate;
