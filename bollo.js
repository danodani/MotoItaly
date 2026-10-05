// ===== DATABASE MOT0 (marca > modello > anno) =====
const motoDB = {
    'Ducati': {
        'Panigale V2': {
            '2024': { kW: 114, euro: 'Euro 5' },
            '2025': { kW: 114, euro: 'Euro 5' },
            '2026': { kW: 88, euro: 'Euro 5' }
        }
    },
    'Honda': {
        'CBR 600': {
            '2024': { kW: 89, euro: 'Euro 5' },
            '2025': { kW: 89, euro: 'Euro 5' },
            '2026': { kW: 89, euro: 'Euro 5' }
        }
    }
};

// ===== TABELLE TARIFFE NAZIONALI BASE (2026) =====
const tariffeBase = {
    'Euro 0': { fissa: 26.00, perKW: 1.70 },
    'Euro 1': { fissa: 23.00, perKW: 1.30 },
    'Euro 2': { fissa: 21.00, perKW: 1.00 },
    'Euro 3': { fissa: 19.11, perKW: 0.88 },
    'Euro 4': { fissa: 19.11, perKW: 0.88 },
    'Euro 5': { fissa: 19.11, perKW: 0.88 },
    'Euro 5+': { fissa: 19.11, perKW: 0.88 }
};

// ===== MAGGIORAZIONI REGIONALI 2026 =====
const maggiorazioniRegionali = {
    'emilia-romagna': { moltiplicatore: 1.10 }
};

// ===== REGOLE SPECIALI PER REGIONE =====
const regoleSpeciali = {
    'lombardia': {
        fissaEuro3plus: 20.00
    }
};

// ===== LOGICA CALCOLO =====
function calcolaBollo(kW, euro, regione, unitaOriginale) {
    const potenzaKW = unitaOriginale === 'CV' ? kW * 0.735 : kW;

    const tariffa = tariffeBase[euro] || tariffeBase['Euro 5'];
    let bollo;

    if (potenzaKW <= 11) {
        if (regione === 'lombardia' && ['Euro 3', 'Euro 4', 'Euro 5', 'Euro 5+'].includes(euro)) {
            bollo = regoleSpeciali.lombardia.fissaEuro3plus;
        } else {
            bollo = tariffa.fissa;
        }
    } else {
        bollo = tariffa.fissa + (potenzaKW * tariffa.perKW);
    }

    const regola = maggiorazioniRegionali[regione];
    if (regola) {
        bollo = bollo * regola.moltiplicatore;
    }

    return {
        totale: bollo,
        potenzaKW: potenzaKW,
        tariffaFissa: tariffa.fissa,
        perKW: tariffa.perKW
    };
}

// ===== RIFERIMENTI DOM =====
const marcaSelect = document.getElementById('marcaSelect');
const modelloSelect = document.getElementById('modelloSelect');
const annoSelect = document.getElementById('annoSelect');
const potenzaInput = document.getElementById('potenzaInput');
const unitaPotenza = document.getElementById('unitaPotenza');
const euroSelect = document.getElementById('euroSelect');
const regioneSelect = document.getElementById('regioneSelect');
const calcolaBtn = document.getElementById('calcolaBtn');
const resultBox = document.getElementById('resultBox');
const resultAmount = document.getElementById('resultAmount');
const resultDetail = document.getElementById('resultDetail');
const datiManuali = document.getElementById('datiManuali');
const usaDatiManualiBtn = document.getElementById('usaDatiManualiBtn');

// ===== POPOLA MARCHE =====
Object.keys(motoDB).sort().forEach(marca => {
    const opt = document.createElement('option');
    opt.value = marca;
    opt.textContent = marca;
    marcaSelect.appendChild(opt);
});

// ===== CASCATA: MARCA → MODELLO → ANNO =====
marcaSelect.addEventListener('change', () => {
    modelloSelect.innerHTML = '<option value="">— Seleziona modello —</option>';
    annoSelect.innerHTML = '<option value="">— Prima scegli il modello —</option>';
    annoSelect.disabled = true;

    if (marcaSelect.value) {
        const modelli = Object.keys(motoDB[marcaSelect.value]).sort();
        modelli.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            modelloSelect.appendChild(opt);
        });
        modelloSelect.disabled = false;
    } else {
        modelloSelect.disabled = true;
    }
    aggiornaStatoBottone();
});

modelloSelect.addEventListener('change', () => {
    annoSelect.innerHTML = '<option value="">— Seleziona anno —</option>';

    if (modelloSelect.value) {
        const anni = Object.keys(motoDB[marcaSelect.value][modelloSelect.value]).sort().reverse();
        anni.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a;
            annoSelect.appendChild(opt);
        });
        annoSelect.disabled = false;
    } else {
        annoSelect.disabled = true;
    }
    aggiornaStatoBottone();
});

annoSelect.addEventListener('change', () => {
    if (annoSelect.value) {
        const dati = motoDB[marcaSelect.value][modelloSelect.value][annoSelect.value];
        potenzaInput.value = dati.kW;
        unitaPotenza.value = 'kW';
        euroSelect.value = dati.euro;
    }
    aggiornaStatoBottone();
});

// ===== TOGGLE DATI MANUALI =====
usaDatiManualiBtn.addEventListener('click', () => {
    datiManuali.hidden = !datiManuali.hidden;
    usaDatiManualiBtn.textContent = datiManuali.hidden
        ? 'Oppure inserisci i dati manualmente'
        : 'Nascondi dati manuali';
    aggiornaStatoBottone();
});

// ===== ASCOLTA CAMBIAMENTI =====
[potenzaInput, unitaPotenza, euroSelect, regioneSelect].forEach(el => {
    el.addEventListener('input', aggiornaStatoBottone);
    el.addEventListener('change', aggiornaStatoBottone);
});

function aggiornaStatoBottone() {
    // La regione è sempre obbligatoria
    if (!regioneSelect.value) {
        calcolaBtn.disabled = true;
        return;
    }

    const haDatiMoto = marcaSelect.value && modelloSelect.value && annoSelect.value;
    const haDatiManuali = !datiManuali.hidden && potenzaInput.value;

    calcolaBtn.disabled = !(haDatiMoto || haDatiManuali);
}

// ===== CALCOLO =====
calcolaBtn.addEventListener('click', () => {
    let kW, euro, unita;

    if (marcaSelect.value && modelloSelect.value && annoSelect.value) {
        const dati = motoDB[marcaSelect.value][modelloSelect.value][annoSelect.value];
        kW = dati.kW;
        euro = dati.euro;
        unita = 'kW';

        // Se l'utente ha modificato manualmente la potenza, usa quella
        if (!datiManuali.hidden && potenzaInput.value && parseFloat(potenzaInput.value) !== dati.kW) {
            kW = parseFloat(potenzaInput.value);
            unita = unitaPotenza.value;
            euro = euroSelect.value;
        }
    } else {
        kW = parseFloat(potenzaInput.value);
        euro = euroSelect.value;
        unita = unitaPotenza.value;
    }

    const regione = regioneSelect.value;

    if (!kW || !regione) return;

    const risultato = calcolaBollo(kW, euro, regione, unita);

    resultAmount.textContent = '€ ' + risultato.totale.toFixed(2);

    let dettaglio = `${risultato.potenzaKW.toFixed(1)} kW effettivi, ${euro}. `;
    dettaglio += `Tariffa base: € ${risultato.tariffaFissa.toFixed(2)} + € ${risultato.perKW.toFixed(2)}/kW. `;

    if (maggiorazioniRegionali[regione]) {
        dettaglio += `Maggiorazione regionale: +${((maggiorazioniRegionali[regione].moltiplicatore - 1) * 100).toFixed(0)}%. `;
    }
    if (regione === 'lombardia' && risultato.potenzaKW <= 11) {
        dettaglio += `Tariffa fissa Lombardia per Euro 3+: € 20,00. `;
    }

    dettaglio += `Valore indicativo, arrotondato ai sensi di legge.`;

    resultDetail.textContent = dettaglio;
    resultBox.hidden = false;
});

console.log('Calcolatore bollo caricato.');