import {
  getPendingActions,
  markSyncing,
  markDone,
  markFailed,
  incrementRetry,
  setAshaFamilyServerId,
  getAllAshaFamiliesOffline
} from "./offline-db";

let _isRunning = false;
let _syncIntervalId = null;
let _onSyncCompleteCallback = null;

export function startSyncEngine(onSyncComplete) {
  if (typeof window === "undefined") return;

  _onSyncCompleteCallback = onSyncComplete;

  // 1. If online, flush immediately
  if (navigator.onLine) {
    _flush();
  }

  // 2. Event listener for network status changes
  window.addEventListener("online", _handleOnlineEvent);

  // 3. 30-second polling interval
  if (!_syncIntervalId) {
    _syncIntervalId = setInterval(() => {
      if (navigator.onLine) {
        _flush();
      }
    }, 30000);
  }
}

export function stopSyncEngine() {
  if (typeof window === "undefined") return;

  window.removeEventListener("online", _handleOnlineEvent);
  if (_syncIntervalId) {
    clearInterval(_syncIntervalId);
    _syncIntervalId = null;
  }
  _onSyncCompleteCallback = null;
}

function _handleOnlineEvent() {
  _flush();
}

async function _flush() {
  if (_isRunning) return;
  _isRunning = true;

  let syncedCount = 0;
  let failedCount = 0;

  try {
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      // Skip items with too many retries (>= 5)
      if (action.retries >= 5) {
        continue;
      }

      await markSyncing(action.id);

      try {
        await _dispatch(action);
        await markDone(action.id);
        syncedCount++;
      } catch (err) {
        console.error(`Sync Engine: Failed to dispatch action ${action.id}:`, err);
        await incrementRetry(action.id);
        await markFailed(action.id, err);
        failedCount++;
      }
    }
  } catch (globalErr) {
    console.error("Sync Engine global flush error:", globalErr);
  } finally {
    _isRunning = false;
    if ((syncedCount > 0 || failedCount > 0) && typeof _onSyncCompleteCallback === "function") {
      _onSyncCompleteCallback({ synced: syncedCount, failed: failedCount });
    }
  }
}

async function _dispatch(action) {
  const { type, payload } = action;

  switch (type) {
    case "BOOK_APPOINTMENT": {
      const { bookAppointment } = await import("@/actions/appointments");
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });
      const result = await bookAppointment(formData);
      if (!result || !result.success) {
        throw new Error(result?.error || "Booking failed");
      }
      break;
    }

    case "CANCEL_APPOINTMENT": {
      const { cancelAppointment } = await import("@/actions/appointments");
      // Assuming cancelAppointment expects appointmentId or formData
      const result = await cancelAppointment(payload.appointmentId || payload);
      if (!result || !result.success) {
        throw new Error(result?.error || "Cancellation failed");
      }
      break;
    }

    case "SUBMIT_SYMPTOMS": {
      const { submitSymptomReport } = await import("@/actions/outbreak");
      const result = await submitSymptomReport(payload);
      if (!result || !result.success) {
        throw new Error(result?.error || "Symptom submission failed");
      }
      break;
    }

    case "CREATE_ASHA_FAMILY": {
      const { createAshaFamily } = await import("@/actions/asha");
      // Extract localId from payload so we don't send it to the server
      const { localId, ...serverData } = payload;
      const result = await createAshaFamily(serverData);
      
      if (result && result.success && result.family?.id) {
        if (localId) {
          await setAshaFamilyServerId(Number(localId), result.family.id);
        }
      } else {
        throw new Error("Failed to create ASHA family on server");
      }
      break;
    }

    case "ADD_FAMILY_MEMBER": {
      const { addAshaFamilyMember } = await import("@/actions/asha");
      let resolvedFamilyId = payload.familyId;

      // If the familyId is a temporary/local ID (i.e. not a UUID), let's try to resolve it
      if (typeof resolvedFamilyId === "number" || (typeof resolvedFamilyId === "string" && resolvedFamilyId.length < 10)) {
        const localFamilies = await getAllAshaFamiliesOffline();
        const matched = localFamilies.find(f => f.localId === Number(resolvedFamilyId) || f.id === resolvedFamilyId);
        if (matched && matched.serverId) {
          resolvedFamilyId = matched.serverId;
        } else {
          throw new Error("Cannot add family member: Parent family registry has not been synced to server yet.");
        }
      }

      const result = await addAshaFamilyMember({
        ...payload,
        familyId: resolvedFamilyId
      });
      if (!result || !result.success) {
        throw new Error("Failed to add family member to server");
      }
      break;
    }

    case "RECORD_VACCINATION": {
      const { updateMemberImmunisations } = await import("@/actions/asha");
      const result = await updateMemberImmunisations(payload.memberId, payload.immunisations);
      if (!result || !result.success) {
        throw new Error("Failed to sync immunisation records to server");
      }
      break;
    }

    case "CREATE_OUTBREAK_REPORT": {
      const { createOutbreakReport } = await import("@/actions/asha");
      const result = await createOutbreakReport(payload);
      if (!result || !result.success) {
        throw new Error("Failed to sync outbreak report to server");
      }
      break;
    }

    case "BOOK_ASHA_APPOINTMENT": {
      const { bookAshaPatientAppointment } = await import("@/actions/asha");
      const result = await bookAshaPatientAppointment(payload);
      if (!result || !result.success) {
        throw new Error("Failed to sync ASHA proxy booking to server");
      }
      break;
    }

    default:
      throw new Error(`Sync Engine: Unknown action type '${type}'`);
  }
}
