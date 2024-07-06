import Database from "better-sqlite3";

const db = Database("db/game.db");
db.pragma("journal_mode = WAL");
db.prepare(
  "CREATE TABLE IF NOT EXISTS game (pin TEXT,  roomId TEXT, active INTEGER)"
).run();

export default db;
