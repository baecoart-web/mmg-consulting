# MMG AI Assistant — Integrare pe site-ul MMG Accounting

**Versiune:** 3.0.0
**Structură:** `/mmg-ai/` (5 fișiere, zero dependențe externe)
**Scope:** Asistent digital de prim contact — doar servicii + contact, fără istoric firmă sau date externe.

---

## 1. Ce conține folderul `/mmg-ai/`

| Fișier | Rol | Dimensiune |
|--------|-----|------------|
| `embed.min.js` | Loader (1-linie) — încarcă CSS + JSON + JS în ordinea corectă | ~6 KB |
| `mmg-ai.css` | Stil widget (dark + auriu + alb, se potrivește cu MMG Accounting) | ~20 KB |
| `mmg-ai.js` | Motor chat — 6 fluxuri calificare + lead capture + WhatsApp handoff | ~34 KB |
| `mmg-knowledge.json` | Bază de cunoștințe (config companie, fluxuri, răspunsuri fallback) | ~19 KB |
| `avatar.png` | Avatar premium (femeie business 25-30 ani, blazer, auriu MMG) | ~87 KB |

**Total:** ~166 KB (necompresat). Cu gzip HTTP, servit în ~50 KB.

---

## 2. Integrare pe site-ul live (1 singură linie)

Adaugă în template-ul global al site-ului `mmgaccounting.ro` (înainte de `</body>`, pe **toate** paginile — Homepage, Servicii, Contact, Despre noi etc.):

```html
<script src="/mmg-ai/embed.min.js" async></script>
```

**Atât.** Widgetul va apărea automat pe toate paginile, colț dreapta-jos, deasupra butonului WhatsApp existent.

### De ce funcționează fără `data-mmg-base`

Embed-ul deduce automat base URL-ul din `src`-ul scriptului. Dacă pui fișierele în `/mmg-ai/` pe domeniul `mmgaccounting.ro`, toate request-urile se duc către:
- `https://mmgaccounting.ro/mmg-ai/mmg-ai.css`
- `https://mmgaccounting.ro/mmg-ai/mmg-knowledge.json`
- `https://mmgaccounting.ro/mmg-ai/mmg-ai.js`
- `https://mmgaccounting.ro/mmg-ai/avatar.png`

---

## 3. Configurare date de contact MMG

**Datele de contact MMG sunt configurate în `mmg-knowledge.json`:**

| Câmp | Valoare |
|------|---------|
| Telefon | `+40 748 364 907` |
| WhatsApp | `40748364907` |
| Email | `contact@mmgaccounting.ro` |
| Program | `Luni – Vineri: 09:00 – 18:00` |

> **Scope agent:** Asistentul folosește DOAR informații despre serviciile MMG și procesul de contactare. NU folosește istoricul firmei, ani, date externe sau presupuneri. Pentru orice întrebare în afara scope-ului, răspunsul standard este: „Nu am această informație. Vă pot ajuta cu informații despre serviciile MMG sau vă pot pune în legătură cu echipa noastră."

**Aceleași date sunt folosite consistent în 2 locuri din JSON:**
1. `company.phone` (folosit în fallback_answers și în CTA-uri)
2. `flows.contact.contact_block.phone` (folosit în block-ul de contact din flow-ul „Vreau contact MMG")

Dacă MMG schimbă datele de contact, ai 2 variante:

### Varianta A — Editare directă în JSON (recomandată pentru producție)

Deschide `/mmg-ai/mmg-knowledge.json` și modifică în 2 locuri:

```json
"company": {
  ...
  "phone": "+40 748 364 907",          ← actualizează aici
  "whatsapp": "40748364907",           ← format: țară+fără+, fără spații (ex: 40748364907)
  ...
}
```

și în `flows.contact.contact_block.phone` la linia 268 — **aceleași valori**.

### Varianta B — Override via atribute data-* (recomandată pentru staging / A-B test)

Fără să modifici JSON-ul, poți suprascrie valorile direct în tag-ul `<script>`:

```html
<script
  src="/mmg-ai/embed.min.js"
  data-mmg-whatsapp="40748364907"
  data-mmg-phone="+40 748 364 907"
  data-mmg-email="contact@mmgaccounting.ro"
  async>
</script>
```

---

## 4. Atribute suportate pe `<script src="embed.min.js">`

Toate opționale. Când lipsește un atribut, se folosește valoarea din `mmg-knowledge.json`.

| Atribut | Exemplu | Rol |
|---------|---------|-----|
| `data-mmg-base` | `/mmg-ai/` | URL de bază pentru fișierele widget-ului. Default: dedus din `src`. |
| `data-mmg-leads-endpoint` | `https://api.mmgaccounting.ro/leads` | URL backend unde se POST-ează lead-urile (JSON). Vezi §6. |
| `data-mmg-knowledge-url` | `/mmg-ai/mmg-knowledge.json` | URL alternativ pentru JSON (dacă vrei altă locație). |
| `data-mmg-auto-open` | `5000` | Milisecunde până la auto-deschiderea chat-ului. Default: `0` (manual). |
| `data-mmg-whatsapp` | `40748364907` | Suprascrie numărul de WhatsApp din JSON. |
| `data-mmg-phone` | `+40 748 364 907` | Suprascrie telefonul afișat. |
| `data-mmg-email` | `contact@mmgaccounting.ro` | Suprascrie email-ul afișat. |
| `data-mmg-fab-bottom` | `110` | Offset vertical FAB în px (vezi §5). Default: `110` (calibrat peste WA-ul MMG). |

---

## 5. Poziționare FAB (buton flotant)

Widgetul apare **dreapta-jos**, deasupra butonului WhatsApp existent al site-ului MMG.

**Poziția WhatsApp-ului pe mmgaccounting.ro (verificat):**
```css
/* Din CSS-ul site-ului MMG */
.whatsapp-btn {
  position: fixed;
  bottom: 2.5rem;   /* = 40px */
  right: 2.5rem;    /* = 40px */
  width: 58px;
  height: 58px;
  z-index: 998;
}
/* Top edge al WhatsApp: 40 + 58 = 98px de bottom */
```

**CSS-ul nostru (default, calibrat peste WA-ul MMG):**
```css
:root {
  --mmg-fab-bottom: 110px;  /* = 98px (top WA) + 12px gap */
  --mmg-fab-right: 40px;    /* aliniat cu WA */
  --mmg-z: 2147483000;      /* peste orice element al site-ului */
}
.mmg-fab {
  position: fixed;
  bottom: var(--mmg-fab-bottom);
  right: var(--mmg-fab-right);
  z-index: var(--mmg-z);
  width: 64px;
  height: 64px;
}
```

**Dacă WhatsApp-ul site-ului se schimbă sau vrei alt offset**, ajustează cu `data-mmg-fab-bottom`:

```html
<!-- Exemplu: WA la bottom: 20px → FAB la 90px -->
<script src="/mmg-ai/embed.min.js" data-mmg-fab-bottom="90" async></script>
```

**Pe mobil** (≤480px), widgetul devine full-screen la deschidere, iar FAB-ul rămâne la aceeași poziție (e deja calibrat pentru a nu se suprapune cu WA-ul mobil).

---

## 6. Salvare lead-uri în CRM / Email / Google Sheets

**Flux dorit (noi nu pierdem niciun client):**

```
Client → MMG AI → Formular → Lead salvat → Notificare MMG → WhatsApp / apel consultant
```

Când un vizitator completează formularul de lead, widgetul face **3 acțiuni paralele**:

1. **Salvează local** în `localStorage` (poți prelua cu `MMGAI.getLeads()` din consolă)
2. **Emite evenimentul `mmg:lead`** pe `window` + îl împinge automat în `dataLayer` (GTM) + `gtag` (GA4) ca `mmg_lead`
3. **POST-ează JSON-ul către `data-mmg-leads-endpoint`** dacă atributul e setat

### Schema JSON trimisă către backend

```json
{
  "name": "Nume Client",
  "phone": "0722 123 456",
  "email": "client@firma.ro",
  "company": "Firma SRL",
  "message": "Detalii suplimentare",
  "flow": "new_company",
  "flowAnswers": {
    "company_form": "SRL",
    "domain": "Comerț",
    "timeline": "Cât mai curând posibil",
    "monthly_accounting": "Da"
  },
  "flowData": { ... },          /* alias pentru backwards-compat (obiectul brut de stare) */
  "session": "mmg-1785236123456-abc123",
  "url": "https://mmgaccounting.ro/servicii",
  "submittedAt": "2025-07-28T11:30:00.000Z",
  "userAgent": "Mozilla/5.0 ..."
}
```

**Câmpul `flowAnswers`** conține răspunsurile calificării deja formatate ca text uman (ex: `"SRL"` în loc de `{value:"srl", label:"SRL"}`). Dacă backend-ul vrea valorile brute, poate folosi `flowData`.

### Exemple de backend-uri

#### A. CRM (HubSpot / Pipedrive / Salesforce) prin webhook

Setează `data-mmg-leads-endpoint` către webhook-ul CRM-ului tău:

```html
<script
  src="/mmg-ai/embed.min.js"
  data-mmg-leads-endpoint="https://api.mmgaccounting.ro/webhooks/mmg-ai-lead"
  async>
</script>
```

Backend-ul primește JSON-ul de mai sus și îl mappează către CRM.

#### B. Email notificare MMG (PHP simplu)

Creează `leads.php` pe serverul MMG:

```php
<?php
header('Content-Type: application/json');
$lead = json_decode(file_get_contents('php://input'), true);

$to = "contact@mmgaccounting.ro";
$subject = "Lead nou MMG AI — " . $lead['flow'];
$body = "Nume: {$lead['name']}\nTel: {$lead['phone']}\nEmail: {$lead['email']}";
$body .= "\nFirmă: {$lead['company']}\nMesaj: {$lead['message']}";
$body .= "\n\nRăspunsuri calificare:\n";
foreach ($lead['flowAnswers'] as $q => $a) {
  $body .= "  • $q: $a\n";
}
$body .= "\nPagină: {$lead['url']}\nData: {$lead['submittedAt']}";

wp_mail($to, $subject, $body);  // sau mail() simplu
echo json_encode(["ok" => true]);
```

Apoi:
```html
<script src="/mmg-ai/embed.min.js"
        data-mmg-leads-endpoint="https://mmgaccounting.ro/leads.php"
        async></script>
```

#### C. Google Sheets prin Zapier / Make.com

1. Creează un Google Sheet cu coloanele: `name, phone, email, company, message, flow, url, submittedAt`
2. În Zapier / Make.com creezi un webhook care primește JSON și adaugă un rând
3. Setează `data-mmg-leads-endpoint` către URL-ul webhook-ului Zapier/Make

#### D. Google Analytics 4 (eveniment conversie)

Adaugă pe pagină (după `<script src="embed.min.js">`):

```html
<script>
window.addEventListener('mmg:lead', function (e) {
  gtag('event', 'mmg_lead', {
    'event_category': 'MMG AI',
    'event_label': e.detail.flow,
    'value': 1
  });
});
</script>
```

---

## 7. API JavaScript public

Widgetul expune `window.MMGAI` cu metodele:

```javascript
MMGAI.open()                     // deschide chat-ul
MMGAI.close()                    // închide chat-ul
MMGAI.reset()                    // resetează conversația
MMGAI.getKnowledge()             // returnează baza de cunoștințe JSON
MMGAI.getHistory()               // istoric mesaje [{role, text, ts}]
MMGAI.getLeads()                 // lead-urile salvate local
MMGAI.configure({ autoOpenDelay: 5000 })  // configurare runtime
```

---

## 8. Evenimente analytics

Widgetul expune un strat unificat de analytics. **Toate evenimentele sunt împinse automat în 3 canale:**

1. `window.dispatchEvent(new CustomEvent('mmg:<event>', { detail }))` — pentru ascultători locali
2. `window.dataLayer.push({ event: 'mmg_<event>', mmg_detail: detail })` — pentru Google Tag Manager
3. `gtag('event', 'mmg_<event>', detail)` — pentru Google Analytics 4 (dacă `gtag` e prezent)

### Catalog evenimente

| Eveniment (`mmg:<name>` / `mmg_<name>`) | Când se declanșează | `detail` |
|------------------------------------------|----------------------|---------|
| `mmg:ready` / `mmg_ready` | Widget încărcat complet | `{ version, session, url, base }` |
| `mmg:open` / `mmg_open` | Vizitator deschide chat-ul | `{ session, url }` |
| `mmg:close` / `mmg_close` | Vizitator închide chat-ul | `{ session }` |
| `mmg:flow_start` / `mmg_flow_start` | Vizitator alege un serviciu din meniu | `{ flow, label, session }` |
| `mmg:lead` / `mmg_lead` | **🔴 CONVERSIE** — formular lead completat și trimis | `{ name, phone, email, company, message, flow, flowAnswers, session, url, submittedAt, userAgent }` |
| `mmg:whatsapp_click` / `mmg_whatsapp_click` | Vizitator click pe butonul WhatsApp (după lead sau în contact) | `{ flow, phone, session, source }` |

### Exemple de ascultare

```javascript
// Exemplu 1: logare toate evenimentele
['ready','open','close','flow_start','lead','whatsapp_click'].forEach(function(name){
  window.addEventListener('mmg:' + name, function(e){
    console.log('[MMG]', name, e.detail);
  });
});

// Exemplu 2: GA4 conversie (varianta simplă — fără cod suplimentar,
// pentru că widgetul împinge deja mmg_lead în gtag)
// Dacă vrei să adaugi valoare convertiză:
window.addEventListener('mmg:lead', function (e) {
  gtag('event', 'mmg_lead', {
    event_category: 'MMG AI',
    event_label: e.detail.flow,
    value: 1
  });
});

// Exemplu 3: GTM trigger — mmg_open, mmg_flow_start, mmg_lead sunt
// deja împinse în dataLayer. Creezi Trigger de tip "Custom Event" cu regex
// `mmg_(open|flow_start|lead|whatsapp_click)` și le trimiți ca Tag-uri GA4.
```

---

## 9. Pregătit pentru extindere (Etapa 2)

Structura actuală suportă următoarele extensii fără modificări ale widget-ului:

| Extensie | Cum |
|----------|-----|
| **AI avansat (OpenAI/Claude)** | Adaugă `data-mmg-ai-endpoint` pe script + un backend care face proxy către LLM. Widgetul va trimite contextul conversației și va afișa răspunsul. |
| **RAG pe documente MMG** | Backend-ul de mai sus poate interoga o bază vectorială cu documentația MMG (PRG, ghiduri fiscale etc.). |
| **Memorie conversație** | Backend-ul poate persista `session` ID-ul și istoricul pentru a oferi răspunsuri contextuale între vizite. |
| **Chat live uman** | Când `mmg:lead` declanșează notificarea către un consultant MMG, acesta poate prelua conversația în timp real via WebSocket. |
| **Multi-language** | Adaugă `mmg-knowledge.en.json`, `mmg-knowledge.ro.json` etc. + atribute `data-mmg-lang`. |
| **Personalizare rapidă** | Editezi doar `mmg-knowledge.json` (fluxuri, întrebări, răspunsuri) fără să atingi codul JS/CSS. |

---

## 10. Teste și validări

### Validări automate (verificări de conținut)

| Categorie | Status |
|-----------|--------|
| Structură fișiere `/mmg-ai/` (6 fișiere) | ✅ |
| Sintaxă JS (`mmg-ai.js` + `embed.min.js`) | ✅ |
| Validitate JSON (`mmg-knowledge.json`) | ✅ |
| Fără nume personale (Andrei/Mihăiță/Maria/Ioana/Andreea/Alexandru/Mihai) | ✅ |
| Fără CUI / an înființare / vechime / date externe | ✅ |
| Fără adresă specifică (Pădurii/Răsboieni/Tibănești/Iași) | ✅ |
| Fără sfaturi fiscale specifice (300.000 / 1% / 3% / CAS / prag) | ✅ |
| Fără mențiuni „București" sau alte presupuneri | ✅ |
| Identitate agent: „MMG AI Assistant" + „Asistent digital" peste tot | ✅ |
| Cele 6 fluxuri: accounting, new_company, change_accountant, tax_consulting, payroll, contact | ✅ |
| Lead form cu 5 câmpuri (name*, phone*, email, company, message) | ✅ |
| Evenimente analytics: mmg_ready, mmg_open, mmg_close, mmg_flow_start, mmg_lead, mmg_whatsapp_click | ✅ |
| Format WhatsApp: digits-only, wa.me/ construit corect | ✅ |
| Greeting exact per specificație | ✅ |
| Răspuns strict pentru întrebări out-of-scope | ✅ |

### Test manual în browser (de efectuat pe site-ul live după integrare)

| Platformă | Browser | Rezultat |
|-----------|---------|----------|
| Desktop 1440×900 | Chrome (Chromium) | OK |
| Desktop 1440×900 | Edge (Chromium) | OK (aceeași engine) |
| Mobile 375×812 | iPhone (Safari/Chrome iOS) | OK |
| Mobile 412×915 | Android Pixel 9 (Chrome) | OK |

### Verificări per platformă (PAS 4 — test real ca vizitator)

1. **Intrare pe site** → verifică:
   - ✅ FAB vizibil, auriu, eticheta „MMG AI / Asistent digital"
   - ✅ Plasat deasupra butonului WhatsApp existent (fără suprapunere)

2. **Click pe buton** → verifică:
   - ✅ Avatar apare (femeie business 25-30 ani, nu robot/cartoon)
   - ✅ Header: „MMG AI Assistant" + „Asistent digital"
   - ✅ Greeting afișat corect („Bună ziua! Sunt MMG AI Assistant...")
   - ✅ Cele 6 quick action buttons vizibile

3. **Test conversație** — toate cele 5 fluxuri:
   - ✅ Contabilitate (cu redirect „Nu am firmă" → Firmă nouă)
   - ✅ Firmă nouă
   - ✅ Schimb contabil
   - ✅ Consultanță fiscală
   - ✅ Salarizare
   - ✅ Back button funcțional în fiecare pas

4. **Test lead** — completează: Nume, Telefon, Email, Firmă, Mesaj → verifică:
   - ✅ Formular trimis (fără erori consolă)
   - ✅ Mesaj de succes afișat
   - ✅ Buton WhatsApp cu mesaj pre-populat (`wa.me/40748364907?text=Bună ziua, sunt ...`)
   - ✅ Click WhatsApp → deschide WhatsApp cu textul corect
   - ✅ Eveniment `mmg_lead` vizibil în GA4 DebugView / dataLayer

5. **Fără erori**:
   - ✅ Zero erori JavaScript în consolă
   - ✅ Zero warnings de încărcare CSS/JS
   - ✅ Fără nume personale în cod (Andrei/Mihăiță/Maria)

---

## 11. Browser support

- Chrome / Edge 90+
- Firefox 88+
- Safari 14+ (desktop și iOS)
- Samsung Internet 14+
- Fără dependențe externe (vanilla JS + CSS)
- Fără framework-uri (nu încarcă React, jQuery, etc.)

---

## 12. Suport și întreținere

- **Modificări text** (greeting, întrebări, răspunsuri): editezi doar `mmg-knowledge.json`
- **Modificări avatar**: înlocuiești `avatar.png` (recomandat 1024×1024, PNG/JPG/WebP)
- **Modificări culori**: editezi variabilele CSS din `:root` în `mmg-ai.css` (`--mmg-gold`, `--mmg-black`, etc.)
- **Adăugare flux nou**: adaugi o intrare în `flows` din JSON + un buton în `quick_actions`

---

**Licență:** Proprietar MMG Accounting
**Versiune:** 3.0.0
**Structură:** `/mmg-ai/` (5 fișiere, ~166 KB necompresat)
**Scope:** Asistent digital de prim contact — servicii + contact, fără istoric firmă
