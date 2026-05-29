"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import PrescriptionOCR from "./prescription-ocr";

export default function CollapsiblePrescriptionOCR({ patientId = null }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-sky-100 dark:border-sky-900 shadow-md rounded-2xl overflow-hidden bg-card transition-all">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-4 bg-sky-50/10 dark:bg-sky-900/5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-sky-500 animate-pulse" />
            Upload & Scan Prescription
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Use AI to instantly read handwritten or printed prescriptions and save medicines to your file.
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(!isOpen)} 
          className="border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 font-bold rounded-xl gap-1.5 shrink-0 self-start sm:self-auto h-9 cursor-pointer"
        >
          {isOpen ? (
            <>
              Hide Scanner <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Scan New Prescription <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="border-t border-sky-50 dark:border-sky-950 p-4 sm:p-6 animate-in slide-in-from-top-4 duration-300">
          <PrescriptionOCR 
            patientId={patientId} 
            onSaveSuccess={() => {
              setIsOpen(false);
            }} 
          />
        </CardContent>
      )}
    </Card>
  );
}
