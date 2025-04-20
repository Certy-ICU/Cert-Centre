"use client";

import Image from 'next/image';
import { toast } from "react-hot-toast";
import { Award, Trophy } from "lucide-react";

interface BadgeNotificationProps {
  badge: {
    name: string;
    iconUrl: string;
  };
}

interface PointsNotificationProps {
  title?: string;
  points: number;
  message?: string;
  duration?: number;
}

/**
 * Show a notification when a user earns a badge
 */
export const showBadgeNotification = (badge: BadgeNotificationProps["badge"]) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex`}>
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <Image src={badge.iconUrl} alt={badge.name} width={40} height={40} />
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Badge Awarded!</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You've earned the "{badge.name}" badge</p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >View</button>
      </div>
    </div>
  ), { duration: 5000 });
};

/**
 * Show a notification when a user earns points
 * @param options Points notification configuration or just the points value
 */
export const showPointsNotification = (options: PointsNotificationProps | number, reason?: string) => {
  // Handle the legacy format where we just pass the points directly
  const config: PointsNotificationProps = typeof options === 'number' 
    ? { points: options, message: reason ? reason : undefined } 
    : options;
    
  const { 
    title = 'Points Earned!',
    points,
    message = `You've earned ${points} points`,
    duration = 3000
  } = config;
  
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex`}>
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >Dismiss</button>
      </div>
    </div>
  ), { duration });
}; 