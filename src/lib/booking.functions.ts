/** Offline gateway: SQLite stays in Electron's privileged main process. */
type Payload<T> = { data: T };

function call<T, R>(operation: string, payload: Payload<T>): Promise<R> {
  if (!window.desktop?.database) {
    return Promise.reject(new Error("Cette application doit être lancée depuis la version Desktop."));
  }
  return window.desktop.database.call(operation, payload.data) as Promise<R>;
}

export const getManagerMonth = (p: Payload<{ month: string; gerant_id?: string | null }>): Promise<any> => call("getManagerMonth", p);
export const getRevenue = (p: Payload<{ year: number; gerant_id?: string | null }>): Promise<any> => call("getRevenue", p);
export const createSalle = (p: Payload<{ name: string }>) => call("createSalle", p);
export const saveReservation = (p: Payload<Record<string, unknown>>) => call("saveReservation", p);
export const setReservationStatus = (p: Payload<{ id: string; status: string }>) => call("setReservationStatus", p);
export const updateIdCardStatus = (p: Payload<{ id: string; status: string; number?: string | null }>) => call("updateIdCardStatus", p);
export const deleteReservation = (p: Payload<{ id: string }>) => call("deleteReservation", p);
export const addVersement = (p: Payload<Record<string, unknown>>) => call("addVersement", p);
export const deleteVersement = (p: Payload<{ id: string }>) => call("deleteVersement", p);
export const addRemise = (p: Payload<Record<string, unknown>>) => call("addRemise", p);
