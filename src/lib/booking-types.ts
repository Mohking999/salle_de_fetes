export type Slot = "journee" | "soiree";
export type ReservationStatus =
  "pending" | "confirmed" | "cancelled" | "blocked";

export type EventType = "henna" | "fatha_henna" | "fatha" | "event";
export type CookingLabId = "lab_1" | "lab_2" | "lab_3" | "none";
export type IdCardStatus = "not_provided" | "pending" | "verified";

export type Salle = { id: string; name: string; gerant_id: string };

export type Versement = {
  id: string;
  reservation_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  note: string | null;
};

export type Remise = {
  id: string;
  reservation_id: string;
  type: "percentage" | "fixed";
  value: number;
  comment: string | null;
  created_at: string;
};

export type Reservation = {
  id: string;
  salle_id: string;
  gerant_id: string;
  date: string;
  slot: Slot;
  client_name: string;
  client_phone: string | null;
  status: ReservationStatus;
  total_amount: number;
  note: string | null;
  created_at: string;
  versements: Versement[];
  remises: Remise[];
  // Extended fields
  event_type: EventType;
  cooking_lab_id: CookingLabId;
  id_card_number?: string | null;
  id_card_delivery_date?: string | null;
  id_card_delivery_place?: string | null;
  id_card_status: IdCardStatus;
  id_card_front_url?: string | null;
  id_card_back_url?: string | null;
  event_time?: string | null;
  event_end_time?: string | null;
};

export type AvailabilityCell = {
  id: string;
  salle_id: string;
  date: string;
  slot: Slot;
  status: ReservationStatus;
  event_type?: EventType;
  cooking_lab_id?: CookingLabId;
};

export const SLOTS: { value: Slot; label: string; shiftLabel: string }[] = [
  { value: "journee", label: "Jour (journee)", shiftLabel: "Jour" },
  { value: "soiree", label: "Nuit (soiree)", shiftLabel: "Nuit" },
];

export const SLOT_LABEL: Record<Slot, string> = {
  journee: "journee",
  soiree: "soiree",
};

export const SHIFT_LABEL: Record<Slot, string> = {
  journee: "Jour",
  soiree: "Nuit",
};

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  cancelled: "Annulee",
  blocked: "Bloquee",
};

export const EVENT_TYPES: {
  value: EventType;
  label: string;
  shortLabel: string;
  badgeCls: string;
  description: string;
  recommendedSalleName: string;
}[] = [
  {
    value: "henna",
    label: "Henna",
    shortLabel: "Henna",
    badgeCls:
      "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-800",
    description: "Ceremonie de Henna (Attribution automatique a la Salle 01)",
    recommendedSalleName: "Salle 01",
  },
  {
    value: "fatha_henna",
    label: "Fatha + Henna",
    shortLabel: "Fatha + Henna",
    badgeCls:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800",
    description:
      "Fatha suivie de la Henna (Attribution automatique a la Salle 01)",
    recommendedSalleName: "Salle 01",
  },
  {
    value: "fatha",
    label: "Fatha",
    shortLabel: "Fatha",
    badgeCls:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
    description: "Ceremonie de Fatha (Salle 02 ou Salle 01 au choix)",
    recommendedSalleName: "Salle 02",
  },
  {
    value: "event",
    label: "Événement Général / Mariage",
    shortLabel: "Événement",
    badgeCls:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
    description: "Reception generale, Mariage, Dîner d'honneur",
    recommendedSalleName: "Au choix",
  },
];

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  henna: "Henna",
  fatha_henna: "Fatha + Henna",
  fatha: "Fatha",
  event: "Événement Général / Mariage",
};

export const COOKING_LABS: {
  id: CookingLabId;
  name: string;
  tag: string;
  description: string;
  equipment: string[];
}[] = [
  {
    id: "lab_1",
    name: "Laboratoire Cuisine 01",
    tag: "Labo 01",
    description:
      "Grand Laboratoire de cuisine (Fours traiteur, pianos de cuisson & preparation plats chauds)",
    equipment: [
      "3 Grande Fours Professionnels",
      "Chambre Froide 12m³",
      "Piano 6 feux inox",
      "Poste Plonge Inox",
    ],
  },
  {
    id: "lab_2",
    name: "Laboratoire Cuisine 02",
    tag: "Labo 02",
    description:
      "Laboratoire de cuisine secondaire (Gateaux traditionnels, patisserie & entrees)",
    equipment: [
      "2 Fours Patissiers",
      "Batteurs Melangeurs 30L",
      "Tables de Dressage Inox",
      "Frigo Positif",
    ],
  },
  {
    id: "lab_3",
    name: "Laboratoire Cuisine 03",
    tag: "Labo 03",
    description:
      "Laboratoire de cuisine d'appoint (Preparation boissons, the traditional, cafe & collations)",
    equipment: [
      "Machines a Cafe & Samovars",
      "Distributeurs d'Eau Chaud/Froid",
      "Espace Rincage",
      "Etagere Vaisselle",
    ],
  },
  {
    id: "none",
    name: "Aucun Laboratoire",
    tag: "Sans Labo",
    description: "Pas de cuisine reservee pour cet événement",
    equipment: [],
  },
];

export const COOKING_LAB_LABEL: Record<CookingLabId, string> = {
  lab_1: "Laboratoire Cuisine 01",
  lab_2: "Laboratoire Cuisine 02",
  lab_3: "Laboratoire Cuisine 03",
  none: "Aucun Labo",
};

export const ID_CARD_STATUS_LABEL: Record<
  IdCardStatus,
  { label: string; badgeCls: string }
> = {
  not_provided: {
    label: "Non fournie",
    badgeCls:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  },
  pending: {
    label: "En attente de vérification",
    badgeCls:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  },
  verified: {
    label: "Pièce d'identité vérifiée",
    badgeCls:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  },
};

export const PAYMENT_METHODS = [
  "especes",
  "virement",
  "cheque",
  "carte",
] as const;

export function getRecommendedSalleId(
  eventType: EventType,
  salles: Salle[],
): string | null {
  if (salles.length === 0) return null;
  const salle01 = salles.find(
    (s) =>
      s.name.toLowerCase().includes("01") || s.name.toLowerCase().includes("1"),
  );
  const salle02 = salles.find(
    (s) =>
      s.name.toLowerCase().includes("02") || s.name.toLowerCase().includes("2"),
  );

  if (eventType === "henna" || eventType === "fatha_henna") {
    return salle01?.id ?? salles[0].id;
  }
  if (eventType === "fatha") {
    return salle02?.id ?? salles[0].id;
  }
  return salles[0].id;
}

export function isSalleAllowedForEvent(
  eventType: EventType,
  salleName: string,
): boolean {
  const isSalle01 =
    salleName.toLowerCase().includes("01") ||
    salleName.toLowerCase().includes("1");
  const isSalle02 =
    salleName.toLowerCase().includes("02") ||
    salleName.toLowerCase().includes("2");

  if (eventType === "henna" || eventType === "fatha_henna") {
    // Henna automatically preferred in Salle 01
    return true;
  }
  if (eventType === "fatha") {
    // Fatha can be in Salle 02 or Salle 01
    return true;
  }
  return true;
}

export function remiseAmount(total: number, remises: Remise[]): number {
  return remises.reduce(
    (acc, r) =>
      acc +
      (r.type === "percentage"
        ? (total * Number(r.value)) / 100
        : Number(r.value)),
    0,
  );
}

export function computeTotals(reservation: {
  total_amount: number;
  versements: Versement[];
  remises: Remise[];
}) {
  const total = Number(reservation.total_amount) || 0;
  const remise = Math.min(
    remiseAmount(total, reservation.remises ?? []),
    total,
  );
  const net = total - remise;
  const verse = (reservation.versements ?? []).reduce(
    (a, v) => a + Number(v.amount),
    0,
  );
  const reste = Math.max(net - verse, 0);
  return { total, remise, net, verse, reste };
}

export function formatMoney(value: number): string {
  return (
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value) +
    " DA"
  );
}

export function formatDateFr(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return dateStr;
  const [y, m, d] = parts;
  return new Intl.DateTimeFormat("fr-FR", options).format(
    new Date(y, m - 1, d),
  );
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export function daysInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  return Array.from(
    { length: count },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );
}
