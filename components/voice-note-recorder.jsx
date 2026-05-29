"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, Sparkles, RefreshCw, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveVoiceNote } from "@/actions/telemedicine";

export default function VoiceNoteRecorder({ appointmentId, fromRole = "PATIENT", onSaved, onClose }) {
  const [recordingStatus, setRecordingStatus] = useState("idle"); // idle, recording, transcribing, review, error
  const [timer, setTimer] = useState(0); // seconds
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Cleanup timers and media recorders on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      setErrorMessage("");
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") 
        ? "audio/webm" 
        : MediaRecorder.isTypeSupported("audio/mp4") 
          ? "audio/mp4" 
          : "";

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        await uploadAudio(audioBlob);
        
        // Stop audio tracks to release the hardware mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingStatus("recording");
      setTimer(0);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access error:", err);
      setErrorMessage("Microphone access denied or not found. Please enable permission and try again.");
      setRecordingStatus("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setRecordingStatus("transcribing");
    }
  };

  const uploadAudio = async (audioBlob) => {
    try {
      const isMp4 = audioBlob.type?.includes("mp4");
      const filename = isMp4 ? "recording.mp4" : "recording.webm";
      const formData = new FormData();
      formData.append("audio", audioBlob, filename);

      const response = await fetch("/api/voice-transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to transcribe recorded audio.");
      }

      const data = await response.json();
      setTranscript(data.text || "");
      setRecordingStatus("review");
    } catch (err) {
      console.error("Transcription error:", err);
      setErrorMessage(err.message || "Failed to transcribe your audio. Please check network and try again.");
      setRecordingStatus("error");
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;

    setIsSaving(true);
    setErrorMessage("");
    try {
      const response = await saveVoiceNote(appointmentId, transcript, fromRole);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (onSaved) {
        onSaved({
          id: response.data.id,
          text: transcript,
          sender: fromRole === "DOCTOR" ? "doctor" : "patient",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "sent"
        });
      }
    } catch (err) {
      console.error("Save voice note error:", err);
      setErrorMessage(err.message || "Could not save the voice note to the server.");
      setRecordingStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const resetRecorder = () => {
    setRecordingStatus("idle");
    setTimer(0);
    setTranscript("");
    setErrorMessage("");
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      {recordingStatus === "idle" && (
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="h-16 w-16 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Mic className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Voice Consultation Note</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Speak into your microphone. Groq's Whisper AI will convert your voice message to text.
            </p>
          </div>
          <Button
            onClick={startRecording}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl shadow-md transition-all py-6 font-semibold"
          >
            Start Recording
          </Button>
        </div>
      )}

      {recordingStatus === "recording" && (
        <div className="flex flex-col items-center space-y-6 text-center w-full">
          <div className="relative flex items-center justify-center h-24 w-24">
            <span className="absolute inline-flex h-20 w-20 rounded-full bg-red-400/30 dark:bg-red-500/20 animate-ping"></span>
            <span className="absolute inline-flex h-16 w-16 rounded-full bg-red-400/50 dark:bg-red-500/30 animate-pulse"></span>
            <div className="relative h-14 w-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
              <Mic className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-mono font-bold tracking-wider text-foreground">
              {formatTime(timer)}
            </div>
            <p className="text-xs text-red-500 font-medium animate-pulse">Recording Active...</p>
          </div>

          <Button
            onClick={stopRecording}
            variant="destructive"
            className="w-full rounded-xl py-6 flex items-center justify-center gap-2 font-semibold shadow-md"
          >
            <Square className="h-4 w-4 fill-white" /> Stop & Transcribe
          </Button>
        </div>
      )}

      {recordingStatus === "transcribing" && (
        <div className="flex flex-col items-center space-y-4 text-center py-6">
          <div className="relative flex items-center justify-center h-16 w-16">
            <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
            <Sparkles className="absolute h-4 w-4 text-amber-500 -top-1 -right-1 animate-bounce" />
          </div>
          <div>
            <h4 className="font-semibold">Transcribing Audio</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Powered by Groq's high-speed Whisper Large v3 translation engine. Please wait a moment...
            </p>
          </div>
        </div>
      )}

      {recordingStatus === "review" && (
        <div className="flex flex-col space-y-4 w-full">
          <div>
            <h4 className="font-semibold text-base flex items-center gap-1.5 text-foreground">
              <Sparkles className="h-4 w-4 text-amber-500" /> Review AI Transcript
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and correct any speech recognition errors before saving.
            </p>
          </div>

          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="No speech detected. Try speaking more clearly."
            className="min-h-[120px] rounded-xl border-sky-100 dark:border-sky-800 focus-visible:ring-sky-500 bg-slate-50 dark:bg-slate-900/50"
          />

          <div className="flex gap-2 w-full pt-2">
            <Button
              variant="outline"
              onClick={resetRecorder}
              disabled={isSaving}
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Re-record
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !transcript.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirm & Send
            </Button>
          </div>
        </div>
      )}

      {recordingStatus === "error" && (
        <div className="flex flex-col items-center space-y-4 text-center py-4 w-full">
          <div className="h-12 w-12 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-destructive">Error Occurred</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {errorMessage || "An unexpected error occurred."}
            </p>
          </div>
          <Button
            onClick={resetRecorder}
            className="w-full bg-slate-800 hover:bg-slate-950 text-white rounded-xl"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
