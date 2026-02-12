import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatsCard({ title, value, change, icon, trend = "neutral" }: StatsCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                trend === "up" && "text-bullish",
                trend === "down" && "text-bearish",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {trend === "up" && <TrendingUp className="h-4 w-4" />}
                {trend === "down" && <TrendingDown className="h-4 w-4" />}
                {trend === "neutral" && <Minus className="h-4 w-4" />}
                <span>{change > 0 ? "+" : ""}{change}%</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
