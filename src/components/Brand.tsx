import { cn } from "@/lib/utils";

export const Brand = ({ className, label = "Nocturne" }: { className?: string; label?: string }) => (
  <div className={cn("flex flex-col items-center", className)}>
    <div className="font-serif text-primary text-xs tracking-luxe uppercase">{label}</div>
    <div className="mt-1 h-px w-12 bg-primary/40" />
  </div>
);
