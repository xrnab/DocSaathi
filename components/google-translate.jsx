"use client";

import { useEffect } from 'react';
import { Languages } from 'lucide-react';

const GoogleTranslate = () => {
  useEffect(() => {
    // Check if the script is already loaded
    if (window.googleTranslateElementInit) return;

    // Set default target to English by clearing any auto-translate cookies
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,hi,bn,te,mr,ta,gu,kn,ml,pa,ur,es,fr', // Common Indian and global languages
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    const addScript = () => {
      const s = document.createElement('script');
      s.setAttribute('src', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
      document.body.appendChild(s);
    };

    addScript();
  }, []);

  return (
    <div className="flex items-center mx-0.5 relative group">
      {/* Visual Icon */}
      <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-full transition-colors">
        <Languages className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
      </div>

      {/* Hidden Google Translate Trigger */}
      <div id="google_translate_element" className="google-translate-container absolute inset-0 opacity-0 cursor-pointer overflow-hidden"></div>
      
      <style jsx global>{`
        .google-translate-container {
          width: 100% !important;
          height: 100% !important;
          z-index: 1;
        }
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
        }
        .goog-te-gadget-simple img {
          display: none !important;
        }
        .goog-te-gadget-simple span {
          display: none !important;
        }
        iframe.goog-te-banner-frame {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          top: 0 !important;
        }
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        #goog-gt-tt {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default GoogleTranslate;
