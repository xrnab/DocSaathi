"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function VideoCall({
  applicationId,
  sessionId,
  token,
  backPath = "/appointments",
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [hardwareUnavailable, setHardwareUnavailable] = useState(false);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);

  const sessionRef = useRef(null);
  const publisherRef = useRef(null);
  const didRetryPublisherRef = useRef(false);

  const router = useRouter();

  const stopPublisherTracks = () => {
    try {
      const publisher = publisherRef.current;
      const mediaStream =
        publisher?.stream?.getMediaStream?.() ??
        publisher?.stream?.mediaStream ??
        null;

      if (mediaStream?.getTracks) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      // best-effort cleanup
    }
  };

  const isHardwareUnavailableError = (err) => {
    const msg = String(err?.message || "");
    const name = String(err?.name || "");
    return (
      err?.code === 1500 ||
      /OT_HARDWARE_UNAVAILABLE/i.test(msg) ||
      /NotReadableError/i.test(msg) ||
      /NotReadableError/i.test(name) ||
      /GetUserMedia/i.test(msg)
    );
  };

  const showHardwareUnavailableToast = () => {
    toast.error(
      "Camera/microphone is unavailable. Close other apps using them (Teams/Zoom/OBS), allow permissions in the browser, then retry."
    );
  };

  const ensureMediaPermissions = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    // Prompt for permissions and validate device availability before OpenTok init.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: isAudioEnabled,
      video: isVideoEnabled
        ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
        : false,
    });

    // Immediately stop tracks; OpenTok will re-acquire them.
    stream.getTracks().forEach((t) => t.stop());
  };

  // Handle script load
  const handleScriptLoad = () => {
    setScriptLoaded(true);
    if (!window.OT) {
      toast.error("Failed to load Vonage Video API");
      setIsLoading(false);
      return;
    }
    try {
      // Surface otherwise "global" OT exceptions in our UI.
      window.OT.on?.("exception", (event) => {
        const err = event?.error || event;
        if (isHardwareUnavailableError(err)) {
          setHardwareUnavailable(true);
          showHardwareUnavailableToast();
        }
      });
    } catch {
      // no-op
    }
    initializeSession();
  };

  const createPublisherAsync = async (overrideProps = {}) => {
    return await new Promise((resolve, reject) => {
      let publisher;
      try {
        publisher = window.OT.initPublisher(
          "publisher",
          {
            insertMode: "replace",
            width: "100%",
            height: "100%",
            publishAudio: isAudioEnabled,
            publishVideo: isVideoEnabled,
            // Conservative defaults reduce camera driver failures on Windows
            resolution: "640x480",
            frameRate: 30,
            ...overrideProps,
          },
          (pubErr) => {
            if (pubErr) reject(pubErr);
            else resolve(publisher);
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  };

  // Initialize video session
  const initializeSession = async () => {
    if (!applicationId || !sessionId || !token) {
      toast.error("Missing required video call parameters");
      router.push(backPath);
      return;
    }

    try {
      setHardwareUnavailable(false);
      // Reset retry for a fresh session init
      didRetryPublisherRef.current = false;

      try {
        await ensureMediaPermissions();
      } catch (permErr) {
        setIsLoading(false);
        if (isHardwareUnavailableError(permErr)) {
          setHardwareUnavailable(true);
          showHardwareUnavailableToast();
          return;
        }
        toast.error(
          permErr?.message ||
            "Unable to access camera/microphone. Please allow permissions and retry."
        );
        return;
      }

      try {
        publisherRef.current = await createPublisherAsync();
      } catch (pubErr) {
        setIsLoading(false);
        if (isHardwareUnavailableError(pubErr)) {
          setHardwareUnavailable(true);
          showHardwareUnavailableToast();
        } else {
          toast.error(pubErr?.message || "Unable to access camera/microphone");
        }
        return;
      }

      // Initialize the session
      sessionRef.current = window.OT.initSession(applicationId, sessionId);

      // Subscribe to new streams
      sessionRef.current.on("streamCreated", (event) => {
        sessionRef.current.subscribe(
          event.stream,
          "subscriber",
          {
            insertMode: "append",
            width: "100%",
            height: "100%",
          },
          (error) => {
            if (error) {
              toast.error("Error connecting to other participant's stream");
            }
          }
        );
      });

      // Handle session events
      sessionRef.current.on("sessionConnected", () => {
        setIsConnected(true);
        setIsLoading(false);
      });

      sessionRef.current.on("sessionDisconnected", () => {
        setIsConnected(false);
      });

      // Connect to the session (publish only after publisher is ready)
      sessionRef.current.connect(token, async (error) => {
        if (error) {
          setIsLoading(false);
          toast.error(error.message || "Error connecting to video session");
          return;
        }

        sessionRef.current.publish(publisherRef.current, async (publishError) => {
          if (!publishError) return;

          if (
            isHardwareUnavailableError(publishError) &&
            !didRetryPublisherRef.current
          ) {
            didRetryPublisherRef.current = true;

            stopPublisherTracks();
            try {
              publisherRef.current?.destroy();
            } catch {}

            try {
              publisherRef.current = await createPublisherAsync({
                publishVideo: isVideoEnabled,
                publishAudio: isAudioEnabled,
                resolution: "320x240",
                frameRate: 15,
              });
            } catch (pubErr2) {
              setIsLoading(false);
              if (isHardwareUnavailableError(pubErr2)) {
                setHardwareUnavailable(true);
                showHardwareUnavailableToast();
              } else {
                toast.error(pubErr2?.message || "Unable to access camera/microphone");
              }
              return;
            }

            sessionRef.current.publish(publisherRef.current, (publishError2) => {
              if (!publishError2) return;
              setIsLoading(false);
              if (isHardwareUnavailableError(publishError2)) {
                setHardwareUnavailable(true);
                showHardwareUnavailableToast();
              } else {
                toast.error(
                  publishError2.message || "Error publishing your stream"
                );
              }
            });

            return;
          }

          setIsLoading(false);
          if (isHardwareUnavailableError(publishError)) {
            setHardwareUnavailable(true);
            showHardwareUnavailableToast();
          } else {
            toast.error(publishError.message || "Error publishing your stream");
          }
        });
      });
    } catch (error) {
      toast.error("Failed to initialize video call");
      setIsLoading(false);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (publisherRef.current) {
      publisherRef.current.publishVideo(!isVideoEnabled);
      setIsVideoEnabled((prev) => !prev);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (publisherRef.current) {
      publisherRef.current.publishAudio(!isAudioEnabled);
      setIsAudioEnabled((prev) => !prev);
    }
  };

  // End call
  const endCall = () => {
    stopPublisherTracks();

    // Properly destroy publisher
    if (publisherRef.current) {
      publisherRef.current.destroy();
      publisherRef.current = null;
    }

    // Disconnect session
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }

    router.push(backPath);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPublisherTracks();
      if (publisherRef.current) {
        publisherRef.current.destroy();
      }
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, []);

  if (!sessionId || !token || !applicationId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Invalid Video Call
        </h1>
        <p className="text-muted-foreground mb-6">
          Missing required parameters for the video call.
        </p>
        <Button
          onClick={() => router.push(backPath)}
          className="bg-sky-600 hover:bg-sky-700"
        >
          Back
        </Button>
      </div>
    );
  }

  if (!hasJoinedCall) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border border-sky-100 dark:border-sky-900/30 shadow-2xl rounded-3xl bg-white dark:bg-slate-950 overflow-hidden">
          <div className="bg-sky-50/50 dark:bg-sky-900/10 p-6 text-center border-b border-sky-100 dark:border-sky-900/20">
            <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/40 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-sky-200 dark:border-sky-800/30 text-sky-600 dark:text-sky-400">
              <Video className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Virtual Consultation</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ready to join your secure video session?</p>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Session Status</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-bold">READY</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Encryption</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">🛡️ AES-256 E2EE</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setHasJoinedCall(true)}
                className="w-full h-12 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Video className="h-4 w-4" /> Join Secure Call
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push(backPath)}
                className="w-full h-12 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {hasJoinedCall && (
        <Script
          src="https://unpkg.com/@vonage/client-sdk-video@2.30.0/dist/js/opentok.js"
          onLoad={handleScriptLoad}
          onError={() => {
            toast.error("Failed to load video call script");
            setIsLoading(false);
          }}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Video Consultation
          </h1>
          <p className="text-muted-foreground">
            {isConnected
              ? "Connected"
              : isLoading
              ? "Connecting..."
              : "Connection failed"}
          </p>
        </div>

        {isLoading && !scriptLoaded ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-sky-500 dark:text-sky-400 animate-spin mb-4" />
            <p className="text-foreground text-lg">
              Loading video call components...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {hardwareUnavailable && (
              <Card className="border border-red-200/60 dark:border-red-900/30">
                <CardContent className="py-4">
                  <div className="text-sm text-muted-foreground">
                    Camera/microphone is currently unavailable. Close any other
                    app/tab using them, then click retry.
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Button
                      onClick={() => {
                        setIsLoading(true);
                        initializeSession();
                      }}
                      className="bg-sky-600 hover:bg-sky-700"
                    >
                      Retry
                    </Button>
                    <Button variant="outline" onClick={endCall}>
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Publisher (Your video) */}
              <div className="border border-sky-200 dark:border-sky-900/20 rounded-lg overflow-hidden">
                <div className="bg-sky-50 dark:bg-sky-900/10 px-3 py-2 text-sky-500 dark:text-sky-400 text-sm font-medium">
                  You
                </div>
                <div
                  id="publisher"
                  className="w-full h-[300px] md:h-[400px] bg-muted/30"
                >
                  {!scriptLoaded && (
                    <div className="flex items-center justify-center h-full">
                      <div className="bg-muted/20 rounded-full p-8">
                        <User className="h-12 w-12 text-sky-500 dark:text-sky-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscriber (Other person's video) */}
              <div className="border border-sky-200 dark:border-sky-900/20 rounded-lg overflow-hidden">
                <div className="bg-sky-50 dark:bg-sky-900/10 px-3 py-2 text-sky-500 dark:text-sky-400 text-sm font-medium">
                  Other Participant
                </div>
                <div
                  id="subscriber"
                  className="w-full h-[300px] md:h-[400px] bg-muted/30"
                >
                  {(!isConnected || !scriptLoaded) && (
                    <div className="flex items-center justify-center h-full">
                      <div className="bg-muted/20 rounded-full p-8">
                        <User className="h-12 w-12 text-sky-500 dark:text-sky-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Video controls */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                size="lg"
                onClick={toggleVideo}
                className={`rounded-full p-4 h-14 w-14 ${
                  isVideoEnabled
                    ? "border-sky-300 dark:border-sky-900/30"
                    : "bg-red-900/20 border-red-900/30 text-red-400"
                }`}
                disabled={!publisherRef.current}
              >
                {isVideoEnabled ? <Video /> : <VideoOff />}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={toggleAudio}
                className={`rounded-full p-4 h-14 w-14 ${
                  isAudioEnabled
                    ? "border-sky-300 dark:border-sky-900/30"
                    : "bg-red-900/20 border-red-900/30 text-red-400"
                }`}
                disabled={!publisherRef.current}
              >
                {isAudioEnabled ? <Mic /> : <MicOff />}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="rounded-full p-4 h-14 w-14 bg-red-600 hover:bg-red-700"
              >
                <PhoneOff />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                {isVideoEnabled ? "Camera on" : "Camera off"} •
                {isAudioEnabled ? " Microphone on" : " Microphone off"}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                When you're finished with your consultation, click the red
                button to end the call
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
