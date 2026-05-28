"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { MedicalAssistantChat } from "@/components/medical-assistant-chat";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { MessageCircleHeart } from "lucide-react";

export function HomeAiAssistantButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="fixed bottom-6 right-6 z-40 h-14 rounded-full px-5 bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-600 shadow-2xl shadow-sky-500/25"
        >
          <MessageCircleHeart className="h-5 w-5 mr-2" />
          AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none sm:max-w-2xl overflow-hidden fixed bottom-0 top-auto translate-y-0 left-0 right-0 translate-x-0 w-full max-w-full rounded-t-3xl rounded-b-none h-[90dvh] max-h-[90dvh] flex flex-col sm:fixed sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-auto sm:max-h-none sm:w-full sm:max-w-2xl sm:rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>AI Medical Assistant Chat</DialogTitle>
        </VisuallyHidden>
        <MedicalAssistantChat title="Medical Assistant (AI)" />
      </DialogContent>
    </Dialog>
  );
}

