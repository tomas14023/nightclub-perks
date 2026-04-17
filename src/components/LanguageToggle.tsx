import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export const LanguageToggle = ({ className }: { className?: string }) => {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("es") ? "es" : "en";
  const next = current === "en" ? "es" : "en";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => i18n.changeLanguage(next)}
      className={cn("gap-2 tracking-wider-luxe uppercase text-xs", className)}
      aria-label={`Switch language to ${next === "es" ? "Spanish" : "English"}`}
    >
      <Languages size={14} />
      <span className="font-medium">{current.toUpperCase()}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{next.toUpperCase()}</span>
    </Button>
  );
};
