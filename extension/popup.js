const API_BASE = 'http://localhost:5000/api';

const statusDot = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const usernameDisplay = document.getElementById('usernameDisplay');
const loginForm = document.getElementById('loginForm');
const loggedInDiv = document.getElementById('loggedIn');
const emailInput = document.getElementById('emailInput');
const passInput = document.getElementById('passInput');
const errorMsg = document.getElementById('errorMsg');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

function showLoggedIn(username) {
  statusDot.classList.remove('off');
  statusLabel.textContent = 'Tracking active';
  usernameDisplay.textContent = username;
  loginForm.style.display = 'none';
  loggedInDiv.style.display = 'block';
}

function showLoggedOut() {
  statusDot.classList.add('off');
  statusLabel.textContent = 'Not connected';
  usernameDisplay.textContent = '';
  loginForm.style.display = 'block';
  loggedInDiv.style.display = 'none';
}

// Check current login state
chrome.storage.local.get(['wt_token', 'wt_user'], (result) => {
  if (result.wt_token && result.wt_user) {
    showLoggedIn(result.wt_user.username);
  } else {
    showLoggedOut();
  }
});

loginBtn.addEventListener('click', async () => {
  errorMsg.textContent = '';
  const email = emailInput.value.trim();
  const password = passInput.value;
  if (!email || !password) { errorMsg.textContent = 'Please fill in all fields.'; return; }

  loginBtn.textContent = 'Signing in…';
  loginBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    chrome.storage.local.set({ wt_token: data.token, wt_user: data.user }, () => {
      showLoggedIn(data.user.username);
    });
  } catch (err) {
    errorMsg.textContent = err.message || 'Login failed.';
  } finally {
    loginBtn.textContent = 'Sign in to sync';
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', () => {
  chrome.storage.local.remove(['wt_token', 'wt_user'], () => showLoggedOut());
});

// Allow Enter key
passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginBtn.click(); });
