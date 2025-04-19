"use client";

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PointsDisplayProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

export const PointsDisplay = ({
  points,
  size = 'md',
  showLabel = true,
  animate = false,
  className
}: PointsDisplayProps) => {
  const [prevPoints, setPrevPoints] = useState(points);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (points !== prevPoints && animate) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
    setPrevPoints(points);
  }, [points, prevPoints, animate]);

  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "font-semibold flex items-center gap-1 transition-all",
        sizeClasses[size],
        isAnimating ? "scale-110 bg-yellow-100 dark:bg-yellow-900" : "",
        className
      )}
    >
      <Star className={cn(iconSizes[size], "text-yellow-500")} />
      <span className={cn(
        "transition-all",
        isAnimating ? "text-yellow-600 dark:text-yellow-400" : ""
      )}>
        {points.toLocaleString()}
      </span>
      {showLabel && (
        <span className="text-muted-foreground ml-0.5">
          {points === 1 ? "point" : "points"}
        </span>
      )}
    </Badge>
  );
}; 