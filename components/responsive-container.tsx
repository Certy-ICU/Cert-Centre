"use client";

import React from 'react';
import { useBreakpoint } from '@/hooks/use-media-query';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  mobileClassName?: string;
  desktopClassName?: string;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  mobileClassName = "",
  desktopClassName = "",
  className = "",
}) => {
  const { isMobile } = useBreakpoint();
  
  const responsiveClass = isMobile ? mobileClassName : desktopClassName;
  
  return (
    <div className={`${className} ${responsiveClass}`}>
      {children}
    </div>
  );
};

interface ResponsiveRenderProps {
  children: React.ReactNode;
  mobileContent?: React.ReactNode;
  tabletContent?: React.ReactNode;
  desktopContent?: React.ReactNode;
}

export const ResponsiveRender: React.FC<ResponsiveRenderProps> = ({
  children,
  mobileContent,
  tabletContent,
  desktopContent,
}) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  
  if (isMobile && mobileContent) {
    return <>{mobileContent}</>;
  }
  
  if (isTablet && tabletContent) {
    return <>{tabletContent}</>;
  }
  
  if (isDesktop && desktopContent) {
    return <>{desktopContent}</>;
  }
  
  // Fallback to default children if no specific content matches
  return <>{children}</>;
}; 