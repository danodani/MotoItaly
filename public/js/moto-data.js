// ============================================================
// DATABASE CONDIVISO MOTO ITALY — Versione scalabile
// ============================================================
// Struttura: Marca → Modello → Array di intervalli
// Ogni intervallo supporta: from, to, kW, CV, cc, euro, tipo, a2
// Il flag a2: true indica presenza di versione depotenziabile 35 kW
// ============================================================

const MOTO_DB = {
    'Ducati': {
        'Panigale V2': [
            { from: 2020, to: 2024, kW: 114, CV: 155, cc: 955, euro: 'Euro 5', tipo: 'Sportiva', a2: false },
            { from: 2025, to: 2026, kW: 88, CV: 120, cc: 890, euro: 'Euro 5+', tipo: 'Sportiva', a2: false }
        ],
        'Monster 937': [
            { from: 2021, to: 2026, kW: 82, CV: 111, cc: 937, euro: 'Euro 5', tipo: 'Naked', a2: true }
        ],
        'Multistrada V4': [
            { from: 2021, to: 2026, kW: 125, CV: 170, cc: 1158, euro: 'Euro 5', tipo: 'Adventure', a2: false }
        ]
    },
    'Honda': {
        'CBR 600 RR': [
            { from: 2019, to: 2021, kW: 89, CV: 121, cc: 599, euro: 'Euro 4', tipo: 'Sportiva', a2: false },
            { from: 2024, to: 2026, kW: 89, CV: 121, cc: 599, euro: 'Euro 5+', tipo: 'Sportiva', a2: false }
        ],
        'Africa Twin CRF1100L': [
            { from: 2020, to: 2026, kW: 75, CV: 102, cc: 1084, euro: 'Euro 5', tipo: 'Adventure', a2: true }
        ],
        'CB 650R': [
            { from: 2019, to: 2026, kW: 70, CV: 95, cc: 649, euro: 'Euro 5', tipo: 'Naked', a2: true }
        ],
        'NC 750X': [
            { from: 2021, to: 2026, kW: 43.5, CV: 59, cc: 745, euro: 'Euro 5', tipo: 'Touring', a2: true }
        ]
    },
    'Yamaha': {
        'MT-07': [
            { from: 2021, to: 2024, kW: 54, CV: 73.4, cc: 689, euro: 'Euro 5', tipo: 'Naked', a2: true },
            { from: 2025, to: 2026, kW: 54, CV: 73.4, cc: 689, euro: 'Euro 5+', tipo: 'Naked', a2: true }
        ],
        'MT-09': [
            { from: 2021, to: 2023, kW: 87.5, CV: 119, cc: 890, euro: 'Euro 5', tipo: 'Naked', a2: false },
            { from: 2024, to: 2026, kW: 87.5, CV: 119, cc: 890, euro: 'Euro 5+', tipo: 'Naked', a2: false }
        ],
        'Ténéré 700': [
            { from: 2019, to: 2024, kW: 54, CV: 73, cc: 689, euro: 'Euro 5', tipo: 'Adventure', a2: true },
            { from: 2025, to: 2026, kW: 54, CV: 73, cc: 689, euro: 'Euro 5+', tipo: 'Adventure', a2: true }
        ]
    },
    'Kawasaki': {
        'Ninja 400': [
            { from: 2018, to: 2023, kW: 33.4, CV: 45, cc: 399, euro: 'Euro 5', tipo: 'Sportiva', a2: true },
            { from: 2024, to: 2026, kW: 33.4, CV: 45, cc: 399, euro: 'Euro 5+', tipo: 'Sportiva', a2: true }
        ],
        'Z650': [
            { from: 2020, to: 2026, kW: 50, CV: 68, cc: 649, euro: 'Euro 5', tipo: 'Naked', a2: true }
        ],
        'Z900': [
            { from: 2020, to: 2026, kW: 92, CV: 125, cc: 948, euro: 'Euro 5', tipo: 'Naked', a2: true }
        ]
    },
    'BMW': {
        'S 1000 RR': [
            { from: 2019, to: 2022, kW: 152, CV: 207, cc: 999, euro: 'Euro 5', tipo: 'Sportiva', a2: false },
            { from: 2023, to: 2026, kW: 154, CV: 210, cc: 999, euro: 'Euro 5+', tipo: 'Sportiva', a2: false }
        ],
        'R 1300 GS': [
            { from: 2024, to: 2026, kW: 107, CV: 145, cc: 1300, euro: 'Euro 5+', tipo: 'Adventure', a2: false }
        ],
        'F 850 GS': [
            { from: 2018, to: 2026, kW: 70, CV: 95, cc: 853, euro: 'Euro 5', tipo: 'Adventure', a2: true }
        ]
    },
    'Aprilia': {
        'RS 660': [
            { from: 2020, to: 2026, kW: 74, CV: 100, cc: 659, euro: 'Euro 5', tipo: 'Sportiva', a2: true }
        ],
        'Tuono 660': [
            { from: 2021, to: 2026, kW: 70, CV: 95, cc: 659, euro: 'Euro 5', tipo: 'Naked', a2: true }
        ]
    },
    'KTM': {
        'Duke 390': [
            { from: 2018, to: 2023, kW: 32, CV: 44, cc: 399, euro: 'Euro 5', tipo: 'Naked', a2: true },
            { from: 2024, to: 2026, kW: 33, CV: 45, cc: 399, euro: 'Euro 5+', tipo: 'Naked', a2: true }
        ],
        '1290 Super Duke R': [
            { from: 2020, to: 2026, kW: 132, CV: 180, cc: 1301, euro: 'Euro 5', tipo: 'Naked', a2: false }
        ]
    },
    'Suzuki': {
        'SV 650': [
            { from: 2017, to: 2026, kW: 56, CV: 76, cc: 645, euro: 'Euro 5', tipo: 'Naked', a2: true }
        ],
        'V-Strom 650': [
            { from: 2017, to: 2026, kW: 52, CV: 71, cc: 645, euro: 'Euro 5', tipo: 'Adventure', a2: true }
        ],
        'GSX-8S': [
            { from: 2023, to: 2026, kW: 61, CV: 83, cc: 776, euro: 'Euro 5', tipo: 'Naked', a2: true }
        ]
    },
    'Triumph': {
        'Street Triple 765 R': [
            { from: 2020, to: 2022, kW: 87, CV: 118, cc: 765, euro: 'Euro 5', tipo: 'Naked', a2: true },
            { from: 2023, to: 2026, kW: 88, CV: 120, cc: 765, euro: 'Euro 5', tipo: 'Naked', a2: true }
        ],
        'Bonneville T120': [
            { from: 2016, to: 2020, kW: 59, CV: 80, cc: 1200, euro: 'Euro 4', tipo: 'Naked', a2: false },
            { from: 2021, to: 2026, kW: 59, CV: 80, cc: 1200, euro: 'Euro 5', tipo: 'Naked', a2: false }
        ]
    }
};

// ============================================================
// FUNZIONI HELPER CONDIVISE
// ============================================================

function getAllBrands() {
    return Object.keys(MOTO_DB).sort();
}

function getModelsForBrand(marca) {
    const modelli = MOTO_DB[marca];
    if (!modelli) return [];
    return Object.keys(modelli).sort();
}

function getYearsForModel(marca, modello) {
    const ranges = MOTO_DB[marca]?.[modello];
    if (!ranges) return [];
    const years = [];
    ranges.forEach(r => {
        for (let y = r.from; y <= r.to; y++) years.push(y);
    });
    return years.sort((a, b) => b - a);
}

function getSpecsForYear(marca, modello, anno) {
    const ranges = MOTO_DB[marca]?.[modello];
    if (!ranges) return null;
    const y = parseInt(anno);
    return ranges.find(r => y >= r.from && y <= r.to) || null;
}

console.log('Database moto condiviso caricato: ' + getAllBrands().length + ' marche.');