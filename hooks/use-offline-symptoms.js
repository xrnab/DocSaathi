"use client";

import { useState, useCallback } from "react";
import { useOfflineSyncCtx } from "@/components/offline-sync-provider";
import { submitSymptomReport } from "@/actions/outbreak";

export function useOfflineSymptoms() {
  const { isOnline, enqueue } = useOfflineSyncCtx();
  const [isPending, setIsPending] = useState(false);

  const submitSymptoms = useCallback(async (payload) => {
    setIsPending(true);
    try {
      if (isOnline) {
        const result = await submitSymptomReport(payload);
        setIsPending(false);
        return { queued: false, result };
      } else {
        const localId = await enqueue("SUBMIT_SYMPTOMS", payload, {
          ...payload,
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

  return { submitSymptoms, isPending };
}
