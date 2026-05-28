"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Speaker } from "lucide-react";

const FREQUENCY_PUNJABI = {
  "1-0-1": "ਸਵੇਰੇ ਅਤੇ ਸ਼ਾਮ ਰੋਟੀ ਤੋਂ ਬਾਅਦ",
  "1-1-1": "ਸਵੇਰੇ, ਦੁਪਹਿਰ ਅਤੇ ਸ਼ਾਮ ਰੋਟੀ ਤੋਂ ਬਾਅਦ",
  "1-0-0": "ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ",
  "0-1-0": "ਦੁਪਹਿਰ ਵੇਲੇ",
  "0-0-1": "ਰਾਤ ਨੂੰ ਸੌਣ ਵੇਲੇ",
  "once daily": "ਦਿਨ ਵਿੱਚ ਇੱਕ ਵਾਰ",
  "twice daily": "ਦਿਨ ਵਿੱਚ ਦੋ ਵਾਰ",
  "thrice daily": "ਦਿਨ ਵਿੱਚ ਤਿੰਨ ਵਾਰ",
  "before meals": "ਰੋਟੀ ਖਾਣ ਤੋਂ ਪਹਿਲਾਂ",
  "after meals": "ਰੋਟੀ ਖਾਣ ਤੋਂ ਬਾਅਦ"
};

const DURATION_PUNJABI = {
  "1 day": "ਇੱਕ ਦਿਨ ਲਈ",
  "2 days": "ਦੋ ਦਿਨਾਂ ਲਈ",
  "3 days": "ਤਿੰਨ ਦਿਨਾਂ ਲਈ",
  "4 days": "ਚਾਰ ਦਿਨਾਂ ਲਈ",
  "5 days": "ਪੰਜ ਦਿਨਾਂ ਲਈ",
  "6 days": "ਛੇ ਦਿਨਾਂ ਲਈ",
  "7 days": "ਸੱਤ ਦਿਨਾਂ ਲਈ",
  "10 days": "ਦਸ ਦਿਨਾਂ ਲਈ",
  "14 days": "ਚੌਦਾਂ ਦਿਨਾਂ ਲਈ",
  "15 days": "ਪੰਦਰਾਂ ਦਿਨਾਂ ਲਈ",
  "30 days": "ਤੀਹ ਦਿਨਾਂ ਲਈ",
  "1 week": "ਇੱਕ ਹਫ਼ਤੇ ਲਈ",
  "2 weeks": "ਦੋ ਹਫ਼ਤਿਆਂ ਲਈ",
  "3 weeks": "ਤਿੰਨ ਹਫ਼ਤਿਆਂ ਲਈ",
  "1 month": "ਇੱਕ ਮਹੀਨੇ ਲਈ"
};

export default function PunjabiVoiceReader({ prescription }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSupported(true);
    }
  }, []);

  const stopSpeaking = () => {
    if (supported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const startSpeaking = () => {
    if (!supported || !prescription) return;

    window.speechSynthesis.cancel(); // Stop any current speech

    const name = prescription.name || "ਦਵਾਈ";
    const dosage = prescription.dosage || "";
    
    // Map frequency
    const freqLower = (prescription.frequency || "").toLowerCase();
    const punjabiFreq = FREQUENCY_PUNJABI[freqLower] || `ਦਿਨ ਵਿੱਚ ${prescription.frequency}`;

    // Map duration
    const durLower = (prescription.duration || "").toLowerCase();
    const punjabiDur = DURATION_PUNJABI[durLower] || `${prescription.duration}`;

    // Construct highly natural spoken Punjabi sentence
    const textToSpeak = `ਮੈਡੀਸਨ ਜਾਣਕਾਰੀ। ਦਵਾਈ ਦਾ ਨਾਮ ਹੈ: ${name}। ਖੁਰਾਕ: ${dosage}। ਇਹ ਤੁਸੀਂ ${punjabiFreq} ਲੈਣੀ ਹੈ, ${punjabiDur}। ਕਿਰਪਾ ਕਰਕੇ ਸਮੇਂ ਸਿਰ ਦਵਾਈ ਲਓ ਅਤੇ ਤੰਦਰੁਸਤ ਰਹੋ।`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "pa-IN"; // Punjabi India locale
    
    // Find Punjabi voice if available, otherwise browser fallback will speak pa-IN
    const voices = window.speechSynthesis.getVoices();
    const punjabiVoice = voices.find(v => v.lang.startsWith("pa"));
    if (punjabiVoice) {
      utterance.voice = punjabiVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      startSpeaking();
    }
  };

  // Clean up synthesis on unmount
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  if (!supported) return null;

  return (
    <Button
      type="button"
      onClick={handleToggleSpeech}
      className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border transition-all ${
        isSpeaking
          ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse shadow-md"
          : "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-850 hover:bg-sky-100"
      }`}
      title="Listen to Prescription in Punjabi (Punjabi Readout)"
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-4 h-4" />
          <span>Stop Readout</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>Punjabi ਸੁਣੋ (Readout)</span>
        </>
      )}
    </Button>
  );
}
