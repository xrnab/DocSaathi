const DB_NAME = "DocSaathiOfflineDB";
const DB_VERSION = 2;

export const SYNC_ACTIONS = {
  BOOK_APPOINTMENT: "BOOK_APPOINTMENT",
  CANCEL_APPOINTMENT: "CANCEL_APPOINTMENT",
  SUBMIT_SYMPTOMS: "SUBMIT_SYMPTOMS",
  CREATE_ASHA_FAMILY: "CREATE_ASHA_FAMILY",
  ADD_FAMILY_MEMBER: "ADD_FAMILY_MEMBER",
  RECORD_VACCINATION: "RECORD_VACCINATION"
};

function getDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in browser environments"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("syncQueue")) {
        const queueStore = db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
        queueStore.createIndex("status", "status", { unique: false });
        queueStore.createIndex("createdAt", "createdAt", { unique: false });
        queueStore.createIndex("type", "type", { unique: false });
      }

      if (!db.objectStoreNames.contains("cachedData")) {
        const cacheStore = db.createObjectStore("cachedData", { keyPath: "cacheKey" });
        cacheStore.createIndex("cachedAt", "cachedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("ashaFamilies")) {
        const familyStore = db.createObjectStore("ashaFamilies", { keyPath: "localId", autoIncrement: true });
        familyStore.createIndex("serverId", "serverId", { unique: false });
        familyStore.createIndex("village", "village", { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function enqueueAction(type, payload, optimistic = null) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const item = {
      type,
      payload,
      optimistic,
      status: "PENDING",
      retries: 0,
      createdAt: Date.now(),
      error: null
    };
    const request = store.add(item);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function getPendingActions() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readonly");
    const store = tx.objectStore("syncQueue");
    const request = store.getAll();

    request.onsuccess = () => {
      const actions = request.result || [];
      const pending = actions
        .filter(item => item.status === "PENDING" || item.status === "FAILED")
        .sort((a, b) => a.createdAt - b.createdAt);
      resolve(pending);
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function getPendingCount() {
  const actions = await getPendingActions();
  return actions.length;
}

async function updateActionStatus(id, updates) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (!item) {
        reject(new Error(`Action with id ${id} not found`));
        return;
      }
      const updatedItem = { ...item, ...updates };
      const putReq = store.put(updatedItem);
      putReq.onsuccess = () => resolve(true);
      putReq.onerror = (event) => reject(event.target.error);
    };
    getReq.onerror = (event) => reject(event.target.error);
  });
}

export async function markSyncing(id) {
  return updateActionStatus(id, { status: "SYNCING" });
}

export async function markDone(id) {
  return updateActionStatus(id, { status: "DONE", error: null });
}

export async function markFailed(id, error) {
  return updateActionStatus(id, { status: "FAILED", error: error?.message || String(error) });
}

export async function incrementRetry(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (!item) {
        reject(new Error(`Action with id ${id} not found`));
        return;
      }
      const updatedItem = { ...item, retries: (item.retries || 0) + 1 };
      const putReq = store.put(updatedItem);
      putReq.onsuccess = () => resolve(updatedItem.retries);
      putReq.onerror = (event) => reject(event.target.error);
    };
    getReq.onerror = (event) => reject(event.target.error);
  });
}

export async function saveToCache(cacheKey, data, ttlMs) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cachedData", "readwrite");
    const store = tx.objectStore("cachedData");
    const cacheItem = {
      cacheKey,
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttlMs
    };
    const request = store.put(cacheItem);
    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function getFromCache(cacheKey) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cachedData", "readwrite");
    const store = tx.objectStore("cachedData");
    const request = store.get(cacheKey);

    request.onsuccess = () => {
      const item = request.result;
      if (!item) {
        resolve(null);
        return;
      }
      if (Date.now() > item.expiresAt) {
        // Expired, delete from cache asynchronously
        store.delete(cacheKey);
        resolve(null);
      } else {
        resolve(item.data);
      }
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function clearCache(cacheKey) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cachedData", "readwrite");
    const store = tx.objectStore("cachedData");
    const request = store.delete(cacheKey);
    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function saveAshaFamilyOffline(family) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ashaFamilies", "readwrite");
    const store = tx.objectStore("ashaFamilies");
    // Ensure offline families have a temporary id tag and empty members array
    const record = {
      ...family,
      members: family.members || [],
      serverId: null,
      createdAt: new Date().toISOString()
    };
    const request = store.add(record);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function getAllAshaFamiliesOffline() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ashaFamilies", "readonly");
    const store = tx.objectStore("ashaFamilies");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function setAshaFamilyServerId(localId, serverId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ashaFamilies", "readwrite");
    const store = tx.objectStore("ashaFamilies");
    const getReq = store.get(localId);

    getReq.onsuccess = () => {
      const family = getReq.result;
      if (!family) {
        reject(new Error(`AshaFamily with localId ${localId} not found`));
        return;
      }
      const updatedFamily = { ...family, serverId };
      const putReq = store.put(updatedFamily);
      putReq.onsuccess = () => resolve(true);
      putReq.onerror = (event) => reject(event.target.error);
    };
    getReq.onerror = (event) => reject(event.target.error);
  });
}
