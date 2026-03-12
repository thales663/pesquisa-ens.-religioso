const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'dados.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS grupos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS respostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id INTEGER NOT NULL,
    nome TEXT,
    religiao TEXT NOT NULL,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id)
  )`);
});

module.exports = db;
