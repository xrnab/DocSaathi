"use client";

import { useAccessibility } from "@/lib/accessibility-context";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AccessibilityToggle() {
  const { enabled, toggle } = useAccessibility();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        toggle();
        toast.success(
          enabled
            ? "Standard mode restored"
            : "Accessibility mode on — larger text and buttons"
        );
      }}
      className={`gap-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer shrink-0 ${
        enabled
          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400"
          : "hover:bg-muted"
      }`}
      title="Toggle accessibility mode"
    >
      <Eye className="h-4 w-4" />
      {enabled ? "A+" : "A+"}
    </Button>
  );
}
