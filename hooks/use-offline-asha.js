"use client";

import { useState, useEffect, useCallback } from "react";
import { useOfflineSyncCtx } from "@/components/offline-sync-provider";
import {
  saveToCache,
  getFromCache,
  saveAshaFamilyOffline,
  getAllAshaFamiliesOffline
} from "@/lib/offline-db";
import {
  getAshaFamilies,
  createAshaFamily,
  addAshaFamilyMember,
  updateMemberImmunisations
} from "@/actions/asha";

const CACHE_KEY = "asha-families";
const CACHE_TTL_12H = 12 * 60 * 60 * 1000; // 12 hours

export function useOfflineAsha() {
  const { isOnline, enqueue } = useOfflineSyncCtx();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFamilies = useCallback(async () => {
    setLoading(true);
    try {
      let serverFamilies = [];
      if (isOnline) {
        try {
          serverFamilies = await getAshaFamilies();
          await saveToCache(CACHE_KEY, serverFamilies, CACHE_TTL_12H);
        } catch (serverErr) {
          console.error("Failed to fetch fresh ASHA families from server:", serverErr);
          serverFamilies = (await getFromCache(CACHE_KEY)) || [];
        }
      } else {
        serverFamilies = (await getFromCache(CACHE_KEY)) || [];
      }

      // Fetch offline-added families
      const offlineFamilies = await getAllAshaFamiliesOffline();
      const unsyncedFamilies = offlineFamilies
        .filter(fam => !fam.serverId)
        .map(fam => ({
          ...fam,
          id: fam.localId, // Map localId to standard id for compatibility
          _pendingSync: true
        }));

      // Merge server + unsynced local families
      const merged = [...unsyncedFamilies, ...serverFamilies];
      setFamilies(merged);
    } catch (e) {
      console.error("Failed to load ASHA families registry:", e);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  const createFamily = useCallback(async (data) => {
    if (isOnline) {
      const result = await createAshaFamily(data);
      await loadFamilies();
      return { queued: false, result };
    } else {
      // 1. Save family in offline IndexedDB registry
      const localId = await saveAshaFamilyOffline(data);
      
      // 2. Enqueue server action CREATE_ASHA_FAMILY
      await enqueue("CREATE_ASHA_FAMILY", {
        ...data,
        localId
      });

      // 3. Optimistic UI update
      const newOfflineFamily = {
        ...data,
        id: localId,
        localId,
        members: [],
        serverId: null,
        _pendingSync: true,
        createdAt: new Date().toISOString()
      };
      setFamilies(prev => [newOfflineFamily, ...prev]);

      return { queued: true, localId };
    }
  }, [isOnline, enqueue, loadFamilies]);

  const addMember = useCallback(async (familyId, memberData) => {
    if (isOnline) {
      const result = await addAshaFamilyMember({
        familyId,
        ...memberData
      });
      await loadFamilies();
      return { queued: false, result };
    } else {
      // 1. Enqueue server action ADD_FAMILY_MEMBER
      const payload = {
        familyId,
        ...memberData
      };
      await enqueue("ADD_FAMILY_MEMBER", payload);

      // 2. Optimistic UI update: Append member to local state family
      setFamilies(prev => prev.map(fam => {
        if (fam.id === familyId || fam.localId === familyId) {
          const updatedMembers = [...(fam.members || [])];
          updatedMembers.push({
            id: `local-mem-${Date.now()}`,
            familyId,
            ...memberData,
            createdAt: new Date().toISOString()
          });
          return { ...fam, members: updatedMembers };
        }
        return fam;
      }));

      return { queued: true };
    }
  }, [isOnline, enqueue, loadFamilies]);

  const recordVaccination = useCallback(async (payload) => {
    if (isOnline) {
      const result = await updateMemberImmunisations(payload.memberId, payload.immunisations);
      await loadFamilies();
      return { queued: false, result };
    } else {
      await enqueue("RECORD_VACCINATION", {
        memberId: payload.memberId,
        immunisations: payload.immunisations
      });

      // Optimistically update vaccination record in the UI
      setFamilies(prev => prev.map(fam => {
        const hasMember = fam.members?.some(m => m.id === payload.memberId);
        if (hasMember) {
          const updatedMembers = fam.members.map(m => {
            if (m.id === payload.memberId) {
              return { ...m, immunisations: payload.immunisations };
            }
            return m;
          });
          return { ...fam, members: updatedMembers };
        }
        return fam;
      }));

      return { queued: true };
    }
  }, [isOnline, enqueue, loadFamilies]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  return {
    families,
    loading,
    createFamily,
    addMember,
    recordVaccination,
    refresh: loadFamilies
  };
}
