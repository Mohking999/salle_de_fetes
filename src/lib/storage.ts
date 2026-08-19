/** Local storage utilities for offline mode - works on both client and server */

// Types for our data structures
export interface Salle {
  id: string;
  name: string;
  gerant_id: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  salle_id: string;
  gerant_id: string;
  date: string;
  slot: "journee" | "soiree";
  client_name: string;
  client_phone: string | null;
  note: string | null;
  status: "pending" | "confirmed" | "cancelled" | "blocked";
  total_amount: number;
  created_at: string;
  // Extended fields
  event_type: "henna" | "fatha_henna" | "fatha" | "event";
  cooking_lab_id: "lab_1" | "lab_2" | "lab_3" | "none";
  id_card_number?: string | null;
  id_card_delivery_date?: string | null;
  id_card_delivery_place?: string | null;
  id_card_status: "not_provided" | "pending" | "verified";
  id_card_front_url?: string | null;
  id_card_back_url?: string | null;
  event_time?: string | null;
}

export interface Versement {
  id: string;
  reservation_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface Remise {
  id: string;
  reservation_id: string;
  type: "percentage" | "fixed";
  value: number;
  comment: string | null;
  applied_by: string;
  created_at: string;
}

export interface StorageData {
  salles: Salle[];
  reservations: Reservation[];
  versements: Versement[];
  remises: Remise[];
}

const SALLE_1_ID = "11111111-1111-4111-a111-111111111111";
const SALLE_2_ID = "22222222-2222-4222-a222-222222222222";

function getInitialData(): StorageData {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");

  const res1Id = "r1111111-1111-4111-a111-111111111111";
  const res2Id = "r2222222-2222-4222-a222-222222222222";
  const res3Id = "r3333333-3333-4333-a333-333333333333";

  return {
    salles: [
      {
        id: SALLE_1_ID,
        name: "Salle 01 (Henna, Fatha+Henna, Evenements)",
        gerant_id: "offline-user",
        created_at: new Date().toISOString(),
      },
      {
        id: SALLE_2_ID,
        name: "Salle 02 (Fatha & Evenements)",
        gerant_id: "offline-user",
        created_at: new Date().toISOString(),
      },
    ],
    reservations: [
      {
        id: res1Id,
        salle_id: SALLE_1_ID,
        gerant_id: "offline-user",
        date: `${y}-${m}-12`,
        slot: "soiree",
        client_name: "Amine Benali",
        client_phone: "0550 12 34 56",
        note: "Soirée Henna traditionnelle. Traiteur avec 350 convives.",
        status: "confirmed",
        total_amount: 180000,
        event_type: "henna",
        cooking_lab_id: "lab_1",
        id_card_number: "109823471092837",
        id_card_delivery_date: "2021-04-15",
        id_card_delivery_place: "Alger Centre",
        id_card_status: "verified",
        id_card_front_url:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        id_card_back_url:
          "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80",
        created_at: new Date().toISOString(),
      },
      {
        id: res2Id,
        salle_id: SALLE_2_ID,
        gerant_id: "offline-user",
        date: `${y}-${m}-15`,
        slot: "journee",
        client_name: "Karim Mansouri",
        client_phone: "0661 98 76 54",
        note: "Ceremonie de Fatha familiale avec reception thé et gâteaux.",
        status: "confirmed",
        total_amount: 95000,
        event_type: "fatha",
        cooking_lab_id: "lab_2",
        id_card_number: "203948172635412",
        id_card_delivery_date: "2020-09-10",
        id_card_delivery_place: "Oran",
        id_card_status: "verified",
        created_at: new Date().toISOString(),
      },
      {
        id: res3Id,
        salle_id: SALLE_1_ID,
        gerant_id: "offline-user",
        date: `${y}-${m}-20`,
        slot: "journee",
        client_name: "Sofiane Touati",
        client_phone: "0770 44 55 66",
        note: "Fatha + Henna complete (Apres-midi Fatha & Henna).",
        status: "pending",
        total_amount: 220000,
        event_type: "fatha_henna",
        cooking_lab_id: "lab_3",
        id_card_number: "304918273645192",
        id_card_delivery_date: "2022-11-20",
        id_card_delivery_place: "Blida",
        id_card_status: "pending",
        created_at: new Date().toISOString(),
      },
    ],
    versements: [
      {
        id: "v1111111-1111-4111-a111-111111111111",
        reservation_id: res1Id,
        amount: 80000,
        payment_date: `${y}-${m}-01`,
        payment_method: "especes",
        note: "Acompte Henna",
        created_by: "offline-user",
        created_at: new Date().toISOString(),
      },
      {
        id: "v2222222-2222-4222-a222-222222222222",
        reservation_id: res2Id,
        amount: 50000,
        payment_date: `${y}-${m}-02`,
        payment_method: "virement",
        note: "Acompte Fatha",
        created_by: "offline-user",
        created_at: new Date().toISOString(),
      },
    ],
    remises: [],
  };
}

// Client-side storage using localStorage
export class ClientStorage {
  private static STORAGE_KEY = "salle_des_fetes_data_v2";

  static getData(): StorageData {
    if (typeof window === "undefined") {
      return getInitialData();
    }
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      const init = getInitialData();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(data);
  }

  static setData(data: StorageData): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static getSalles(): Salle[] {
    const data = this.getData();
    if (data.salles.length === 0) {
      data.salles = getInitialData().salles;
      this.setData(data);
    }
    return data.salles;
  }

  static getReservations(): Reservation[] {
    return this.getData().reservations;
  }

  static getVersements(): Versement[] {
    return this.getData().versements;
  }

  static getRemises(): Remise[] {
    return this.getData().remises;
  }

  static addSalle(salle: Omit<Salle, "id" | "created_at">): Salle {
    const data = this.getData();
    const newSalle: Salle = {
      ...salle,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    data.salles.push(newSalle);
    this.setData(data);
    return newSalle;
  }

  static addReservation(
    reservation: Omit<Reservation, "id" | "created_at">,
  ): Reservation {
    const data = this.getData();
    const newReservation: Reservation = {
      ...reservation,
      event_type: reservation.event_type ?? "event",
      cooking_lab_id: reservation.cooking_lab_id ?? "none",
      id_card_status: reservation.id_card_status ?? "not_provided",
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    data.reservations.push(newReservation);
    this.setData(data);
    return newReservation;
  }

  static updateReservation(id: string, updates: Partial<Reservation>): void {
    const data = this.getData();
    const index = data.reservations.findIndex((r) => r.id === id);
    if (index !== -1) {
      data.reservations[index] = { ...data.reservations[index], ...updates };
      this.setData(data);
    }
  }

  static deleteReservation(id: string): void {
    const data = this.getData();
    data.reservations = data.reservations.filter((r) => r.id !== id);
    this.setData(data);
  }

  static addVersement(
    versement: Omit<Versement, "id" | "created_at">,
  ): Versement {
    const data = this.getData();
    const newVersement: Versement = {
      ...versement,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    data.versements.push(newVersement);
    this.setData(data);
    return newVersement;
  }

  static deleteVersement(id: string): void {
    const data = this.getData();
    data.versements = data.versements.filter((v) => v.id !== id);
    this.setData(data);
  }

  static addRemise(remise: Omit<Remise, "id" | "created_at">): Remise {
    const data = this.getData();
    const newRemise: Remise = {
      ...remise,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    data.remises.push(newRemise);
    this.setData(data);
    return newRemise;
  }
}

// Server-side storage using in-memory storage (can be extended to use file system)
class ServerStorage {
  private static data: StorageData | null = null;

  static getData(): StorageData {
    if (!this.data || this.data.salles.length === 0) {
      this.data = getInitialData();
    }
    return this.data;
  }

  static setData(data: StorageData): void {
    this.data = data;
  }

  static getSalles(): Salle[] {
    return this.getData().salles;
  }

  static getReservations(): Reservation[] {
    return this.getData().reservations;
  }

  static getVersements(): Versement[] {
    return this.getData().versements;
  }

  static getRemises(): Remise[] {
    return this.getData().remises;
  }

  static addSalle(salle: Omit<Salle, "id" | "created_at">): Salle {
    const data = this.getData();
    const newSalle: Salle = {
      ...salle,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    data.salles.push(newSalle);
    return newSalle;
  }

  static addReservation(
    reservation: Omit<Reservation, "id" | "created_at">,
  ): Reservation {
    const data = this.getData();
    const newReservation: Reservation = {
      ...reservation,
      event_type: reservation.event_type ?? "event",
      cooking_lab_id: reservation.cooking_lab_id ?? "none",
      id_card_status: reservation.id_card_status ?? "not_provided",
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    data.reservations.push(newReservation);
    return newReservation;
  }

  static updateReservation(id: string, updates: Partial<Reservation>): void {
    const data = this.getData();
    const index = data.reservations.findIndex((r) => r.id === id);
    if (index !== -1) {
      data.reservations[index] = { ...data.reservations[index], ...updates };
    }
  }

  static deleteReservation(id: string): void {
    const data = this.getData();
    data.reservations = data.reservations.filter((r) => r.id !== id);
  }

  static addVersement(
    versement: Omit<Versement, "id" | "created_at">,
  ): Versement {
    const data = this.getData();
    const newVersement: Versement = {
      ...versement,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    data.versements.push(newVersement);
    return newVersement;
  }

  static deleteVersement(id: string): void {
    const data = this.getData();
    data.versements = data.versements.filter((v) => v.id !== id);
  }

  static addRemise(remise: Omit<Remise, "id" | "created_at">): Remise {
    const data = this.getData();
    const newRemise: Remise = {
      ...remise,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    data.remises.push(newRemise);
    return newRemise;
  }
}

export { ServerStorage };
