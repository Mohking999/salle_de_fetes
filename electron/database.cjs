const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const now = () => new Date().toISOString();
const id = () => randomUUID();

class LocalDatabase {
  constructor(dataDirectory) {
    this.paths = {
      root: dataDirectory,
      database: path.join(dataDirectory, "database", "salle-des-fetes.db"),
      backups: path.join(dataDirectory, "backups"),
      files: path.join(dataDirectory, "files"),
      settings: path.join(dataDirectory, "settings"),
    };
    for (const dir of [this.paths.root, this.paths.backups, this.paths.files, this.paths.settings, path.dirname(this.paths.database)]) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.open();
  }

  open() {
    this.db = new Database(this.paths.database);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS salles (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, gerant_id TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY, salle_id TEXT NOT NULL REFERENCES salles(id) ON DELETE RESTRICT,
        gerant_id TEXT NOT NULL, date TEXT NOT NULL, slot TEXT NOT NULL,
        client_name TEXT NOT NULL, client_phone TEXT, note TEXT, status TEXT NOT NULL,
        total_amount REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
        event_type TEXT NOT NULL DEFAULT 'event', cooking_lab_id TEXT NOT NULL DEFAULT 'none',
        id_card_number TEXT, id_card_delivery_date TEXT, id_card_delivery_place TEXT,
        id_card_status TEXT NOT NULL DEFAULT 'not_provided', id_card_front_url TEXT,
        id_card_back_url TEXT, event_time TEXT, event_end_time TEXT
      );
      CREATE INDEX IF NOT EXISTS reservations_month_idx ON reservations(date, salle_id, slot);
      CREATE TABLE IF NOT EXISTS versements (
        id TEXT PRIMARY KEY, reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        amount REAL NOT NULL, payment_date TEXT NOT NULL, payment_method TEXT NOT NULL,
        note TEXT, created_by TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS remises (
        id TEXT PRIMARY KEY, reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        type TEXT NOT NULL, value REAL NOT NULL, comment TEXT, applied_by TEXT NOT NULL, created_at TEXT NOT NULL
      );
    `);
    if (this.db.prepare("SELECT COUNT(*) AS count FROM salles").get().count === 0) {
      const created = now();
      const add = this.db.prepare("INSERT INTO salles (id,name,gerant_id,created_at) VALUES (?,?,?,?)");
      add.run("11111111-1111-4111-a111-111111111111", "Salle 01 (Henna, Fatha+Henna, Événements)", "offline-user", created);
      add.run("22222222-2222-4222-a222-222222222222", "Salle 02 (Fatha & Événements)", "offline-user", created);
    }
  }

  salles() { return this.db.prepare("SELECT * FROM salles ORDER BY created_at").all(); }
  reservations() { return this.db.prepare("SELECT * FROM reservations").all(); }
  versements() { return this.db.prepare("SELECT * FROM versements").all(); }
  remises() { return this.db.prepare("SELECT * FROM remises").all(); }
  hydrate(rows) {
    const versements = this.versements(); const remises = this.remises();
    return rows.map((r) => ({ ...r, versements: versements.filter((v) => v.reservation_id === r.id), remises: remises.filter((x) => x.reservation_id === r.id) }));
  }
  conflict(data) {
    return this.db.prepare("SELECT id FROM reservations WHERE salle_id=? AND date=? AND slot=? AND status != 'cancelled' AND id != ? LIMIT 1")
      .get(data.salle_id, data.date, data.slot, data.id || "");
  }
  month(data) {
    const rows = this.db.prepare("SELECT * FROM reservations WHERE date >= ? AND date <= ? ORDER BY date, slot")
      .all(`${data.month}-01`, `${data.month}-31`);
    return { isAdmin: true, userId: "offline-user", salles: this.salles(), gerants: [], reservations: this.hydrate(rows) };
  }
  revenue(data) {
    const rows = this.db.prepare("SELECT * FROM reservations WHERE date >= ? AND date <= ? ORDER BY date")
      .all(`${data.year}-01-01`, `${data.year}-12-31`);
    return { isAdmin: true, gerants: [], rows: this.hydrate(rows) };
  }
  createSalle(data) {
    this.db.prepare("INSERT INTO salles (id,name,gerant_id,created_at) VALUES (?,?,?,?)").run(id(), data.name.trim(), "offline-user", now());
    return { ok: true };
  }
  saveReservation(data) {
    if (this.conflict(data)) throw new Error("Ce créneau est déjà réservé.");
    const fields = ["salle_id","date","slot","event_type","event_time","event_end_time","cooking_lab_id","client_name","client_phone","status","total_amount","id_card_number","id_card_delivery_date","id_card_delivery_place","id_card_status","id_card_front_url","id_card_back_url","note"];
    const value = (key) => data[key] ?? null;
    if (data.id) {
      const existing = this.db.prepare("SELECT id FROM reservations WHERE id=?").get(data.id);
      if (!existing) throw new Error("Réservation introuvable.");
      const row = { id: data.id, ...Object.fromEntries(fields.map((f) => [f, value(f)])) };
      this.db.prepare(`UPDATE reservations SET ${fields.map((f) => `${f}=@${f}`).join(", ")} WHERE id=@id`).run(row);
      return { ok: true, id: data.id };
    }
    const newId = id(); const created = now();
    const row = { ...Object.fromEntries(fields.map((f) => [f, value(f)])), id: newId, gerant_id: "offline-user", created_at: created };
    this.db.prepare(`INSERT INTO reservations (id,gerant_id,created_at,${fields.join(",")}) VALUES (@id,@gerant_id,@created_at,${fields.map((f) => `@${f}`).join(",")})`).run(row);
    return { ok: true, id: newId };
  }
  setStatus(data) { this.db.prepare("UPDATE reservations SET status=? WHERE id=?").run(data.status, data.id); return { ok: true }; }
  updateIdCardStatus(data) { this.db.prepare("UPDATE reservations SET id_card_status=?, id_card_number=COALESCE(?, id_card_number) WHERE id=?").run(data.status, data.number || null, data.id); return { ok: true }; }
  deleteReservation(data) { this.db.prepare("DELETE FROM reservations WHERE id=?").run(data.id); return { ok: true }; }
  addVersement(data) { this.db.prepare("INSERT INTO versements VALUES (?,?,?,?,?,?,?,?)").run(id(), data.reservation_id, data.amount, data.payment_date, data.payment_method, data.note || null, "offline-user", now()); return { ok: true }; }
  deleteVersement(data) { this.db.prepare("DELETE FROM versements WHERE id=?").run(data.id); return { ok: true }; }
  addRemise(data) { if (data.type === "percentage" && data.value > 100) throw new Error("La remise en pourcentage ne peut dépasser 100 %."); this.db.prepare("INSERT INTO remises VALUES (?,?,?,?,?,?,?)").run(id(), data.reservation_id, data.type, data.value, data.comment || null, "offline-user", now()); return { ok: true }; }
  backup(destination) { this.db.pragma("wal_checkpoint(TRUNCATE)"); fs.copyFileSync(this.paths.database, destination); return destination; }
  restore(source) { this.db.close(); fs.copyFileSync(source, this.paths.database); this.open(); return { ok: true }; }
  close() { if (this.db) this.db.close(); }
}

module.exports = { LocalDatabase };
