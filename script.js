// ============================================================
// MOTO ITALY — SCRIPT PRINCIPALE
// ============================================================

// ===== GESTIONE TEMA (2 STATI) =====
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function getActiveTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function setTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (persist) localStorage.setItem('theme', theme);
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
        setTheme(saved, false);
    } else {
        setTheme(systemPrefersDark.matches ? 'dark' : 'light', false);
    }
}

initTheme();

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const next = getActiveTheme() === 'dark' ? 'light' : 'dark';
        setTheme(next, true);
    });
}

systemPrefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light', false);
    }
});

// ===== MENU MOBILE =====
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('open');
    });
    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('open');
        });
    });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===== FETCH DATI REDDIT (con fallback) =====
// Tenta di recuperare i dati dal JSON pubblico di Reddit.
// Se fallisce (CORS, rate limit, deprecazione), mantiene i valori di fallback.
async function loadRedditStats() {
    const statMembers = document.getElementById('statMembers');
    const statOnline = document.getElementById('statOnline');
    const statPosts = document.getElementById('statPosts');

    if (!statMembers) return; // Non siamo in homepage

    const FALLBACK = {
        members: '5.000+',
        online: '—',
        posts: '—'
    };

    try {
        const response = await fetch('https://www.reddit.com/r/MotoItaly/about.json', {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('Reddit API non raggiungibile');

        const data = await response.json();
        const sub = data.data;

        if (sub) {
            statMembers.textContent = sub.subscribers
                ? sub.subscribers.toLocaleString('it-IT')
                : FALLBACK.members;
            statOnline.textContent = sub.active_user_count !== undefined
                ? sub.active_user_count.toLocaleString('it-IT')
                : FALLBACK.online;
            statPosts.textContent = sub.accounts_active !== undefined
                ? sub.accounts_active.toLocaleString('it-IT')
                : FALLBACK.posts;
        }
    } catch (err) {
        // Fallback silenzioso: i numeri restano quelli di default nell'HTML
        console.info('Dati Reddit non disponibili, uso fallback statico.');
    }
}

// Esegui al caricamento, solo in homepage
if (document.getElementById('redditStats')) {
    loadRedditStats();
}

console.log('Moto Italy — script principale caricato.');