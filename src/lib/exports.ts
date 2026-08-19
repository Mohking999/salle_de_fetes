import * as XLSX from "xlsx";
import {
  computeTotals,
  daysInMonth,
  monthLabel,
  SLOT_LABEL,
  type Reservation,
  type Salle,
} from "./booking-types";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Registre mensuel : une ligne par jour, colonnes Journée / Nuit. */
export function exportMonthXlsx(
  month: string,
  reservations: Reservation[],
  salles: Salle[],
) {
  const wb = XLSX.utils.book_new();
  const targets = salles.length
    ? salles
    : [{ id: "", name: "Salle", gerant_id: "" }];

  for (const salle of targets) {
    const rows = daysInMonth(month).map((date) => {
      const find = (slot: string) =>
        reservations.find(
          (r) =>
            r.date === date &&
            r.slot === slot &&
            r.status !== "cancelled" &&
            (!salle.id || r.salle_id === salle.id),
        );
      const j = find("journee");
      const n = find("soiree");
      const jt = j ? computeTotals(j) : null;
      const nt = n ? computeTotals(n) : null;
      return {
        DATE: date,
        "JOUR-CLIENT": j?.client_name ?? "",
        "JOUR-TEL": j?.client_phone ?? "",
        "JOUR-VERSEMENT": jt?.verse ?? "",
        "JOUR-RESTE": jt?.reste ?? "",
        "NUIT-CLIENT": n?.client_name ?? "",
        "NUIT-TEL": n?.client_phone ?? "",
        "NUIT-VERSEMENT": nt?.verse ?? "",
        "NUIT-RESTE": nt?.reste ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 22 },
      { wch: 14 },
      { wch: 15 },
      { wch: 13 },
      { wch: 22 },
      { wch: 14 },
      { wch: 15 },
      { wch: 13 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, salle.name.slice(0, 28) || "Salle");
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `registre-${month}.xlsx`,
  );
}

function icsEscape(text: string) {
  return text.replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
}

function stampDate(date: string) {
  return date.replace(/-/g, "");
}

/** Un événement par créneau réservé. */
export function exportMonthIcs(
  month: string,
  reservations: Reservation[],
  salles: Salle[],
) {
  const salleName = (id: string) =>
    salles.find((s) => s.id === id)?.name ?? "Salle";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Salle des Fetes//Reservations//FR",
    "CALSCALE:GREGORIAN",
  ];

  for (const r of reservations) {
    if (r.status === "cancelled") continue;
    const t = computeTotals(r);
    const next = new Date(r.date + "T00:00:00Z");
    next.setUTCDate(next.getUTCDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${r.id}@salle-des-fetes`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART;VALUE=DATE:${stampDate(r.date)}`,
      `DTEND;VALUE=DATE:${stampDate(next.toISOString().slice(0, 10))}`,
      `SUMMARY:${icsEscape(`${SLOT_LABEL[r.slot]} — ${r.client_name || "Bloqué"} (${salleName(r.salle_id)})`)}`,
      `DESCRIPTION:${icsEscape(
        [
          `Client : ${r.client_name || "—"}`,
          `Téléphone : ${r.client_phone || "—"}`,
          `Versé : ${t.verse}`,
          `Reste dû : ${t.reste}`,
          `Statut : ${r.status}`,
        ].join("\n"),
      )}`,
      `LOCATION:${icsEscape(salleName(r.salle_id))}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  download(
    new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }),
    `reservations-${month}.ics`,
  );
  return monthLabel(month);
}
