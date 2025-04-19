import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserBadgeProps {
  badge: {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
  };
  size?: "sm" | "md" | "lg";
}

export const UserBadge = ({
  badge,
  size = "md"
}: UserBadgeProps) => {
  const dimensions = {
    sm: { size: 32, className: "h-8 w-8" },
    md: { size: 48, className: "h-12 w-12" },
    lg: { size: 64, className: "h-16 w-16" }
  };

  const { size: pixelSize, className } = dimensions[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1">
            <div className={`relative ${className} rounded-full overflow-hidden border border-slate-200 dark:border-slate-800`}>
              <Image
                src={badge.iconUrl}
                alt={badge.name}
                width={pixelSize}
                height={pixelSize}
              />
            </div>
            {size === "lg" && (
              <Badge variant="outline" className="mt-1 text-xs">
                {badge.name}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-1 max-w-[200px]">
            <h3 className="font-semibold">{badge.name}</h3>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 