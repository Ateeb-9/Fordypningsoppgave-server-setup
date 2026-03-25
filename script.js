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
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
    reg.style.display = reg.style.display === 'none' ? 'block' : 'none';
}

// --- AUTENTISERING ---
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'index.html';
    } else {
        alert(data.error);
    }
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

    if (user && user.isAdmin) {
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

window.onload = () => {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/') checkAdminAccess();
};
