import { useState, useEffect, useCallback } from 'react';

export interface QueueItem {
  /** tRPC procedure path, e.g. "dailyReport.create" */
  procedure: string;
  /** The JSON input for the procedure */
  input: Record<string, any>;
  /** Timestamp when the item was queued */
  timestamp: number;
  /** Optional: display label for UI (e.g. patient name + period) */
  label?: string;
}

const QUEUE_KEY = 'padcom-offline-queue';

function getQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Send a tRPC mutation via HTTP POST.
 * tRPC v11 mutations use POST /api/trpc/<procedure>
 * with body: { json: <input> }
 * Validates HTTP status AND checks for tRPC-level errors.
 */
async function sendTrpcMutation(procedure: string, input: Record<string, any>): Promise<boolean> {
  try {
    const resp = await fetch(`/api/trpc/${procedure}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: input }),
      credentials: 'include',
    });

    if (!resp.ok) {
      console.warn(`[OfflineSync] HTTP ${resp.status} for ${procedure}`);
      return false;
    }

    const data = await resp.json();
    if (data?.error) {
      console.warn(`[OfflineSync] tRPC error for ${procedure}:`, data.error);
      return false;
    }

    return true;
  } catch (err) {
    console.warn(`[OfflineSync] Network error for ${procedure}:`, err);
    return false;
  }
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(getQueue().length);
  const [syncing, setSyncing] = useState(false);
  const [pendingItems, setPendingItems] = useState<QueueItem[]>(getQueue());

  const refreshState = useCallback(() => {
    const q = getQueue();
    setQueueLength(q.length);
    setPendingItems([...q]);
  }, []);

  // Internal sync function (not wrapped in useCallback to avoid stale closure)
  const doSync = async () => {
    if (!navigator.onLine) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    const failed: QueueItem[] = [];

    for (const item of queue) {
      const success = await sendTrpcMutation(item.procedure, item.input);
      if (!success) {
        failed.push(item);
      }
    }

    saveQueue(failed);
    setQueueLength(failed.length);
    setPendingItems([...failed]);
    setSyncing(false);
  };

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      doSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'OFFLINE_QUEUE_ADD') {
        const queue = getQueue();
        queue.push(event.data.payload);
        saveQueue(queue);
        refreshState();
      }
      if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
        doSync();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, []);

  const syncQueue = useCallback(async () => {
    if (syncing) return;
    await doSync();
  }, [syncing]);

  const addToQueue = useCallback((item: QueueItem) => {
    const queue = getQueue();
    queue.push(item);
    saveQueue(queue);
    refreshState();
  }, [refreshState]);

  const clearQueue = useCallback(() => {
    saveQueue([]);
    setQueueLength(0);
    setPendingItems([]);
  }, []);

  return {
    isOnline,
    queueLength,
    syncing,
    syncQueue,
    addToQueue,
    clearQueue,
    pendingItems,
  };
}

// Register service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
    });
  }
}
