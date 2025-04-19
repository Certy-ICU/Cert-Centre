/**
 * Offline Data Module
 * 
 * Handles storing data when the app is offline and synchronizing it with
 * the server when connectivity is restored.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database name and version
const DB_NAME = 'cert-centre-offline-db';
const DB_VERSION = 1;

// Store names
const PENDING_REQUESTS_STORE = 'pendingRequests';
const CACHED_DATA_STORE = 'cachedData';

// Define database schema
interface OfflineDB extends DBSchema {
  pendingRequests: {
    key: string;
    value: PendingRequest;
    indexes: { 'by-timestamp': number };
  };
  cachedData: {
    key: string;
    value: CachedData;
    indexes: { 'by-timestamp': number, 'by-entity': string };
  };
}

// Pending request type
export interface PendingRequest {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  entityType: string;
  entityId?: string;
  retryCount: number;
  priority: number;
}

// Cached data type
export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  entityType: string;
  entityId: string;
  expiresAt?: number;
}

// Cache expiry durations (in milliseconds)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,        // 5 minutes
  MEDIUM: 60 * 60 * 1000,      // 1 hour
  LONG: 24 * 60 * 60 * 1000,   // 1 day
  VERY_LONG: 7 * 24 * 60 * 60 * 1000 // 1 week
};

let db: IDBPDatabase<OfflineDB> | null = null;

/**
 * Initialize the offline database
 */
export async function initOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (db) return db;

  db = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      // Create stores if they don't exist
      if (oldVersion < 1) {
        const pendingStore = database.createObjectStore(PENDING_REQUESTS_STORE, { keyPath: 'id' });
        pendingStore.createIndex('by-timestamp', 'timestamp');

        const cachedStore = database.createObjectStore(CACHED_DATA_STORE, { keyPath: 'key' });
        cachedStore.createIndex('by-timestamp', 'timestamp');
        cachedStore.createIndex('by-entity', 'entityType');
      }
    }
  });

  return db;
}

/**
 * Queue a request to be sent when online
 */
export async function queueRequest(
  url: string,
  method: string,
  body?: any,
  headers: Record<string, string> = {},
  entityType: string = 'unknown',
  entityId?: string,
  priority: number = 1
): Promise<string> {
  const database = await initOfflineDB();
  
  const request: PendingRequest = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    url,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body,
    entityType,
    entityId,
    retryCount: 0,
    priority
  };
  
  await database.add(PENDING_REQUESTS_STORE, request);
  
  // Try to process the queue immediately if we're online
  if (navigator.onLine) {
    processQueue();
  }
  
  return request.id;
}

/**
 * Process the pending requests queue
 */
export async function processQueue(): Promise<void> {
  if (!navigator.onLine) return;

  const database = await initOfflineDB();
  const pendingRequests = await database.getAllFromIndex(
    PENDING_REQUESTS_STORE, 
    'by-timestamp'
  );
  
  // Sort by priority (higher number = higher priority)
  pendingRequests.sort((a, b) => b.priority - a.priority);
  
  for (const request of pendingRequests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined
      });
      
      if (response.ok) {
        // Request succeeded, remove from queue
        await database.delete(PENDING_REQUESTS_STORE, request.id);
        
        // If applicable, update the cached data
        if (request.entityId && (request.method === 'POST' || request.method === 'PUT')) {
          try {
            const responseData = await response.json();
            await cacheData(
              `${request.entityType}:${request.entityId}`,
              responseData,
              request.entityType,
              request.entityId
            );
          } catch (e) {
            console.warn('Failed to update cache after successful sync', e);
          }
        }
      } else {
        // Request failed but may succeed later
        request.retryCount++;
        
        // Keep in queue if we haven't tried too many times
        if (request.retryCount < 5) {
          await database.put(PENDING_REQUESTS_STORE, request);
        } else {
          // Too many retries, remove from queue
          await database.delete(PENDING_REQUESTS_STORE, request.id);
          console.error(`Failed to sync request after ${request.retryCount} attempts:`, request);
        }
      }
    } catch (error) {
      console.error('Error processing queued request:', error);
      
      // Network error, increment retry counter and continue
      request.retryCount++;
      if (request.retryCount < 5) {
        await database.put(PENDING_REQUESTS_STORE, request);
      } else {
        await database.delete(PENDING_REQUESTS_STORE, request.id);
      }
    }
  }
}

/**
 * Cache data for offline use
 */
export async function cacheData(
  key: string,
  data: any,
  entityType: string,
  entityId: string,
  duration: number = CACHE_DURATION.MEDIUM
): Promise<void> {
  const database = await initOfflineDB();
  const timestamp = Date.now();
  
  const cachedItem: CachedData = {
    key,
    data,
    timestamp,
    entityType,
    entityId,
    expiresAt: duration > 0 ? timestamp + duration : undefined
  };
  
  await database.put(CACHED_DATA_STORE, cachedItem);
}

/**
 * Get cached data
 */
export async function getCachedData<T = any>(key: string): Promise<T | null> {
  const database = await initOfflineDB();
  const cachedItem = await database.get(CACHED_DATA_STORE, key);
  
  if (!cachedItem) return null;
  
  // Check if data has expired
  if (cachedItem.expiresAt && cachedItem.expiresAt < Date.now()) {
    await database.delete(CACHED_DATA_STORE, key);
    return null;
  }
  
  return cachedItem.data as T;
}

/**
 * Get all cached data for an entity type
 */
export async function getAllCachedByType<T = any>(entityType: string): Promise<T[]> {
  const database = await initOfflineDB();
  const cachedItems = await database.getAllFromIndex(CACHED_DATA_STORE, 'by-entity', entityType);
  
  // Filter out expired items
  const now = Date.now();
  const validItems = cachedItems.filter(item => !item.expiresAt || item.expiresAt > now);
  
  return validItems.map(item => item.data) as T[];
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  const database = await initOfflineDB();
  const cachedItems = await database.getAll(CACHED_DATA_STORE);
  const now = Date.now();
  let count = 0;
  
  for (const item of cachedItems) {
    if (item.expiresAt && item.expiresAt < now) {
      await database.delete(CACHED_DATA_STORE, item.key);
      count++;
    }
  }
  
  return count;
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  const database = await initOfflineDB();
  await database.clear(CACHED_DATA_STORE);
}

/**
 * Get pending request count
 */
export async function getPendingRequestCount(): Promise<number> {
  const database = await initOfflineDB();
  return await database.count(PENDING_REQUESTS_STORE);
}

/**
 * Setup event listeners for online/offline events
 */
export function setupOfflineDataListeners(): void {
  // Process queue when coming back online
  window.addEventListener('online', () => {
    console.log('Connection restored, processing offline queue');
    processQueue();
  });
  
  // Periodically clean up expired cache
  setInterval(clearExpiredCache, 60 * 60 * 1000); // Every hour
}

/**
 * Initialize the offline data system
 */
export function initOfflineData(): void {
  initOfflineDB().then(() => {
    console.log('Offline database initialized');
    setupOfflineDataListeners();
    
    // Process queue on startup if online
    if (navigator.onLine) {
      processQueue();
    }
  }).catch(error => {
    console.error('Failed to initialize offline database:', error);
  });
} 