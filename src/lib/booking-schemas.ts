import { z } from "zod";

export const monthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const requestSchema = z.object({
  salle_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(["journee", "soiree"]),
  event_type: z
    .enum(["henna", "fatha_henna", "fatha", "event"])
    .default("event"),
  cooking_lab_id: z.enum(["lab_1", "lab_2", "lab_3", "none"]).default("none"),
  client_name: z.string().trim().min(2).max(120),
  client_phone: z.string().trim().min(5).max(30),
  id_card_number: z.string().trim().max(50).optional().nullable(),
  id_card_delivery_date: z.string().optional().nullable(),
  id_card_delivery_place: z.string().trim().max(100).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  event_time: z.string().optional().nullable(),
  event_end_time: z.string().optional().nullable(),
});

export const upsertSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  salle_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(["journee", "soiree"]),
  event_type: z
    .enum(["henna", "fatha_henna", "fatha", "event"])
    .default("event"),
  cooking_lab_id: z.enum(["lab_1", "lab_2", "lab_3", "none"]).default("none"),
  client_name: z.string().trim().max(120).default(""),
  client_phone: z.string().trim().max(30).optional().nullable(),
  status: z.enum(["pending", "confirmed", "cancelled", "blocked"]),
  total_amount: z.number().min(0).max(100000000),
  id_card_number: z.string().trim().max(50).optional().nullable(),
  id_card_delivery_date: z.string().optional().nullable(),
  id_card_delivery_place: z.string().trim().max(100).optional().nullable(),
  id_card_status: z
    .enum(["not_provided", "pending", "verified"])
    .default("not_provided"),
  id_card_front_url: z.string().optional().nullable(),
  id_card_back_url: z.string().optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  event_time: z.string().optional().nullable(),
  event_end_time: z.string().optional().nullable(),
});
