import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export const VelvetCard = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn(
    "relative rounded-2xl bg-card/90 backdrop-blur-xl shadow-velvet ring-1 ring-primary/10 border border-border",
    className
  )}>
    {children}
  </div>
);
