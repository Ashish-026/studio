
/**
 * MANDI MONITOR - HIGH CAPACITY STORAGE ENGINE
 * This utility wraps the browser's IndexedDB API to provide 
 * high-capacity storage (GBs instead of MBs) for mobile devices.
 */

const DB_NAME = 'MandiMonitorDB';
const STORE_NAME = 'app_data';
const DB_VERSION = 1;

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getItem<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      let data = request.result;
      
      // MIGRATION LOGIC: If not in IndexedDB, check old localStorage
      if (data === undefined && typeof window !== 'undefined') {
        const legacyData = localStorage.getItem(key);
        if (legacyData) {
          try {
            data = JSON.parse(legacyData);
            // Move to IndexedDB for future use
            setItem(key, data);
            console.log(`Migrated ${key} to high-capacity storage.`);
          } catch (e) {
            console.error(`Failed to migrate legacy key: ${key}`, e);
          }
        }
      }
      resolve(data || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setItem(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function removeItem(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAll(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
        // Also clear legacy storage
        localStorage.clear();
        resolve();
    };
    request.onerror = () => reject(request.error);
  });
}
