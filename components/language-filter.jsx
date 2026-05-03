"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AVAILABLE_LANGUAGES } from "@/lib/languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLang = searchParams.get("lang") || "all";

  const handleLanguageChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("lang");
    } else {
      params.set("lang", value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-[200px]">
      <Select value={currentLang} onValueChange={handleLanguageChange}>
        <SelectTrigger className="bg-card">
          <SelectValue placeholder="Filter by Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Languages</SelectItem>
          {AVAILABLE_LANGUAGES.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
