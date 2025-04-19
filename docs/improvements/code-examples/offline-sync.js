/**
 * Offline Data Sync Implementation Example
 * 
 * This file demonstrates the pattern for implementing offline data synchronization
 * in the Cert Centre PWA using Dexie.js for IndexedDB and a custom sync manager.
 */

import Dexie from 'dexie';
import { fetchWithTimeout } from '@/lib/fetch-utils';

// 1. Database Setup
//------------------------------------------------------

// Define database schema
export class CertCentreDatabase extends Dexie {
  constructor() {
    super('CertCentreOfflineDB');
    
    // Define tables and schema
    this.version(1).stores({
      courses: 'id, title, lastModified, syncStatus',
      progress: 'id, courseId, userId, lastModified, syncStatus',
      quizAttempts: 'id, quizId, userId, lastModified, syncStatus, [quizId+userId]',
      syncQueue: '++id, operation, endpoint, payload, attempts, createdAt'
    });
    
    // Define typed tables
    this.courses = this.table('courses');
    this.progress = this.table('progress');
    this.quizAttempts = this.table('quizAttempts');
    this.syncQueue = this.table('syncQueue');
  }
}

// Create database instance
export const db = new CertCentreDatabase();

// 2. Sync Manager
//------------------------------------------------------

export class SyncManager {
  static SYNC_STATUS = {
    SYNCED: 'synced',       // Data is in sync with server
    MODIFIED: 'modified',   // Local changes, not yet synced
    SYNCING: 'syncing',     // Currently being synced
    CONFLICT: 'conflict',   // Sync conflict detected
    ERROR: 'error'          // Error occurred during sync
  };
  
  /**
   * Track local changes to data
   * @param {string} table - Database table name
   * @param {Object} data - Data to be saved
   * @returns {Promise<Object>} Saved data with sync status
   */
  static async trackChange(table, data) {
    const now = new Date().toISOString();
    
    const item = {
      ...data,
      lastModified: now,
      syncStatus: this.SYNC_STATUS.MODIFIED
    };
    
    // Save to database
    await db[table].put(item);
    
    // Add to sync queue
    await db.syncQueue.add({
      operation: 'update',
      endpoint: `/api/${table}/${data.id}`,
      payload: JSON.stringify(item),
      attempts: 0,
      createdAt: now
    });
    
    // Trigger sync if online
    if (navigator.onLine) {
      this.processQueue().catch(console.error);
    }
    
    return item;
  }
  
  /**
   * Process sync queue
   * @returns {Promise<void>}
   */
  static async processQueue() {
    // Get the next item from the queue
    const item = await db.syncQueue.orderBy('createdAt').first();
    
    if (!item) return; // Queue is empty
    
    try {
      // Update sync status
      const [tableName, itemId] = item.endpoint.split('/').slice(2);
      if (tableName && itemId) {
        const dbItem = await db[tableName].get(itemId);
        if (dbItem) {
          await db[tableName].update(itemId, { syncStatus: this.SYNC_STATUS.SYNCING });
        }
      }
      
      // Send data to server
      const response = await fetchWithTimeout(item.endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: item.payload,
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      // On success, update sync status and remove from queue
      if (tableName && itemId) {
        await db[tableName].update(itemId, { syncStatus: this.SYNC_STATUS.SYNCED });
      }
      
      await db.syncQueue.delete(item.id);
      
      // Continue processing queue
      return this.processQueue();
      
    } catch (error) {
      console.error('Sync error:', error);
      
      // Update sync status on failure
      const [tableName, itemId] = item.endpoint.split('/').slice(2);
      if (tableName && itemId) {
        await db[tableName].update(itemId, { 
          syncStatus: item.attempts >= 5 ? this.SYNC_STATUS.ERROR : this.SYNC_STATUS.MODIFIED 
        });
      }
      
      // Increment attempt count or remove if max attempts reached
      if (item.attempts >= 5) {
        await db.syncQueue.delete(item.id);
      } else {
        await db.syncQueue.update(item.id, { 
          attempts: item.attempts + 1 
        });
      }
    }
  }
  
  /**
   * Sync all modified data
   * @returns {Promise<void>}
   */
  static async syncAll() {
    if (!navigator.onLine) return;
    
    return this.processQueue();
  }
  
  /**
   * Get sync status information
   * @returns {Promise<Object>} Sync status statistics
   */
  static async getSyncStatus() {
    const queueCount = await db.syncQueue.count();
    const modifiedCourses = await db.courses.where('syncStatus').equals(this.SYNC_STATUS.MODIFIED).count();
    const modifiedProgress = await db.progress.where('syncStatus').equals(this.SYNC_STATUS.MODIFIED).count();
    const modifiedQuizzes = await db.quizAttempts.where('syncStatus').equals(this.SYNC_STATUS.MODIFIED).count();
    const errorItems = await db.syncQueue.where('attempts').aboveOrEqual(5).count();
    
    return {
      queueCount,
      modifiedItems: modifiedCourses + modifiedProgress + modifiedQuizzes,
      errorItems,
      isOnline: navigator.onLine
    };
  }
}

// 3. Service Worker Integration
//------------------------------------------------------

/**
 * Register background sync
 */
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Register for background sync
      await registration.sync.register('cert-centre-sync');
      console.log('Background sync registered!');
      
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

// 4. Usage Examples
//------------------------------------------------------

/**
 * Example: Save course progress with offline support
 * @param {string} courseId - Course ID
 * @param {number} progress - Progress percentage
 * @returns {Promise<Object>} Updated progress data
 */
export async function updateCourseProgress(courseId, progress) {
  const userId = 'current-user-id'; // Would come from auth context
  
  const progressData = {
    id: `${courseId}-${userId}`,
    courseId,
    userId,
    percentage: progress,
    lastAccessed: new Date().toISOString()
  };
  
  // Save with offline tracking
  return SyncManager.trackChange('progress', progressData);
}

/**
 * Example: React hook for sync status
 */
export function useSyncStatus() {
  const [status, setStatus] = React.useState({ 
    pendingChanges: 0, 
    isOnline: navigator.onLine 
  });
  
  React.useEffect(() => {
    // Update status initially and then every 5 seconds
    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    
    // Listen for online/offline events
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);
  
  async function updateStatus() {
    const syncStatus = await SyncManager.getSyncStatus();
    setStatus({
      pendingChanges: syncStatus.queueCount,
      isOnline: navigator.onLine
    });
  }
  
  function handleConnectionChange() {
    setStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    
    // Try to sync when coming back online
    if (navigator.onLine) {
      SyncManager.syncAll().catch(console.error);
    }
  }
  
  return status;
}

// Initialize background sync when online
if (navigator.onLine) {
  registerBackgroundSync().catch(console.error);
}

// Listen for online events to register sync
window.addEventListener('online', () => {
  registerBackgroundSync().catch(console.error);
  SyncManager.syncAll().catch(console.error);
}); 