import { GlassCard } from "./GlassCard";
import { Button } from "./ui/button";
import { LucideIcon } from "lucide-react";

interface PracticeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
}

export const PracticeCard = ({ title, description, icon: Icon, gradient, onClick }: PracticeCardProps) => {
  return (
    <GlassCard className="group cursor-pointer">
      <div className="space-y-4">
        <div className={`w-16 h-16 rounded-xl ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        
        <Button onClick={onClick} variant="default" className="w-full">
          Start Practice
        </Button>
      </div>
    </GlassCard>
  );
};
