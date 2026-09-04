"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.prepare = prepare;
var Database = require("better-sqlite3");
var path = require("path");
var fs_mod = require("fs");
var __dirname = path.dirname(__filename);
var DB_DIR = path.resolve(process.cwd(), "data");
var DB_PATH = process.env.DB_PATH || path.join(DB_DIR, "firedre.db");
fs_mod.mkdirSync(DB_DIR, { recursive: true });
exports.db = Database(DB_PATH);
exports.db.pragma("journal_mode = WAL");
exports.db.pragma("foreign_keys = ON");
function prepare(sql) { return exports.db.prepare(sql); }
exports.default = exports.db;
function migrate() {
  var migrationsDir = require("path").join(__dirname, "../../migrations");
  var fs_mod = require("fs");
  var files = fs_mod.readdirSync(migrationsDir).filter(function(f) { return f.endsWith(".sql"); }).sort();
  for (var i = 0; i < files.length; i++) {
    var sql = fs_mod.readFileSync(require("path").join(migrationsDir, files[i]), "utf-8");
    console.log("Applying migration:", files[i]);
    try { exports.db.exec(sql); } catch(e) { console.log("Skipping migration (likely already applied):", files[i], e.message); }
  }
  console.log("Migrations complete");
}
exports.migrate = migrate;

