const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Grupos ---
app.get('/api/grupos', (req, res) => {
  db.all('SELECT * FROM grupos ORDER BY nome', [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

app.post('/api/grupos', (req, res) => {
  const { nome } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome obrigatório.' });
  db.run('INSERT INTO grupos (nome) VALUES (?)', [nome.trim()], function (err) {
    if (err) return res.status(400).json({ erro: 'Já existe um grupo com esse nome.' });
    res.json({ id: this.lastID, nome: nome.trim() });
  });
});

app.delete('/api/grupos/:id', (req, res) => {
  db.run('DELETE FROM respostas WHERE grupo_id = ?', [req.params.id], () => {
    db.run('DELETE FROM grupos WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ erro: err.message });
      res.json({ ok: true });
    });
  });
});

// --- Respostas ---
app.get('/api/grupos/:id/respostas', (req, res) => {
  db.all('SELECT * FROM respostas WHERE grupo_id = ? ORDER BY id DESC', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

app.post('/api/grupos/:id/respostas', (req, res) => {
  const { nome, religiao } = req.body;
  if (!religiao?.trim()) return res.status(400).json({ erro: 'Religião obrigatória.' });
  db.run(
    'INSERT INTO respostas (grupo_id, nome, religiao) VALUES (?, ?, ?)',
    [req.params.id, nome?.trim() || '', religiao.trim()],
    function (err) {
      if (err) return res.status(500).json({ erro: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/api/respostas/:id', (req, res) => {
  db.run('DELETE FROM respostas WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ erro: err.message });
    res.json({ ok: true });
  });
});

app.listen(3000, () => console.log('Rodando em http://localhost:3000'));
