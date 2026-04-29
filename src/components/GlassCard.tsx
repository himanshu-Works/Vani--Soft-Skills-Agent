import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = ({ children, className, hover = true }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card/60 backdrop-blur-md border border-border/40 p-6 shadow-lg transition-all duration-300",
        hover && "hover:bg-card/70 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
};
