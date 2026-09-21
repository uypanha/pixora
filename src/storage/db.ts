import { PixoraDocument } from '../types/document';

export interface RecentProjectItem {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  objectCount: number;
  pageCount: number;
  thumbnail?: string;
  data: PixoraDocument;
}

const DB_NAME = 'pixora_db';
const DB_VERSION = 1;
const STORE_ACTIVE = 'active_project';
const STORE_RECENTS = 'recent_projects';

function getIndexedDB(): IDBFactory | null {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB;
  }
  return null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const idb = getIndexedDB();
    if (!idb) {
      return reject(new Error('IndexedDB is not available in this environment.'));
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ACTIVE)) {
        db.createObjectStore(STORE_ACTIVE);
      }
      if (!db.objectStoreNames.contains(STORE_RECENTS)) {
        db.createObjectStore(STORE_RECENTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save active project for local recovery and autosave
 */
export async function saveActiveProject(doc: PixoraDocument): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ACTIVE, STORE_RECENTS], 'readwrite');
      const activeStore = tx.objectStore(STORE_ACTIVE);
      const recentsStore = tx.objectStore(STORE_RECENTS);

      activeStore.put(doc, 'current');

      const recentItem: RecentProjectItem = {
        id: doc.metadata.id,
        name: doc.metadata.name,
        updatedAt: doc.metadata.updatedAt,
        createdAt: doc.metadata.createdAt,
        objectCount: Object.keys(doc.objects).length,
        pageCount: doc.pages.length,
        thumbnail: doc.metadata.thumbnail,
        data: doc,
      };
      recentsStore.put(recentItem);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save to IndexedDB:', err);
  }
}

/**
 * Load active project from IndexedDB recovery
 */
export async function loadActiveProject(): Promise<PixoraDocument | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ACTIVE, 'readonly');
      const store = tx.objectStore(STORE_ACTIVE);
      const req = store.get('current');

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load from IndexedDB:', err);
    return null;
  }
}

/**
 * Clear the active recovery project
 */
export async function clearActiveProject(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ACTIVE, 'readwrite');
      const store = tx.objectStore(STORE_ACTIVE);
      store.delete('current');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear active project from IndexedDB:', err);
  }
}

/**
 * Get list of all recent local projects
 */
export async function getRecentProjects(): Promise<RecentProjectItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECENTS, 'readonly');
      const store = tx.objectStore(STORE_RECENTS);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result || []) as RecentProjectItem[];
        // Sort descending by updatedAt
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get recent projects from IndexedDB:', err);
    return [];
  }
}

/**
 * Delete a specific project from recents
 */
export async function deleteRecentProject(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_RECENTS, STORE_ACTIVE], 'readwrite');
      const recentsStore = tx.objectStore(STORE_RECENTS);
      const activeStore = tx.objectStore(STORE_ACTIVE);

      recentsStore.delete(id);

      // If active project is this one, clear it as well
      const reqActive = activeStore.get('current');
      reqActive.onsuccess = () => {
        if (reqActive.result && reqActive.result.metadata?.id === id) {
          activeStore.delete('current');
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete recent project:', err);
  }
}

/**
 * Clear all project data from local browser storage
 */
export async function clearAllProjects(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ACTIVE, STORE_RECENTS], 'readwrite');
      tx.objectStore(STORE_ACTIVE).clear();
      tx.objectStore(STORE_RECENTS).clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear all projects from IndexedDB:', err);
  }
}
