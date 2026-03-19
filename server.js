const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const db = new Database('database.db');

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// Lag tabeller
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT,
        password TEXT
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        title TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
    )
`).run();

// --- RUTER ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    try {
        const info = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, password);
        res.json({ success: true, userId: info.lastInsertRowid });
    } catch (err) { res.status(400).json({ error: "Brukernavn opptatt" }); }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) res.json({ success: true, user });
    else res.status(401).json({ error: "Feil e-post eller passord" });
});

app.put('/api/user/:id', (req, res) => {
    const { username, email, password } = req.body;
    db.prepare('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?').run(username, email, password, req.params.id);
    res.json({ success: true });
});

app.delete('/api/user/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Tema-ruter (Oppgaver)
app.get('/api/tasks/:userId', (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks WHERE userId = ?').all(req.params.userId);
    res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
    db.prepare('INSERT INTO tasks (userId, title) VALUES (?, ?)').run(req.body.userId, req.body.title);
    res.json({ success: true });
});

app.listen(3000, () => console.log("Server på http://localhost:3000"));
