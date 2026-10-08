# MotoItaly

## Accesso al pannello di amministrazione

Il CMS (Sveltia CMS) è spostato: il vecchio percorso `/admin` non esiste più e
risponde come qualsiasi altro percorso inesistente.

- **URL del CMS:** `https://motoitaly.pages.dev/officina-segreta/`
- **Alias alternativo:** `https://motoitaly.pages.dev/capo_login_00_amministratroie`
- **Endpoint OAuth (nascosto):** `/api/accesso-officina/9d4k2m`, definito in
  `officina-segreta/config.yml` e verificato da
  `functions/api/accesso-officina/[chiave].js`

> ⚠️ Il repository deve restare **privato**: `config.yml` e le Functions
> contengono il path segreto. Se il repository viene reso pubblico, questi
> percorsi vanno cambati.

### Protezioni applicate

| Dove | Cosa |
| --- | --- |
| `officina-segreta/` | Cartella CMS rinominata (noindex, no-referrer, no-store via `_headers`) |
| `js/bar.js`, `js/wiki.js` | Rimossi i link pubblici verso `/admin/` |
| `_redirects` | Alias porta ora al nuovo path (302, non 301) |
| `_headers` | `X-Robots-Tag: noindex` anche sul vecchio `/admin` |
| `robots.txt` | Disallow su `/admin` e `/api/` |
| `functions/api/accesso-officina/[chiave].js` | Chiave segreta nel path: richieste senza chiave → 404 generico |
| `_routes.json` | Corretto: `exclude: ["/*"]` disabilitava tutte le Functions (login GitHub rotto) |

