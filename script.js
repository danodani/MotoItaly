// ===== GESTIONE TEMA =====
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

// Determina lo stato attuale del tema
// 'auto' | 'light' | 'dark'
function getThemeMode() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'auto';
}

// Applica il tema in base al modo
function applyTheme(mode) {
    if (mode === 'auto') {
        // Rimuove data-theme per far decidere al CSS tramite prefers-color-scheme? 
        // No: il CSS non ha un blocco @media prefers-color-scheme. 
        // Quindi applichiamo manualmente il tema di sistema.
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', systemDark ? 'dark' : 'light');
        root.setAttribute('data-theme-mode', 'auto');
        localStorage.removeItem('theme');
    } else {
        root.setAttribute('data-theme', mode);
        root.setAttribute('data-theme-mode', mode);
        localStorage.setItem('theme', mode);
    }
}

// Ciclo dei temi: auto -> light -> dark -> auto
function cycleTheme() {
    const current = getThemeMode();
    let next;
    if (current === 'auto') next = 'light';
    else if (current === 'light') next = 'dark';
    else next = 'auto';
    applyTheme(next);
}

// Inizializza al caricamento
applyTheme(getThemeMode());

// Click sul toggle
if (themeToggle) {
    themeToggle.addEventListener('click', cycleTheme);
}

// Ascolta i cambiamenti del sistema operativo (solo se in modalità auto)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (getThemeMode() === 'auto') {
        applyTheme('auto');
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

console.log('Moto Italy - Portale caricato correttamente.');