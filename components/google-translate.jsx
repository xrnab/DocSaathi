"use client";

import { useEffect } from 'react';

const GoogleTranslate = () => {
  useEffect(() => {
    // Check if the script is already loaded
    if (window.googleTranslateElementInit) return;

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
    <div className="flex items-center mx-1">
      <div id="google_translate_element" className="google-translate-container"></div>
      <style jsx global>{`
        .google-translate-container {
          min-height: 32px;
          display: flex;
          align-items: center;
        }
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: 1px solid rgba(14, 165, 233, 0.1) !important;
          padding: 2px 6px !important;
          border-radius: 12px !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
        }
        .goog-te-gadget-simple:hover {
          background-color: rgba(14, 165, 233, 0.05) !important;
          border-color: rgba(14, 165, 233, 0.3) !important;
        }
        .goog-te-gadget-simple img {
          display: none !important;
        }
        .goog-te-gadget-simple span {
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .dark .goog-te-gadget-simple span {
          color: #94a3b8 !important;
        }
        .goog-te-menu-value span:nth-child(3),
        .goog-te-menu-value span:nth-child(5) {
          display: none !important;
        }
        iframe.goog-te-banner-frame {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          top: 0 !important;
        }
        /* Handle the gap created by Google Translate bar */
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
