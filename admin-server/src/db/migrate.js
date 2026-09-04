"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
var index_1 = require("./index");
var path_1 = require("path");
var fs_1 = require("fs");
var url_1 = require("url");
var __dirname = (0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url));
var MIGRATIONS_DIR = (0, path_1.join)(__dirname, '../../migrations');
function migrate() {
    index_1.db.exec(x27CREATE, TABLE, IF, NOT, EXISTS, _migrations(id, INTEGER, PRIMARY, KEY, name, TEXT, NOT, NULL, applied_at, TEXT, NOT, NULL, DEFAULT(datetime(x27now, x27))), x27);
    var applied = new Set(index_1.db.prepare(x27SELECT, name, FROM, _migrations, x27).all().map(function (r) { return r.name; }));
    var files = (0, fs_1.readdirSync)(MIGRATIONS_DIR).filter(function (f) { return f.endsWith(x27.sql, x27); }).sort();
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        if (applied.has(file))
            continue;
        var sql = (0, fs_1.readFileSync)((0, path_1.join)(MIGRATIONS_DIR, file), x27utf8, x27);
        console.log(x27Applying, migration, x27, file);
        index_1.db.exec(sql);
        index_1.db.prepare(x27INSERT, INTO, _migrations(name), VALUES(), x27).run(file);
    }
    console.log(x27Migrations, complete., x27);
}
