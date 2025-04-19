/**
 * PWA Features
 * 
 * This file exports all PWA-related functionality for the Cert Centre application.
 */

// Export all features
export * from './fetch-utils';
export * from './offline-sync';
export * from './push-notifications';
export * from './background-sync';
export * from './periodic-sync';

// Type re-exports for convenience
export type {
  SyncStatus,
  WithSyncStatus,
  CourseData,
  ProgressData,
  QuizAttemptData,
  SyncQueueItem
} from './offline-sync';

export type {
  PushSubscriptionData,
  NotificationPreferences
} from './push-notifications';

export type {
  SyncRegistrationStatus
} from './background-sync';

export type {
  PeriodicSyncOptions,
  PeriodicSyncStatus
} from './periodic-sync'; 