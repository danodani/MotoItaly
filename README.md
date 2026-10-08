# MotoItaly

## Accesso al pannello di amministrazione

Il CMS (Sveltia CMS) è spostato: il vecchio percorso `/admin` non esiste più e
risponde come qualsiasi altro percorso inesistente.

- **URL del CMS:** `https://motoitaly.pages.dev/officina-segreta/`
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
| `_headers` | `X-Robots-Tag: noindex` anche sul vecchio `/admin` |
| `robots.txt` | Disallow su `/admin` e `/api/` |
| `functions/api/accesso-officina/[chiave].js` | Chiave segreta nel path: richieste senza chiave → 404 generico |
| `_routes.json` | Corretto: `exclude: ["/*"]` disabilitava tutte le Functions (login GitHub rotto) |


## Caricamento degli articoli (repository privato)

Il sito legge i contenuti di `content/` in due modi:

| Cosa | Dove passa | Token |
| --- | --- | --- |
| Testo degli articoli | Asset statici same-origin: `/content/wiki/*.md`, `/content/bar/*.md` | No |
| Elenco dei file (liste e correlati) | Function `/api/contenuti/content/<cartella>` → API GitHub server-side | **Sì** |

La Function usa la variabile d'ambiente **`GITHUB_TOKEN`**: se manca e il repo è
privato, risponde `503` e le pagine mostrano lo stato di errore al posto delle
liste articoli.

Configurazione (una tantum):

1. GitHub → Settings → Developer settings → **Fine-grained PAT** con permesso
   *Contents: Read* sul repo `danodani/MotoItaly`
2. Cloudflare Dashboard → Workers & Pages → `motoitaly` → Settings →
   **Environment variables** → Production → `GITHUB_TOKEN` = `<token>`
3. Nuovo deploy

## Struttura della Wiki

- `wiki.html` — indice con **griglia categorie** (6 card) e **Ultime guide pubblicate** (max 5)
- `wiki-categoria.html?cat=<slug>` — elenco delle guide di una categoria
- Categorie: `neofiti`, `manutenzione`, `normative`, `sicurezza`, `viaggi`, `faq`
  (campo `categoria` nel frontmatter; campo `tags` per gli articoli correlati)
- `articolo.html` — in fondo mostra gli **articoli correlati** (stesso tag, wiki + bar, max 5)
- Logica condivisa in `js/content.js`; proxy in `functions/api/contenuti/[[path]].js`

