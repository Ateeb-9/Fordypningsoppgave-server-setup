const API = "http://localhost:3000/api";

function toggleForm() {
    const l = document.getElementById('loginForm'), r = document.getElementById('regForm');
    l.style.display = l.style.display === 'none' ? 'block' : 'none';
    r.style.display = r.style.display === 'none' ? 'block' : 'none';
}

async function handleRegister() {
    const username = document.getElementById('regUser').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, email, password })
    });
    if (res.ok) alert("Registrert! Logg inn nå."); else alert("Feil!");
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'index.html';
    } else alert("Feil info");
}

async function loadTasks() {
    const user = JSON.parse(localStorage.getItem('user'));
    const res = await fetch(`${API}/tasks/${user.id}`);
    const tasks = await res.json();
    document.getElementById('taskList').innerHTML = tasks.map(t => `<li>${t.title}</li>`).join('');
}

async function addTask() {
    const user = JSON.parse(localStorage.getItem('user'));
    const title = document.getElementById('taskInput').value;
    await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: user.id, title })
    });
    loadTasks();
}

function logout() { localStorage.clear(); window.location.href = 'LoggInn.html'; }
