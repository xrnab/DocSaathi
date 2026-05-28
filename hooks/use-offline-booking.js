"use client";

import { useState, useCallback } from "react";
import { useOfflineSyncCtx } from "@/components/offline-sync-provider";
import { bookAppointment } from "@/actions/appointments";

export function useOfflineBooking() {
  const { isOnline, enqueue } = useOfflineSyncCtx();
  const [isPending, setIsPending] = useState(false);

  const book = useCallback(async (payload) => {
    setIsPending(true);
    try {
      if (isOnline) {
        // If payload is a raw object, convert to FormData since bookAppointment expects it
        let formData = payload;
        if (!(payload instanceof FormData)) {
          formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }
        const result = await bookAppointment(formData);
        setIsPending(false);
        return { queued: false, result };
      } else {
        // Serialize FormData entries to a plain object for IndexedDB compatibility
        const serializablePayload = {};
        if (payload instanceof FormData) {
          payload.forEach((value, key) => {
            serializablePayload[key] = value;
          });
        } else {
          Object.assign(serializablePayload, payload);
        }

        const localId = await enqueue("BOOK_APPOINTMENT", serializablePayload, {
          ...serializablePayload,
          isOptimistic: true
        });
        setIsPending(false);
        return { queued: true, localId };
      }
    } catch (e) {
      setIsPending(false);
      throw e;
    }
  }, [isOnline, enqueue]);

  return { book, isPending };
}
