// ============================================================
// CALCOLATORE BOLLO MOTO — LOGICA FISCALE ITALIANA
// ============================================================
// - Arrotondamento kW legale (Math.round)
// - Configurazione regionale estendibile (REGIONI_RATES)
// - Gestione depotenziate A2 (forzatura 35 kW)
// - Gestione moto d'epoca (20-29 anni, 30+ anni)
// ============================================================

// ===== CONFIGURAZIONE REGIONALE ESTENDIBILE =====
// Ogni regione può definire:
//   moltiplicatore: fattore moltiplicativo su tutta la tariffa
//   fissaOverrides: override della quota fissa per classe Euro
//   note: eventuali note per il dettaglio
const REGIONI_RATES = {
    'emilia-romagna': { moltiplicatore: 1.10, note: 'Maggiorazione regionale +10%' },
    'lombardia': { fissaOverrides: { 'Euro 3': 20.00, 'Euro 4': 20.00, 'Euro 5': 20.00, 'Euro 5+': 20.00 }, note: 'Tariffa fissa Euro 3+ = € 20,00' },
    'campania': { note: 'Tariffa regionale base' },
    'veneto': { note: 'Tariffa regionale base' },
    'calabria': { note: 'Tariffa regionale base' },
    'sicilia': { note: 'Tariffa regionale base' }
    // Altre regioni: tariffa nazionale standard
};

// ===== TABELLE TARIFFE NAZIONALI BASE (2026) =====
// Fino a 11 kW: importo fisso. Oltre 11 kW: fissa + (kW interi × aliquota)
const TARIFFE_BASE = {
    'Euro 0': { fissa: 26.00, perKW: 1.70 },
    'Euro 1': { fissa: 23.00, perKW: 1.30 },
    'Euro 2': { fissa: 21.00, perKW: 1.00 },
    'Euro 3': { fissa: 19.11, perKW: 0.88 },
    'Euro 4': { fissa: 19.11, perKW: 0.88 },
    'Euro 5': { fissa: 19.11, perKW: 0.88 },
    'Euro 5+': { fissa: 19.11, perKW: 0.88 }
};

// ===== COSTANTI =====
const SOGLIA_KW = 11;              // Soglia per tariffa fissa
const KW_A2 = 35;                  // Potenza massima depotenziata A2
const FATTORE_CV_KW = 0.735499;    // Conversione CV → kW (legale)

// ===== FUNZIONE PRINCIPALE DI CALCOLO =====
function calcolaBollo(kW, euro, regione, opzioni = {}) {
    const { isA2 = false, anniMoto = 0 } = opzioni;

    // 1. Conversione CV → kW se necessario (gestita a monte)
    // 2. Arrotondamento legale: solo valore intero
    let potenzaKW = isA2 ? KW_A2 : kW;
    const kWInteri = Math.round(potenzaKW);

    // 3. Tariffa base
    const tariffa = TARIFFE_BASE[euro] || TARIFFE_BASE['Euro 5'];
    let fissa = tariffa.fissa;
    const perKW = tariffa.perKW;

    // 4. Override regionale sulla quota fissa
    const regioneConfig = REGIONI_RATES[regione] || {};
    if (regioneConfig.fissaOverrides && kWInteri <= SOGLIA_KW) {
        fissa = regioneConfig.fissaOverrides[euro] || fissa;
    }

    // 5. Calcolo base
    let bollo;
    if (kWInteri <= SOGLIA_KW) {
        bollo = fissa;
    } else {
        bollo = fissa + (kWInteri * perKW);
    }

    // 6. Moltiplicatore regionale
    if (regioneConfig.moltiplicatore) {
        bollo *= regioneConfig.moltiplicatore;
    }

    // 7. Agevolazioni moto d'epoca
    let noteEpoca = '';
    if (anniMoto >= 30) {
        bollo = 0;
        noteEpoca = ' Esenzione totale (moto 30+ anni). Tassa di circolazione forfettaria ~€ 10,33 se utilizzata su strada.';
    } else if (anniMoto >= 20) {
        bollo *= 0.50;
        noteEpoca = ' Riduzione 50% (moto 20-29 anni con CRS FMI/ASI).';
    }

    return {
        totale: bollo,
        kWInteri: kWInteri,
        kWOriginali: potenzaKW,
        tariffaFissa: fissa,
        perKW: perKW,
        noteEpoca: noteEpoca,
        isA2: isA2
    };
}

// ===== GESTIONE UI =====
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
const a2Checkbox = document.getElementById('a2Checkbox');
const annoMotoSelect = document.getElementById('annoMotoSelect');

// Popola marche dal DB condiviso
getAllBrands().forEach(marca => {
    const opt = document.createElement('option');
    opt.value = marca;
    opt.textContent = marca;
    marcaSelect.appendChild(opt);
});

// Cascata: Marca → Modello
marcaSelect.addEventListener('change', () => {
    modelloSelect.innerHTML = '<option value="">— Seleziona modello —</option>';
    annoSelect.innerHTML = '<option value="">— Prima scegli il modello —</option>';
    annoSelect.disabled = true;

    if (marcaSelect.value) {
        getModelsForBrand(marcaSelect.value).forEach(m => {
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

// Cascata: Modello → Anno
modelloSelect.addEventListener('change', () => {
    annoSelect.innerHTML = '<option value="">— Seleziona anno —</option>';

    if (modelloSelect.value) {
        getYearsForModel(marcaSelect.value, modelloSelect.value).forEach(a => {
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

// Anno cambia → precompila dati
annoSelect.addEventListener('change', () => {
    if (annoSelect.value) {
        const dati = getSpecsForYear(marcaSelect.value, modelloSelect.value, annoSelect.value);
        if (dati) {
            potenzaInput.value = dati.kW;
            unitaPotenza.value = 'kW';
            euroSelect.value = dati.euro;
            // Abilita checkbox A2 se il modello ha versione depotenziabile
            if (dati.a2) {
                a2Checkbox.disabled = false;
                a2Checkbox.parentElement.style.opacity = '1';
            } else {
                a2Checkbox.disabled = true;
                a2Checkbox.checked = false;
                a2Checkbox.parentElement.style.opacity = '0.5';
            }
        }
    }
    aggiornaStatoBottone();
});

// Toggle dati manuali
usaDatiManualiBtn.addEventListener('click', () => {
    datiManuali.hidden = !datiManuali.hidden;
    usaDatiManualiBtn.textContent = datiManuali.hidden
        ? 'Oppure inserisci i dati manualmente'
        : 'Nascondi dati manuali';
    aggiornaStatoBottone();
});

// Ascolta cambiamenti
[potenzaInput, unitaPotenza, euroSelect, regioneSelect, a2Checkbox, annoMotoSelect].forEach(el => {
    el.addEventListener('input', aggiornaStatoBottone);
    el.addEventListener('change', aggiornaStatoBottone);
});

function aggiornaStatoBottone() {
    if (!regioneSelect.value) {
        calcolaBtn.disabled = true;
        return;
    }
    const haDatiMoto = marcaSelect.value && modelloSelect.value && annoSelect.value;
    const haDatiManuali = !datiManuali.hidden && potenzaInput.value;
    calcolaBtn.disabled = !(haDatiMoto || haDatiManuali);
}

// Calcola
calcolaBtn.addEventListener('click', () => {
    let kW, euro, unita;

    if (marcaSelect.value && modelloSelect.value && annoSelect.value) {
        const dati = getSpecsForYear(marcaSelect.value, modelloSelect.value, annoSelect.value);
        kW = dati.kW;
        euro = dati.euro;
        unita = 'kW';
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

    // Conversione CV → kW con fattore legale
    let potenzaKW = kW;
    if (unita === 'CV') {
        potenzaKW = kW * FATTORE_CV_KW;
    }

    const isA2 = a2Checkbox && a2Checkbox.checked && !a2Checkbox.disabled;
    const anniMoto = parseInt(annoMotoSelect.value) || 0;

    const risultato = calcolaBollo(potenzaKW, euro, regione, { isA2, anniMoto });

    resultAmount.textContent = '€ ' + risultato.totale.toFixed(2);

    let dettaglio = `${risultato.kWInteri} kW (arrotondati), ${euro}. `;
    dettaglio += `Tariffa: € ${risultato.tariffaFissa.toFixed(2)} + € ${risultato.perKW.toFixed(2)}/kW. `;
    if (isA2) dettaglio += `Versione depotenziata A2 (35 kW). `;
    if (risultato.noteEpoca) dettaglio += risultato.noteEpoca;

    dettaglio += ` Valore indicativo.`;

    resultDetail.textContent = dettaglio;
    resultBox.hidden = false;
});

console.log('Calcolatore bollo aggiornato con logica fiscale 2026.');