const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const db = new Database('database.db');

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// Opprett tabell med high_score
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        email TEXT UNIQUE,
        password TEXT,
        high_score INTEGER DEFAULT 0
    )
`).run();

// --- API RUTER ---

// Hent alle brukere (Admin funksjon)
app.get('/api/users', (req, res) => {
    res.json(db.prepare('SELECT id, username, email, high_score FROM users').all());
});

// Registrering
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    try {
        db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, password);
        res.json({ success: true });
    } catch (e) { res.status(400).json({ error: "E-posten er opptatt!" }); }
});

// Innlogging med Admin-sjekk
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    
    if (user) {
        // Tvinger isAdmin til true hvis e-posten er admin@gmail.com
        const isAdmin = (user.email === 'admin@gmail.com');
        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                isAdmin: isAdmin 
            } 
        });
    } else {
        res.status(401).json({ error: "Feil e-post eller passord!" });
    }
});

// Oppdater profil
app.put('/api/user/:id', (req, res) => {
    const { username, email, password } = req.body;
    db.prepare('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?').run(username, email, password, req.params.id);
    res.json({ success: true });
});

// Slett profil
app.delete('/api/user/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Lagre spill-score
app.post('/api/save-score', (req, res) => {
    const { userId, score } = req.body;
    const user = db.prepare('SELECT high_score FROM users WHERE id = ?').get(userId);
    if (score > user.high_score) {
        db.prepare('UPDATE users SET high_score = ? WHERE id = ?').run(score, userId);
        res.json({ success: true, newRecord: true });
    } else res.json({ success: true, newRecord: false });
});

// Hent Leaderboard
app.get('/api/leaderboard', (req, res) => {
    res.json(db.prepare('SELECT username, high_score FROM users WHERE high_score > 0 ORDER BY high_score DESC LIMIT 10').all());
});

app.listen(3000, () => console.log("Boss Ateeb sin server kjører på http://localhost:3000"));
