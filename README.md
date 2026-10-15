# Colorificio Papotti — proposta di sito (demo Tramontis)

Sito statico multipagina (HTML5, CSS, JavaScript vanilla), compatibile con GitHub Pages.
Nessun backend, nessun cookie, nessun servizio esterno a runtime: font self-hosted, mappa solo come link.

> **Questa è una proposta commerciale realizzata da Tramontis, non il sito ufficiale.**
> Le pagine sono in modalità demo (banner, filigrana, `noindex`).

## Struttura

```
index.html … note-legali.html   pagine GENERATE (non modificarle a mano)
src/pages/*.html                contenuto di ogni pagina (si modifica qui)
src/partials/                   layout, header, footer, banner demo, fascia CTA
data/site.json                  recapiti, orari, link Maps, interruttore demo
tools/build.py                  generatore (solo libreria standard di Python 3)
assets/css/style.css            stile e token (variabili CSS in :root)
assets/js/main.js               menu, header, ventaglio settori, laboratorio colore
assets/img/  assets/fonts/      immagini WebP e font (licenze OFL incluse)
favicon.svg  robots.txt  .nojekyll  404.html
```

## Avviare in locale

```bash
python3 tools/build.py          # rigenera le pagine HTML
python3 -m http.server 8000     # poi apri http://localhost:8000
```

Dopo ogni modifica a `src/` o `data/` esegui di nuovo `python3 tools/build.py`.

## Modificare testi, recapiti e orari

- **Testi di una pagina**: `src/pages/<pagina>.html` (in cima c'è il front matter con `title`, `description`, voce di menu attiva).
- **Telefono, fax, indirizzo, P.IVA, orari, link Google Maps**: solo `data/site.json`. Compaiono in header, footer, contatti, privacy, note legali e nei dati strutturati `Store` (JSON-LD) tramite segnaposto come `{{PHONE}}`.
- **Header, footer, voci di menu**: `src/partials/` e la lista `NAV` in `tools/build.py`.
- **Settori**: i sei riquadri del ventaglio sono nella home (`src/pages/index.html`, sezione `data-fan`); le panoramiche sono in `soluzioni.html`, `edilizia.html`, `carrozzeria.html`, `industria.html`. Ogni settore ha un colore (`--c:#…`) definito nei token di `style.css`.

## Aggiungere o sostituire immagini

1. Converti in WebP senza ingrandire oltre la risoluzione naturale (es. `cwebp -q 82 foto.jpg -o assets/img/nome-descrittivo.webp`).
2. Salva in `assets/img/` con nome descrittivo.
3. Nel markup indica sempre `alt`, `width` e `height` reali; `loading="lazy"` tranne per l'immagine principale in alto (LCP), che usa `fetchpriority="high"`.
4. Per sostituire una foto mantieni lo stesso nome file, oppure aggiorna i riferimenti con una ricerca in `src/`.

L'immagine di anteprima social è `assets/img/og-papotti.jpg` (1200×630).

## Disattivare la modalità demo (quando il sito viene acquistato)

Il controllo è unico: `"demo"` in `data/site.json`, che pilota `body[data-demo]`.

1. In `data/site.json` imposta `"demo": false`.
2. Esegui `python3 tools/build.py`.
3. Verifica: sparisce il banner, sparisce la filigrana, il titolo perde il prefisso `[DEMO]`, il meta `robots` `noindex, nofollow` non è più presente.
4. Il link a Tramontis nell'ultima riga del footer **resta sempre**.
5. Rimuovi anche le note `data-demo-only` rimaste nei testi (si nascondono da sole con la demo spenta).
6. Sostituisci i dati ancora da confermare (vedi report) e aggiorna `robots.txt`.

In alternativa, `python3 tools/build.py --no-demo` genera il sito senza demo senza toccare `site.json`.
Cambiare a mano `data-demo="off"` sul `body` nasconde banner e filigrana e ripulisce titolo e robots via JavaScript, ma la versione corretta per i motori di ricerca è quella rigenerata.

## Pubblicare su GitHub Pages

1. Pubblica il contenuto della radice del repository (le pagine HTML generate sono già incluse) da *Settings → Pages* sul branch scelto, cartella `/ (root)`.
2. `.nojekyll` è presente. Tutti i percorsi sono relativi, quindi il sito funziona anche sotto `https://utente.github.io/nome-repo/`.
3. Con dominio definitivo: aggiorna `og:image` con URL assoluto, crea `sitemap.xml` con il dominio reale e aggiungi la riga `Sitemap:` in `robots.txt`. **Non c'è una sitemap né un URL canonico**, perché il dominio non esiste ancora.

## Fonti e verifiche

I contenuti derivano dal sito attuale (http://www.verniciecolori.com, consultato in data 15/10/2026; l'HTTPS del sito originale presenta un certificato non valido per quel dominio). I dati non verificabili o probabilmente obsoleti non sono stati pubblicati: l'elenco completo è nel report di consegna.
