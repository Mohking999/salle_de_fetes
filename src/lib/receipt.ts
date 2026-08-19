import { jsPDF } from "jspdf";
import {
  computeTotals,
  COOKING_LAB_LABEL,
  EVENT_TYPE_LABEL,
  formatDateFr,
  formatMoney,
  ID_CARD_STATUS_LABEL,
  SLOT_LABEL,
  type Reservation,
  type Versement,
} from "./booking-types";

export function generateReceipt(
  reservation: Reservation,
  versement: Versement,
  salleName: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const t = computeTotals(reservation);
  const left = 56;
  let y = 72;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Reçu de versement & Contrat", left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 18;
  doc.text(`Reçu n° ${versement.id.slice(0, 8).toUpperCase()}`, left, y);
  y += 14;
  doc.text(`Émis le ${new Date().toLocaleDateString("fr-FR")}`, left, y);

  y += 26;
  doc.setDrawColor(180);
  doc.line(left, y, 540, y);

  const eventLabel =
    EVENT_TYPE_LABEL[reservation.event_type ?? "event"] ?? "Événement";
  const labLabel =
    COOKING_LAB_LABEL[reservation.cooking_lab_id ?? "none"] ?? "Aucun Labo";
  const idCardText = reservation.id_card_number
    ? `N° ${reservation.id_card_number} (${ID_CARD_STATUS_LABEL[reservation.id_card_status ?? "not_provided"].label})`
    : "Non fournie";

  const rows: [string, string][] = [
    ["Salle des fêtes", salleName],
    ["Type d'événement", eventLabel],
    ["Date de l'événement", formatDateFr(reservation.date)],
    ["Créneau (Jour / Nuit)", SLOT_LABEL[reservation.slot]],
    ["Laboratoire Cuisine", labLabel],
    ["Client", reservation.client_name || "—"],
    ["Téléphone", reservation.client_phone || "—"],
    ["Carte d'Identité (CNI/NIN)", idCardText],
    ["Mode de paiement", versement.payment_method],
    ["Date du versement", formatDateFr(versement.payment_date)],
  ];

  y += 20;
  doc.setFontSize(10);
  for (const [label, value] of rows) {
    doc.setTextColor(110);
    doc.text(label, left, y);
    doc.setTextColor(20);
    doc.text(String(value), left + 190, y);
    y += 18;
  }

  y += 6;
  doc.line(left, y, 540, y);
  y += 22;

  const money: [string, string][] = [
    ["Montant total", formatMoney(t.total)],
    ["Remise", formatMoney(t.remise)],
    ["Net à payer", formatMoney(t.net)],
    ["Montant de ce versement", formatMoney(Number(versement.amount))],
    ["Total versé", formatMoney(t.verse)],
    ["Reste à payer", formatMoney(t.reste)],
  ];
  for (const [label, value] of money) {
    doc.setTextColor(110);
    doc.text(label, left, y);
    doc.setTextColor(20);
    doc.setFont("helvetica", label.includes("Reste") ? "bold" : "normal");
    doc.text(value, left + 260, y);
    y += 18;
  }

  y += 24;
  doc.setTextColor(130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Document officiel généré par le système de gestion — Signature & Cachet du gérant :",
    left,
    y,
  );

  doc.save(`recu-${versement.id.slice(0, 8)}.pdf`);
}
