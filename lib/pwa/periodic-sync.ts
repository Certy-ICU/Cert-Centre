/**
 * Periodic Sync Module
 * 
 * This module provides periodic background synchronization capabilities:
 * - Registration of periodic sync tasks that run at regular intervals
 * - Management of sync tasks and their frequencies
 * - Integration with the service worker for handling periodic sync events
 */

/**
 * Enum defining periodic sync tags for different operations
 */
export enum PeriodicSyncTag {
  COURSES = 'cert-centre-periodic-courses',
  NOTIFICATIONS = 'cert-centre-periodic-notifications',
  CERTIFICATES = 'cert-centre-periodic-certificates',
  COMMUNITY = 'cert-centre-periodic-community'
}

/**
 * Interface for periodic sync options
 */
export interface PeriodicSyncOptions {
  /** Minimum interval in milliseconds */
  minInterval: number;
  /** Callback function to run on registration success */
  onSuccess?: () => void;
  /** Callback function to run on registration failure */
  onError?: (error: Error) => void;
}

/**
 * Periodic sync task types supported by the application
 */
export enum PeriodicSyncTaskType {
  CONTENT_UPDATES = 'content-updates',
  CERTIFICATE_STATUS = 'certificate-status',
  USER_NOTIFICATIONS = 'user-notifications',
  COURSE_UPDATES = 'course-updates',
  NEWS_UPDATES = 'news-updates'
}

/**
 * Interface for a periodic sync task registration
 */
export interface PeriodicSyncRegistration {
  id: string;
  type: PeriodicSyncTaskType;
  minInterval: number; // Minimum interval in milliseconds
  lastSync?: number; // Timestamp of last sync
  enabled: boolean; // Whether the task is enabled
}

/**
 * Minimum intervals for different sync types (in milliseconds)
 */
export const MIN_INTERVALS = {
  [PeriodicSyncTaskType.CONTENT_UPDATES]: 24 * 60 * 60 * 1000, // 24 hours
  [PeriodicSyncTaskType.CERTIFICATE_STATUS]: 12 * 60 * 60 * 1000, // 12 hours
  [PeriodicSyncTaskType.USER_NOTIFICATIONS]: 30 * 60 * 1000, // 30 minutes
  [PeriodicSyncTaskType.COURSE_UPDATES]: 6 * 60 * 60 * 1000, // 6 hours
  [PeriodicSyncTaskType.NEWS_UPDATES]: 4 * 60 * 60 * 1000, // 4 hours
};

/**
 * Storage key for periodic sync registrations
 */
const STORAGE_KEY = 'cert-centre-periodic-sync-registrations';

/**
 * Checks if Periodic Sync API is supported
 * 
 * @returns Boolean indicating if periodic sync is supported
 */
export function isPeriodicSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PeriodicSyncManager' in window;
}

/**
 * Gets permission status for periodic background sync
 * 
 * @returns Promise resolving with a boolean indicating if permission is granted
 */
export async function getPeriodicSyncPermission(): Promise<boolean> {
  if (!isPeriodicSyncSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const status = await registration.periodicSync.permissionState();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to get periodic sync permission:', error);
    return false;
  }
}

/**
 * Registers a periodic sync task
 * 
 * @param type The type of periodic sync task
 * @param minInterval Optional minimum interval (defaults to predefined interval)
 * @returns Promise resolving with the registered task ID
 */
export async function registerPeriodicSync(
  type: PeriodicSyncTaskType,
  minInterval?: number
): Promise<string> {
  if (!isPeriodicSyncSupported()) {
    throw new Error('Periodic Sync is not supported in this browser');
  }
  
  const registration = await navigator.serviceWorker.ready;
  const permission = await getPeriodicSyncPermission();
  
  if (!permission) {
    throw new Error('Permission for periodic sync not granted');
  }
  
  // Use provided interval or default
  const interval = minInterval || MIN_INTERVALS[type];
  
  // Generate unique ID
  const id = `periodic-sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    // Register with service worker
    await registration.periodicSync.register(`${id}:${type}`, {
      minInterval: interval
    });
    
    // Save registration in local storage
    const registrations = await getPeriodicSyncRegistrations();
    
    registrations.push({
      id,
      type,
      minInterval: interval,
      lastSync: Date.now(),
      enabled: true
    });
    
    await savePeriodicSyncRegistrations(registrations);
    
    return id;
  } catch (error) {
    console.error('Failed to register periodic sync:', error);
    throw error;
  }
}

/**
 * Unregisters a periodic sync task
 * 
 * @param id The ID of the task to unregister
 * @returns Promise resolving when unregistration is complete
 */
export async function unregisterPeriodicSync(id: string): Promise<void> {
  if (!isPeriodicSyncSupported()) {
    throw new Error('Periodic Sync is not supported in this browser');
  }
  
  const registrations = await getPeriodicSyncRegistrations();
  const registration = registrations.find(reg => reg.id === id);
  
  if (!registration) {
    throw new Error(`Periodic sync task with ID ${id} not found`);
  }
  
  try {
    const swRegistration = await navigator.serviceWorker.ready;
    
    // Unregister from service worker
    await swRegistration.periodicSync.unregister(`${id}:${registration.type}`);
    
    // Remove from local storage
    const updatedRegistrations = registrations.filter(reg => reg.id !== id);
    await savePeriodicSyncRegistrations(updatedRegistrations);
  } catch (error) {
    console.error('Failed to unregister periodic sync:', error);
    throw error;
  }
}

/**
 * Gets all periodic sync registrations
 * 
 * @returns Promise resolving with an array of registrations
 */
export async function getPeriodicSyncRegistrations(): Promise<PeriodicSyncRegistration[]> {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (!stored) {
    return [];
  }
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse periodic sync registrations:', error);
    return [];
  }
}

/**
 * Gets periodic sync registrations by type
 * 
 * @param type The type of periodic sync tasks to get
 * @returns Promise resolving with an array of registrations
 */
export async function getPeriodicSyncByType(
  type: PeriodicSyncTaskType
): Promise<PeriodicSyncRegistration[]> {
  const registrations = await getPeriodicSyncRegistrations();
  return registrations.filter(reg => reg.type === type);
}

/**
 * Saves periodic sync registrations
 * 
 * @param registrations The registrations to save
 * @returns Promise resolving when save is complete
 */
async function savePeriodicSyncRegistrations(
  registrations: PeriodicSyncRegistration[]
): Promise<void> {
  if (typeof localStorage === 'undefined') {
    return;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
}

/**
 * Updates a periodic sync task
 * 
 * @param id The ID of the task to update
 * @param updates Partial updates to apply
 * @returns Promise resolving when update is complete
 */
export async function updatePeriodicSync(
  id: string,
  updates: Partial<Omit<PeriodicSyncRegistration, 'id'>>
): Promise<void> {
  const registrations = await getPeriodicSyncRegistrations();
  const index = registrations.findIndex(reg => reg.id === id);
  
  if (index === -1) {
    throw new Error(`Periodic sync task with ID ${id} not found`);
  }
  
  // Apply updates
  const updatedRegistration = {
    ...registrations[index],
    ...updates
  };
  
  // If interval changed, re-register with service worker
  if (updates.minInterval && updates.minInterval !== registrations[index].minInterval) {
    try {
      const swRegistration = await navigator.serviceWorker.ready;
      
      // Unregister old task
      await swRegistration.periodicSync.unregister(`${id}:${registrations[index].type}`);
      
      // Register new task
      await swRegistration.periodicSync.register(`${id}:${updatedRegistration.type}`, {
        minInterval: updatedRegistration.minInterval
      });
    } catch (error) {
      console.error('Failed to update periodic sync interval:', error);
      throw error;
    }
  }
  
  // Update storage
  registrations[index] = updatedRegistration;
  await savePeriodicSyncRegistrations(registrations);
}

/**
 * Checks if a specific task type has any active registrations
 * 
 * @param type The type of task to check
 * @returns Promise resolving with boolean indicating if task is registered
 */
export async function hasPeriodicSyncRegistration(
  type: PeriodicSyncTaskType
): Promise<boolean> {
  const registrations = await getPeriodicSyncByType(type);
  return registrations.some(reg => reg.enabled);
}

/**
 * Gets all tasks currently registered with the service worker
 * 
 * @returns Promise resolving with an array of tag strings
 */
export async function getActivePeriodicSyncTags(): Promise<string[]> {
  if (!isPeriodicSyncSupported()) {
    return [];
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const tags = await registration.periodicSync.getTags();
    return tags;
  } catch (error) {
    console.error('Failed to get periodic sync tags:', error);
    return [];
  }
}

/**
 * Updates the last sync time for a specific task
 * 
 * @param id The ID of the task
 * @returns Promise resolving when update is complete
 */
export async function updateLastSyncTime(id: string): Promise<void> {
  await updatePeriodicSync(id, {
    lastSync: Date.now()
  });
}

/**
 * Registers default periodic sync tasks
 * 
 * @returns Promise resolving when registration is complete
 */
export async function registerDefaultPeriodicSyncTasks(): Promise<void> {
  if (!isPeriodicSyncSupported()) {
    return;
  }
  
  const permission = await getPeriodicSyncPermission();
  
  if (!permission) {
    return;
  }
  
  try {
    // Register each default task if not already registered
    for (const type of Object.values(PeriodicSyncTaskType)) {
      const existing = await hasPeriodicSyncRegistration(type as PeriodicSyncTaskType);
      
      if (!existing) {
        await registerPeriodicSync(type as PeriodicSyncTaskType);
      }
    }
    
    console.log('Default periodic sync tasks registered');
  } catch (error) {
    console.error('Failed to register default periodic sync tasks:', error);
  }
}

// Initialize default tasks when this module is imported in the client
if (typeof window !== 'undefined') {
  // Wait for page load
  window.addEventListener('load', () => {
    registerDefaultPeriodicSyncTasks().catch(console.error);
  });
}

/**
 * Registers periodic sync for course updates
 * 
 * @param options Sync options
 * @returns Promise resolving to a boolean indicating success
 */
export async function registerCourseUpdates(
  options: Partial<PeriodicSyncOptions> = {}
): Promise<boolean> {
  // Default to 24 hours (in milliseconds)
  const minInterval = options.minInterval || 24 * 60 * 60 * 1000;
  
  return registerPeriodicSync(PeriodicSyncTaskType.COURSE_UPDATES, minInterval);
}

/**
 * Registers periodic sync for notifications
 * 
 * @param options Sync options
 * @returns Promise resolving to a boolean indicating success
 */
export async function registerNotificationUpdates(
  options: Partial<PeriodicSyncOptions> = {}
): Promise<boolean> {
  // Default to 1 hour (in milliseconds)
  const minInterval = options.minInterval || 60 * 60 * 1000;
  
  return registerPeriodicSync(PeriodicSyncTaskType.USER_NOTIFICATIONS, minInterval);
}

/**
 * Registers periodic sync for certificate updates
 * 
 * @param options Sync options
 * @returns Promise resolving to a boolean indicating success
 */
export async function registerCertificateUpdates(
  options: Partial<PeriodicSyncOptions> = {}
): Promise<boolean> {
  // Default to 12 hours (in milliseconds)
  const minInterval = options.minInterval || 12 * 60 * 60 * 1000;
  
  return registerPeriodicSync(PeriodicSyncTaskType.CERTIFICATE_STATUS, minInterval);
}

/**
 * Registers periodic sync for community content updates
 * 
 * @param options Sync options
 * @returns Promise resolving to a boolean indicating success
 */
export async function registerCommunityUpdates(
  options: Partial<PeriodicSyncOptions> = {}
): Promise<boolean> {
  // Default to 6 hours (in milliseconds)
  const minInterval = options.minInterval || 6 * 60 * 60 * 1000;
  
  return registerPeriodicSync(PeriodicSyncTaskType.CONTENT_UPDATES, minInterval);
} 