"use client";

import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon
} from 'react-share';
import { cn } from '@/lib/utils';

interface BadgeShareProps {
  badge: {
    name: string;
    description: string;
    tier: string;
  };
  profileUrl: string;
  className?: string;
}

export const BadgeShare = ({ 
  badge, 
  profileUrl,
  className 
}: BadgeShareProps) => {
  const shareTitle = `I just earned the ${badge.tier} ${badge.name} badge!`;
  const shareDescription = `${badge.description} - Check out my learning journey!`;
  
  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      <p className="text-sm font-medium">Share this achievement:</p>
      <div className="flex space-x-2">
        <TwitterShareButton
          url={profileUrl}
          title={shareTitle}
          className="rounded-full overflow-hidden hover:opacity-90 transition"
        >
          <TwitterIcon size={32} round />
        </TwitterShareButton>
        
        <FacebookShareButton
          url={profileUrl}
          quote={shareTitle}
          className="rounded-full overflow-hidden hover:opacity-90 transition"
        >
          <FacebookIcon size={32} round />
        </FacebookShareButton>
        
        <LinkedinShareButton
          url={profileUrl}
          title={shareTitle}
          summary={shareDescription}
          className="rounded-full overflow-hidden hover:opacity-90 transition"
        >
          <LinkedinIcon size={32} round />
        </LinkedinShareButton>
      </div>
    </div>
  );
}; 