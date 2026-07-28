# Integrare MMG AI Assistant via Git — Pași exacți pentru live

**Commit:** `8d5cfd8 — Add MMG AI Assistant floating widget`
**Branch local:** `main`
**Structură productie:** `download/mmg-ai/` → urcă în repo-ul site-ului MMG ca `/mmg-ai/`

---

## CE E GATA PÂNĂ ACUM

Repo-ul local conține commit-ul cu **toate cele 6 fișiere** din folderul `/mmg-ai/`:

| Fișier | Rol | Dimensiune |
|--------|-----|------------|
| `embed.min.js` | Loader 1-linie (încarcă CSS + JSON + JS, async) | ~6 KB |
| `mmg-ai.js` | Motor chat — 6 fluxuri calificare + lead + WhatsApp handoff | ~36 KB |
| `mmg-ai.css` | Stil dark + auriu + alb, mobile full-screen | ~20 KB |
| `mmg-knowledge.json` | Bază cunoștințe cu date reale MMG | ~19 KB |
| `avatar.png` | Avatar premium femeie business 25-30 ani | ~86 KB |
| `INTEGRARE.md` | Documentație completă (integrare, schema lead, analytics) | ~17 KB |

**Date reale MMG configurate consistent în 3 locuri din JSON:**
- Telefon: `+40 748 364 907`
- WhatsApp: `40748364907`
- Email: `contact@mmgaccounting.ro`
- Adresă: `Str. Pădurii Nr. 6, Sat Răsboieni, Com. Tibănești, Jud. Iași`
- Identitate agent: „MMG AI Assistant" / „Asistent digital"

---

## PAȘI PENTRU PUSH LA PRODUCȚIE

### Pas 1 — Clonează repo-ul site-ului MMG (dacă nu există deja local)

```bash
# Pe mașina ta de dezvoltare
git clone https://github.com/MMG-Accounting/mmgaccounting.ro.git
cd mmgaccounting.ro
git checkout main   # sau branch-ul folosit de producție (ex: production, live, master)
git pull origin main
```

### Pas 2 — Copiază folderul `/mmg-ai/` în root-ul repo-ului site-ului

```bash
# Din folderul root al repo-ului site-ului
# Copiază cele 6 fișiere din /home/z/my-project/download/mmg-ai/ în ./mmg-ai/
mkdir -p mmg-ai
cp /home/z/my-project/download/mmg-ai/embed.min.js        mmg-ai/
cp /home/z/my-project/download/mmg-ai/mmg-ai.js           mmg-ai/
cp /home/z/my-project/download/mmg-ai/mmg-ai.css          mmg-ai/
cp /home/z/my-project/download/mmg-ai/mmg-knowledge.json  mmg-ai/
cp /home/z/my-project/download/mmg-ai/avatar.png          mmg-ai/
cp /home/z/my-project/download/mmg-ai/INTEGRARE.md        mmg-ai/

# Verifică structura
ls -la mmg-ai/
# Trebuie să conțină exact cele 6 fișiere, nimic altceva
```

### Pas 3 — Modifică template-ul principal al site-ului

Site-ul MMG cel mai probabil folosește un template global (PHP, WordPress, Next.js, Hugo etc.). Adaugă **1 linie** înainte de `</body>` în **toate** template-urile care generează paginile principale.

#### Variantă A — Site PHP/HTML static

Caută fișierele `header.php` / `footer.php` / `index.html` / orice layout global și adaugă înainte de `</body>`:

```html
<!-- MMG AI Assistant — floating widget, all pages -->
<script src="/mmg-ai/embed.min.js" async></script>
```

Verifică pe paginile principale că linia apare:
- `index.html` (Homepage)
- `servicii.html` sau `services.html`
- `despre-noi.html` sau `about.html`
- `contact.html`

#### Variantă B — WordPress

Tema folosește `footer.php` — adaugă înainte de `</body>`:

```php
<!-- MMG AI Assistant — floating widget, all pages -->
<script src="/mmg-ai/embed.min.js" async></script>
```

Sau, mai elegant, în `functions.php` al temei copil:

```php
add_action('wp_footer', function () {
    echo '<script src="/mmg-ai/embed.min.js" async></script>' . "\n";
}, 100);
```

#### Variantă C — Next.js / React / Astro

În layout-ul root (ex: `app/layout.tsx` sau `src/layouts/Layout.astro`):

```tsx
// În <body>, la final
<script src="/mmg-ai/embed.min.js" async></script>
```

Pentru Next.js App Router, copiază folderul `mmg-ai/` în `public/` ca să fie servit la `/mmg-ai/`.

#### Variantă D — Site static generat (Hugo, Jekyll, Eleventy)

Găsește layout-ul de bază (ex: `_layouts/default.html` la Jekyll, `layouts/_default/baseof.html` la Hugo) și adaugă înainte de `</body>`:

```html
<script src="/mmg-ai/embed.min.js" async></script>
```

### Pas 4 — Verifică că linia apare pe TOATE paginile, nu doar homepage

După modificare, rulează un grep pe fișierele generate (sau pe repo):

```bash
# Caută în toate fișierele template
grep -rn "mmg-ai/embed.min.js" .

# Trebuie să apară în:
# - layout-ul principal (o singură dată)
# - eventual pagini statice care nu folosesc layout-ul (trebuie adăugat manual)
```

Dacă site-ul are pagini care nu folosesc layout-ul comun (ex: o landing page standalone), adaugă linia manual acolo.

### Pas 5 — Commit

```bash
git add mmg-ai/
git add footer.php   # sau ce fișier template-ai modificat
# (adaugă și alte fișiere modificate)

git commit -m "Add MMG AI Assistant floating widget"
```

### Pas 6 — Push pe branch-ul de producție

```bash
# Dacă e pe main:
git push origin main

# Dacă producția e pe alt branch:
git checkout production
git merge main
git push origin production
```

### Pas 7 — Așteaptă deploy automat

Dacă MMG are CI/CD (Vercel, Netlify, GitHub Actions, Cloudflare Pages, etc.), deploy-ul pornește automat la push. Verifică statusul în dashboard-ul platformei.

**Dacă NU există deploy automat** — conectează-te pe server și:

```bash
ssh user@mmgaccounting.ro
cd /var/www/mmgaccounting.ro
git pull origin main
# Dacă e PHP/static, gata. Dacă e Next.js, mai rulează:
# npm run build && pm2 restart mmg
```

### Pas 8 — Verifică live (test ca vizitator)

Intră pe `https://mmgaccounting.ro` și verifică:

| # | Verificare | Cum verifici |
|---|-----------|---------------|
| 1 | Buton MMG AI apare dreapta-jos, auriu, cu eticheta „MMG AI / Asistent digital" | Vizual pe homepage |
| 2 | Butonul e plasat DEASUPRA butonului WhatsApp existent (fără suprapunere) | Vizual |
| 3 | Click pe buton → chat se deschide, avatarul apare (femeie business) | Click |
| 4 | Header: „MMG AI Assistant" + „Asistent digital" | Vizual în chat |
| 5 | Greeting: „Bună ziua! Sunt MMG AI Assistant..." | Vizual în chat |
| 6 | Toate cele 6 butoane quick action apar | Vizual |
| 7 | Click pe „Am nevoie de contabilitate" → fluxul pornește cu întrebări | Click |
| 8 | Completează fluxul → formularul de lead apare | Click prin flux |
| 9 | Completează Nume + Telefon (obligatorii) → click „Trimite solicitarea" | Form submit |
| 10 | Mesaj de succes + buton WhatsApp cu mesaj pre-populat apare | Vizual |
| 11 | Click WhatsApp → deschide `wa.me/40748364907?text=Bună ziua, sunt ...` | Click |
| 12 | **Verifică pe paginile /servicii, /despre-noi, /contact** — butonul trebuie să apară pe TOATE | Navighează |
| 13 | Verifică în consolă (F12) — zero erori JavaScript | DevTools Console |
| 14 | Verifică Network — `embed.min.js`, `mmg-ai.css`, `mmg-ai.js`, `mmg-knowledge.json`, `avatar.png` se încarcă cu 200/304 | DevTools Network |
| 15 | Test mobile (Chrome DevTools → 375px) — chat full-screen, FAB poziționat corect | Responsive test |

### Pas 9 (opțional) — Activează salvarea lead-urilor în CRM/email

În momentul în care vrei ca lead-urile să se salveze la MMG (nu doar local în browser), adaugă atributul `data-mmg-leads-endpoint`:

```html
<script
  src="/mmg-ai/embed.min.js"
  data-mmg-leads-endpoint="https://mmgaccounting.ro/leads.php"
  async>
</script>
```

Implementează `leads.php` pe server (exemplu complet în `INTEGRARE.md` §6.B).

### Pas 10 (opțional) — Activează conversia în Google Analytics 4

Widget-ul împinge deja automat evenimentul `mmg_lead` în `gtag` și `dataLayer`. Dacă ai GA4 instalat, doar marchează `mmg_lead` ca **Conversion** în GA4 Admin → Conversions.

---

## ROLLBACK (în caz de problemă)

Dacă ceva nu merge bine după deploy:

```bash
# Revert rapid
git revert HEAD
git push origin main

# Sau dezactivează widget-ul temporar fără revert — comentează linia din template:
# <!-- <script src="/mmg-ai/embed.min.js" async></script> -->
git commit -am "Temporarily disable MMG AI widget"
git push origin main
```

---

## CE NU TREBUIE SĂ FACI

- ❌ Nu modifica designul existent al site-ului
- ❌ Nu crea pagini noi
- ❌ Nu schimba textele din `mmg-knowledge.json` fără să le sincronizezi în toate cele 3 locuri (company, contact_block, fallback_answers)
- ❌ Nu încărca fișierele manual pe server (doar prin Git)
- ❌ Nu aduga `data-mmg-*` atribute fără să le testezi mai întâi pe staging

---

## CONTACT

Pentru întrebări tehnice despre acest widget, vezi `INTEGRARE.md` din folderul `/mmg-ai/`.
