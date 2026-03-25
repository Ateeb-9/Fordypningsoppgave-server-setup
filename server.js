const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const db = new Database('database.db');

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// Opprett tabell (Forenklet uten high_score for å unngå krasj)
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        email TEXT UNIQUE,
        password TEXT
    )
`).run();

// --- API RUTER ---

// Hent alle brukere (Kun ID, Navn, E-post)
app.get('/api/users', (req, res) => {
    try {
        const users = db.prepare('SELECT id, username, email FROM users').all();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Kunne ikke hente brukere" });
    }
});

// Registrering
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    try {
        db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, password);
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: "E-posten er allerede i bruk!" });
    }
});

// Innlogging med Admin-sjekk
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    
    if (user) {
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

app.listen(3000, () => console.log("Ateeb sin server kjører på http://localhost:3000"));


