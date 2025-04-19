"use client";

import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton, 
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon
} from "react-share";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  iconSize?: number;
  round?: boolean;
}

export const SocialShare = ({
  url,
  title,
  description = "",
  className = "",
  iconSize = 32,
  round = true
}: SocialShareProps) => {
  // Make sure we have the full URL with domain name
  const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}${url}`;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-1">Share:</span>
      
      <FacebookShareButton url={fullUrl} quote={title}>
        <FacebookIcon size={iconSize} round={round} />
      </FacebookShareButton>
      
      <TwitterShareButton url={fullUrl} title={title}>
        <TwitterIcon size={iconSize} round={round} />
      </TwitterShareButton>
      
      <LinkedinShareButton url={fullUrl} title={title} summary={description}>
        <LinkedinIcon size={iconSize} round={round} />
      </LinkedinShareButton>
      
      <WhatsappShareButton url={fullUrl} title={title}>
        <WhatsappIcon size={iconSize} round={round} />
      </WhatsappShareButton>
    </div>
  );
}; 