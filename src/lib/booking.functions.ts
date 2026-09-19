/** Offline gateway: SQLite stays in Electron's privileged main process. */
type Payload<T> = { data: T };

type DemoDb = {
  salles: Array<{ id: string; name: string; gerant_id: string; created_at: string }>;
  reservations: Array<Record<string, any>>;
  versements: Array<Record<string, any>>;
  remises: Array<Record<string, any>>;
};

const DEMO_DB_KEY = "salle-des-fetes-demo-db-v1";

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const nowIso = () => new Date().toISOString();

const defaultSalles = [
  {
    id: "demo-salle-01",
    name: "Salle 01 (Henna, Fatha+Henna, Événements)",
    gerant_id: "offline-user",
    created_at: nowIso(),
  },
  {
    id: "demo-salle-02",
    name: "Salle 02 (Fatha & Événements)",
    gerant_id: "offline-user",
    created_at: nowIso(),
  },
];

function readDemoDb(): DemoDb {
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDb;
      if (parsed && Array.isArray(parsed.salles) && Array.isArray(parsed.reservations)) {
        return {
          salles: parsed.salles,
          reservations: parsed.reservations,
          versements: parsed.versements ?? [],
          remises: parsed.remises ?? [],
        };
      }
    }
  } catch {
    // ignore malformed storage and reseed below
  }

  const seeded: DemoDb = {
    salles: defaultSalles,
    reservations: [],
    versements: [],
    remises: [],
  };
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seeded));
  return seeded;
}

function writeDemoDb(db: DemoDb) {
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
}

function hydrateDemoRows(rows: Array<Record<string, any>>): Array<Record<string, any>> {
  const db = readDemoDb();
  return rows.map((r) => ({
    ...r,
    versements: db.versements.filter((v) => v.reservation_id === r.id),
    remises: db.remises.filter((x) => x.reservation_id === r.id),
  }));
}

function demoCall<T, R>(operation: string, payload: Payload<T>): Promise<R> {
  const db = readDemoDb();

  const conflict = (data: any) => {
    if (!data || !data.salle_id || !data.date || !data.slot) return null;
    return db.reservations.find(
      (r) =>
        r.salle_id === data.salle_id &&
        r.date === data.date &&
        r.slot === data.slot &&
        r.status !== "cancelled" &&
        (!data.id || r.id !== data.id),
    );
  };

  switch (operation) {
    case "getManagerMonth": {
      const { month } = payload.data as { month: string };
      const monthStart = `${month}-01`;
      const monthEnd = `${month}-31`;
      const filtered = db.reservations.filter(
        (r) => r.date >= monthStart && r.date <= monthEnd,
      );
      return Promise.resolve({
        isAdmin: true,
        userId: "offline-user",
        salles: db.salles,
        gerants: [],
        reservations: hydrateDemoRows(filtered),
      }) as Promise<R>;
    }
    case "getRevenue": {
      const { year } = payload.data as { year: number };
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      const filtered = db.reservations.filter(
        (r) => r.date >= start && r.date <= end,
      );
      return Promise.resolve({
        isAdmin: true,
        gerants: [],
        rows: hydrateDemoRows(filtered),
      }) as Promise<R>;
    }
    case "createSalle": {
      const next = {
        id: makeId(),
        name: String((payload.data as { name: string }).name).trim(),
        gerant_id: "offline-user",
        created_at: nowIso(),
      };
      db.salles.push(next);
      writeDemoDb(db);
      return Promise.resolve({ ok: true }) as Promise<R>;
    }
    case "saveReservation": {
      const data = payload.data as any;
      if (conflict(data)) {
        throw new Error("Ce créneau est déjà réservé.");
      }
      const fields = [
        "salle_id",
        "date",
        "slot",
        "event_type",
        "event_time",
        "event_end_time",
        "cooking_lab_id",
        "client_name",
        "client_phone",
        "status",
        "total_amount",
        "id_card_number",
        "id_card_delivery_date",
        "id_card_delivery_place",
        "id_card_status",
        "id_card_front_url",
        "id_card_back_url",
        "note",
      ];

      if (data.id) {
        const index = db.reservations.findIndex((r) => r.id === data.id);
        if (index < 0) throw new Error("Réservation introuvable.");
        db.reservations[index] = {
          ...db.reservations[index],
          ...Object.fromEntries(fields.map((key) => [key, data[key] ?? null])),
          updated_at: nowIso(),
        };
        writeDemoDb(db);
        return Promise.resolve({ ok: true, id: data.id }) as Promise<R>;
      }

      const newId = makeId();
      const reservation = {
        id: newId,
        gerant_id: "offline-user",
        created_at: nowIso(),
        ...Object.fromEntries(fields.map((key) => [key, data[key] ?? null])),
      };
      db.reservations.push(reservation);
      writeDemoDb(db);
      return Promise.resolve({ ok: true, id: newId }) as Promise<R>;
    }
    case "setReservationStatus": {
      const { id, status } = payload.data as { id: string; status: string };
      const idx = db.reservations.findIndex((r) => r.id === id);
      if (idx >= 0) {
        db.reservations[idx].status = status;
        writeDemoDb(db);
      }
      return Promise.resolve({ ok: true }) as Promise<R>;
    }
    case "updateIdCardStatus": {
      const { id, status, number } = payload.data as {
        id: string;
        status: string;
        number?: string | null;
      };
      const idx = db.reservations.findIndex((r) => r.id === id);
      if (idx >= 0) {
        db.reservations[idx].id_card_status = status;
        if (number !== undefined && number !== null) {
          db.reservations[idx].id_card_number = number;
        }
        writeDemoDb(db);
      }
      return Promise.resolve({ ok: true }) as Promise<R>;
    }
    case "deleteReservation": {
      const { id } = payload.data as { id: string };
      db.reservations = db.reservations.filter((r) => r.id !== id);
      db.versements = db.versements.filter((v) => v.reservation_id !== id);
      db.remises = db.remises.filter((r) => r.reservation_id !== id);
      writeDemoDb(db);
      return Promise.resolve({ ok: true }) as Promise<R>;
    }
    case "addVersement": {
      const item = {
        id: makeId(),
        reservation_id: (payload.data as any).reservation_id,
        amount: Number((payload.data as any).amount),
        payment_date: (payload.data as any).payment_date,
        payment_method: (payload.data as any).payment_method,
        note: (payload.data as any).note ?? null,
        created_by: "offline-user",
        created_at: nowIso(),
      };
      db.versements.push(item);
      writeDemoDb(db);
      return Promise.resolve({ ok: true }) as Promise<R>;
    }
    case "deleteVersement": {
      const { id } = payload.data as { id: string };
      db.versements = db.versements.filter((v) => v.id !== id);
      writeDemoDb(db);
      return Promise.resolve({ ok: true }) as Promise<R>;
    }
    case "addRemise": {
      const data = payload.data as any;
      if (data.type === "percentage" && Number(data.value) > 100) {
        throw new Error("La remise en pourcentage ne peut dépasser 100 %.");
      }
      const item = {
        id: makeId(),
        reservation_id: data.reservation_id,
        type: data.type,
        value: Number(data.value),
        comment: data.comment ?? null,
        applied_by: "offline-user",
        created_at: nowIso(),
      };
      db.remises.push(item);
      writeDemoDb(db);
      return Promise.resolve({ ok: true }) as Promise<R>;
    }
    default:
      return Promise.reject(new Error(`Opération non prise en charge en mode démo: ${operation}`)) as Promise<R>;
  }
}

function call<T, R>(operation: string, payload: Payload<T>): Promise<R> {
  if (!window.desktop?.database) {
    return demoCall(operation, payload);
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
