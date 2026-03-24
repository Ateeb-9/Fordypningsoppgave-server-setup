const API = "http://localhost:3000/api";

// --- HJELPEFUNKSJONER ---
function getLoggedInUser() {
    return JSON.parse(localStorage.getItem('user'));
}

function logout() {
    localStorage.clear();
    window.location.href = 'LoggInn.html';
}

function toggleForm() {
    const login = document.getElementById('loginForm');
    const reg = document.getElementById('regForm');
    if (login.style.display === 'none') {
        login.style.display = 'block';
        reg.style.display = 'none';
    } else {
        login.style.display = 'none';
        reg.style.display = 'block';
    }
}

// --- AUTENTISERING ---
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    try {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            alert(`Velkommen, Boss Ateeb!`);
            window.location.href = 'index.html';
        } else {
            alert("Feil: " + data.error);
        }
    } catch (e) { alert("Kunne ikke koble til serveren!"); }
}

async function handleRegister() {
    const body = { 
        username: document.getElementById('regUser').value, 
        email: document.getElementById('regEmail').value, 
        password: document.getElementById('regPass').value 
    };
    const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    if (res.ok) { alert("Registrert!"); toggleForm(); } else alert("Feil!");
}

// --- ADMIN & BRUKERLISTE ---
async function checkAdminAccess() {
    const user = getLoggedInUser();
    const adminPanel = document.getElementById('adminPanel');
    const noAccess = document.getElementById('noAccessMessage');

    if (user && user.isAdmin === true) {
        if (adminPanel) adminPanel.style.display = 'block';
        if (noAccess) noAccess.style.display = 'none';
        loadUsers(); 
    } else {
        if (adminPanel) adminPanel.style.display = 'none';
        if (noAccess) noAccess.style.display = 'block';
    }
}

async function loadUsers() {
    const res = await fetch(`${API}/users`);
    const users = await res.json();
    const table = document.getElementById('userTableBody');
    if (!table) return;

    table.innerHTML = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td>${u.high_score}</td>
            <td>
                <button class="btn-yellow" style="width:auto; padding:5px;" onclick="localStorage.setItem('editId', ${u.id}); window.location.href='Redigere-profil.html'">Rediger</button>
            </td>
        </tr>
    `).join('');
}

// --- PROFIL & SLETTING ---
async function updateProfile() {
    const user = getLoggedInUser();
    const targetId = localStorage.getItem('editId') || user.id;
    const body = {
        username: document.getElementById('newName').value,
        email: document.getElementById('newEmail').value,
        password: document.getElementById('newPass').value
    };
    await fetch(`${API}/user/${targetId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    alert("Profil oppdatert!"); window.location.href = 'index.html';
}

async function deleteProfile() {
    const user = getLoggedInUser();
    if (confirm("Slette konto?")) {
        await fetch(`${API}/user/${user.id}`, { method: 'DELETE' });
        logout();
    }
}

// --- SPILL & LEADERBOARD ---
let clicks = 0, timeLeft = 10, timerId, gameActive = false;

function startGame() {
    if (gameActive) return;
    clicks = 0; timeLeft = 10; gameActive = true;
    document.getElementById('scoreCounter').innerText = 0;
    document.getElementById('clickBtn').disabled = false;
    timerId = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = `Tid: ${timeLeft}s`;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function countClick() { if (gameActive) { clicks++; document.getElementById('scoreCounter').innerText = clicks; } }

async function endGame() {
    clearInterval(timerId); gameActive = false;
    document.getElementById('clickBtn').disabled = true;
    const user = getLoggedInUser();
    const res = await fetch(`${API}/save-score`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ userId: user.id, score: clicks })
    });
    const data = await res.json();
    alert(data.newRecord ? "NY REKORD!" : "Ferdig!");
    loadLeaderboard();
}

async function loadLeaderboard() {
    const res = await fetch(`${API}/leaderboard`);
    const top = await res.json();
    const table = document.getElementById('leaderboard');
    const user = getLoggedInUser();
    if (!table) return;

    table.innerHTML = `<tr><th>Rank</th><th>Navn</th><th>Score</th></tr>` + 
        top.map((u, i) => `
            <tr style="${user && u.username === user.username ? 'background: var(--yellow); font-weight: bold;' : ''}">
                <td>#${i + 1}</td><td>${u.username}</td><td>${u.high_score}</td>
            </tr>`).join('');
}

window.onload = () => {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/') checkAdminAccess();
    if (path.includes('spill.html')) loadLeaderboard();
};
