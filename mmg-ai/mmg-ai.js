/* =============================================================
   MMG AI Assistant — Chat Engine
   v2.0.0 — Dark mode + avatar premium (femeie business)
   - Vanilla JS, zero dependențe
   - Bază de cunoștințe JSON (fără OpenAI în fază 1)
   - Fluxuri calificare lead: contabilitate / firmă nouă / schimbare
     contabil / consultanță fiscală / salarizare / contact
   - Lead capture + handoff WhatsApp
   ============================================================= */
(function (global) {
  "use strict";

  /* ----------------------- Config ----------------------- */
  var MMG_CONFIG = {
    knowledgeUrl: "mmg-knowledge.json",
    autoOpenDelay: 0,           // ms after load — 0 = manual open only
    showGreetingOnOpen: true,
    pulseFirstTime: true,
    storageKey: "mmg_ai_state_v1",
    sessionKey: "mmg_ai_session_v1"
  };

  /* ----------------------- State ----------------------- */
  var knowledge = null;
  var state = {
    isOpen: false,
    greeted: false,
    currentFlow: null,          // ex: "accounting"
    currentStepIndex: 0,        // index în flow.steps
    flowData: {},               // acumulează răspunsurile
    inLeadForm: false,
    leadSubmitted: false,
    history: []                 // {role, text, ts}
  };

  /* ----------------------- DOM refs ----------------------- */
  var widgetRoot, fab, chat, body, input, sendBtn, menuBtn;

  /* ----------------------- Utils ----------------------- */
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs.hasOwnProperty(k)) {
          if (k === "class") e.className = attrs[k];
          else if (k === "html") e.innerHTML = attrs[k];
          else if (k === "text") e.textContent = attrs[k];
          else if (k.slice(0, 5) === "data-") e.setAttribute(k, attrs[k]);
          else if (k === "onclick") e.addEventListener("click", attrs[k]);
          else e.setAttribute(k, attrs[k]);
        }
      }
    }
    if (children) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function (c) {
        if (c == null) return;
        if (typeof c === "string") e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
      });
    }
    return e;
  }

  function svg(pathMarkup, viewBox) {
    viewBox = viewBox || "0 0 24 24";
    return '<svg viewBox="' + viewBox + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + pathMarkup + "</svg>";
  }

  function nowISO() { return new Date().toISOString(); }

  function saveState() {
    try {
      var persist = {
        greeted: state.greeted,
        leadSubmitted: state.leadSubmitted,
        history: state.history.slice(-30)
      };
      localStorage.setItem(MMG_CONFIG.storageKey, JSON.stringify(persist));
    } catch (e) {}
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(MMG_CONFIG.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function sessionId() {
    try {
      var s = sessionStorage.getItem(MMG_CONFIG.sessionKey);
      if (s) return s;
      s = "mmg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(MMG_CONFIG.sessionKey, s);
      return s;
    } catch (e) {
      return "mmg-" + Date.now();
    }
  }

  /* ----------------------- Avatar image ----------------------- */
  // Avatar premium generat AI — femeie business 25-30 ani, dark + gold + white
  // Structură producție: avatar.png e în același folder cu mmg-ai.js
  var AVATAR_URL = (global.__MMG_BASE__ || "") + "avatar.png";

  function avatarImgMarkup(extraClasses) {
    extraClasses = extraClasses || "";
    return '<img src="' + AVATAR_URL + '" alt="MMG AI Assistant" class="' + extraClasses + '" loading="lazy" onerror="this.style.display=\'none\'"/>';
  }

  var ICONS = {
    close: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    refresh: svg('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),
    send: svg('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
    back: svg('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'),
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
    phone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    mail: svg('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
    clock: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    chat: svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
    check: svg('<polyline points="20 6 9 17 4 12"/>')
  };

  /* ----------------------- Knowledge loader ----------------------- */
  function loadKnowledge(cb) {
    if (knowledge) { cb(knowledge); return; }

    // 1) Inline JSON (din <script type="application/json" id="mmg-knowledge-inline">)
    //    — permite rulare și fără server (file://) și elimină un request HTTP în producție
    try {
      var inline = document.getElementById("mmg-knowledge-inline");
      if (inline && inline.textContent) {
        knowledge = JSON.parse(inline.textContent);
        cb(knowledge);
        return;
      }
    } catch (e) { /* cadem pe fetch */ }

    // 2) Variabilă globală setată înainte de încărcarea scriptului
    if (global.__MMG_KNOWLEDGE__) {
      knowledge = global.__MMG_KNOWLEDGE__;
      cb(knowledge);
      return;
    }

    // 3) Fetch (când e servit prin HTTP)
    function tryFetch(url) {
      fetch(url, { cache: "no-cache" })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function (data) { knowledge = data; cb(data); })
        .catch(function () {
          // fallback: dacă suntem embeded pe alt domeniu, încearcă URL absolut
          var absUrl = (global.__MMG_BASE__ || "") + url;
          if (absUrl !== url) tryFetchAbsolute(absUrl, cb);
          else cb(null);
        });
    }

    function tryFetchAbsolute(url, cb2) {
      fetch(url, { cache: "no-cache" })
        .then(function (r) { return r.json(); })
        .then(function (data) { knowledge = data; cb2(data); })
        .catch(function () { cb2(null); });
    }

    tryFetch(MMG_CONFIG.knowledgeUrl);
  }

  /* ----------------------- Fallback answer matcher ----------------------- */
  function normalize(s) {
    return (s || "").toLowerCase()
      .replace(/[ăâ]/g, "a").replace(/[î]/g, "i").replace(/[șş]/g, "s").replace(/[țţ]/g, "t")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findFallbackAnswer(userText) {
    if (!knowledge || !knowledge.fallback_answers) return null;
    var text = normalize(userText);
    var best = null, bestScore = 0;
    knowledge.fallback_answers.forEach(function (entry) {
      var score = 0;
      entry.keywords.forEach(function (kw) {
        var k = normalize(kw);
        if (text.indexOf(k) !== -1) score += k.length;
      });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    return bestScore > 0 ? best.answer : null;
  }

  /* ----------------------- Rendering ----------------------- */
  function scrollBodyToBottom() {
    if (body) body.scrollTop = body.scrollHeight;
  }

  function pushHistory(role, text) {
    state.history.push({ role: role, text: text, ts: nowISO() });
    saveState();
  }

  /* ----------------------- Analytics ----------------------- */
  function track(eventName, detail) {
    try {
      window.dispatchEvent(new CustomEvent("mmg:" + eventName, { detail: detail || {} }));
    } catch (e) {}
    // Mirror to dataLayer pentru GTM (dacă e prezent)
    try {
      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: "mmg_" + eventName, mmg_detail: detail || {} });
      }
    } catch (e) {}
    // Mirror to gtag (dacă e prezent)
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", "mmg_" + eventName, detail || {});
      }
    } catch (e) {}
    // Debug
    try { console.log("[MMG AI] event:mmg_" + eventName, detail || {}); } catch (e) {}
  }

  function addBotMessage(text, opts) {
    opts = opts || {};
    var wrap = el("div", { class: "mmg-msg-avatar" });
    var mini = el("div", { class: "mmg-avatar-mini", html: avatarImgMarkup() });
    var msg = el("div", { class: "mmg-msg mmg-msg-bot", text: text });
    wrap.appendChild(mini);
    wrap.appendChild(msg);
    body.appendChild(wrap);
    pushHistory("bot", text);
    scrollBodyToBottom();
    if (opts.onMount) opts.onMount(msg);
    return msg;
  }

  function addUserMessage(text) {
    var msg = el("div", { class: "mmg-msg mmg-msg-user", text: text });
    body.appendChild(msg);
    pushHistory("user", text);
    scrollBodyToBottom();
  }

  function addSystemMessage(text) {
    var msg = el("div", { class: "mmg-msg mmg-msg-system", text: text });
    body.appendChild(msg);
    scrollBodyToBottom();
  }

  function addHTML(htmlNode) {
    body.appendChild(htmlNode);
    scrollBodyToBottom();
  }

  function showTyping() {
    var t = el("div", { class: "mmg-msg-avatar", "data-typing": "1" });
    var mini = el("div", { class: "mmg-avatar-mini", html: avatarImgMarkup() });
    var typing = el("div", { class: "mmg-msg mmg-msg-bot mmg-typing" }, [
      el("span", { class: "mmg-typing-dot" }),
      el("span", { class: "mmg-typing-dot" }),
      el("span", { class: "mmg-typing-dot" })
    ]);
    t.appendChild(mini);
    t.appendChild(typing);
    body.appendChild(t);
    scrollBodyToBottom();
    return t;
  }

  function removeTyping() {
    var t = body.querySelector('[data-typing="1"]');
    if (t) t.remove();
  }

  /* ----------------------- Quick actions ----------------------- */
  function renderQuickActions() {
    var wrap = el("div", { class: "mmg-quick-actions" });
    knowledge.quick_actions.forEach(function (qa) {
      var btn = el("button", {
        class: "mmg-quick-btn",
        onclick: function () { startFlow(qa.id); }
      }, [
        el("span", { class: "mmg-quick-icon", text: qa.icon }),
        el("span", { text: qa.label })
      ]);
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    scrollBodyToBottom();
    return wrap;
  }

  function removeQuickActions() {
    var qa = body.querySelector(".mmg-quick-actions");
    if (qa) qa.remove();
  }

  /* ----------------------- Flow engine ----------------------- */
  function startFlow(flowId) {
    // permitem și redirect:flow_id
    if (flowId.indexOf("redirect:") === 0) {
      flowId = flowId.split(":")[1];
    }
    var flow = knowledge.flows[flowId];
    if (!flow) return;

    // Loghează selecția utilizatorului
    var actionLabel = (knowledge.quick_actions.filter(function(q){return q.id === flowId;})[0] || {}).label || flowId;
    addUserMessage(actionLabel);
    removeQuickActions();

    state.currentFlow = flowId;
    state.currentStepIndex = 0;
    state.flowData = { flow: flowId, startedAt: nowISO(), session: sessionId() };

    // Analytics: alegere serviciu (eveniment principal de engagement)
    track("flow_start", {
      flow: flowId,
      label: actionLabel,
      session: state.flowData.session
    });

    // Fluxul "contact" are structură specială (fără steps)
    if (flowId === "contact") {
      typeThenSay(flow.intro, function () {
        showContactBlock();
      });
      return;
    }

    // Afișează intro
    typeThenSay(flow.intro, function () {
      showStep();
    });
  }

  function currentFlow() {
    if (!state.currentFlow) return null;
    return knowledge.flows[state.currentFlow];
  }

  function currentStep() {
    var f = currentFlow();
    if (!f) return null;
    return f.steps[state.currentStepIndex];
  }

  function showStep() {
    var step = currentStep();
    if (!step) return;

    typeThenSay(step.question, function () {
      if (step.type === "choice") {
        renderChoices(step);
      }
    });
  }

  function renderChoices(step) {
    var row = el("div", { class: "mmg-choice-row" });
    step.options.forEach(function (opt) {
      var b = el("button", { class: "mmg-choice-btn", text: opt.label });
      b.addEventListener("click", function () {
        chooseOption(step, opt);
      });
      row.appendChild(b);
    });

    // Back button (dacă nu e primul pas)
    if (state.currentStepIndex > 0) {
      var back = el("button", { class: "mmg-back-btn", html: ICONS.back + " <span>Înapoi</span>" });
      back.addEventListener("click", function () {
        // 1. Merge înapoi un pas
        state.currentStepIndex = Math.max(0, state.currentStepIndex - 1);
        // 2. Ștergem ultimul mesaj bot (întrebarea curentă) + ultimul row de choice
        clearFromLastBotQuestion();
        // 3. Ștergem ultimul mesaj de user (răspunsul pe care vrem să-l schimbăm)
        var userMsgs = body.querySelectorAll(".mmg-msg-user");
        if (userMsgs.length) userMsgs[userMsgs.length - 1].remove();
        // 4. Re-randăm choices pentru pasul anterior (fără a re-întreba, întrebarea e încă vizibilă)
        var prevStep = currentStep();
        if (prevStep && prevStep.type === "choice") {
          renderChoices(prevStep);
        }
      });
      row.appendChild(back);
    }

    body.appendChild(row);
    scrollBodyToBottom();
  }

  function clearFromLastBotQuestion() {
    // șterge ultimul mesaj bot (întrebarea) și ultimul row de choice
    var botMsgs = body.querySelectorAll(".mmg-msg-avatar");
    if (botMsgs.length) botMsgs[botMsgs.length - 1].remove();
    var rows = body.querySelectorAll(".mmg-choice-row");
    if (rows.length) rows[rows.length - 1].remove();
  }

  function chooseOption(step, opt) {
    // Elimină choices din UI ÎNAINTE de a adăuga mesajul user-ului
    // (altfel :last-child nu mai match-uiește choice-row)
    var rows = body.querySelectorAll(".mmg-choice-row");
    if (rows.length) rows[rows.length - 1].remove();

    addUserMessage(opt.label);
    state.flowData[step.id] = { value: opt.value, label: opt.label };

    // Determină next
    var nextId = step.next;
    if (typeof nextId === "object" && nextId !== null) {
      nextId = nextId[opt.value] || nextId._default;
    }

    // Redirect către alt flux?
    if (typeof nextId === "string" && nextId.indexOf("redirect:") === 0) {
      startFlow(nextId);
      return;
    }

    // Lead form?
    if (nextId === "lead_form") {
      typeThenSay(currentFlow().summary_template, function () {
        showLeadSummary();
        setTimeout(showLeadForm, 400);
      });
      return;
    }

    // Mai sunt pași în fluxul curent?
    var f = currentFlow();
    var nextIdx = -1;
    for (var i = 0; i < f.steps.length; i++) {
      if (f.steps[i].id === nextId) { nextIdx = i; break; }
    }
    if (nextIdx === -1) {
      // poate e ultimul pas și next lipsește
      if (state.currentStepIndex + 1 < f.steps.length) {
        state.currentStepIndex++;
        showStep();
      } else {
        endFlow();
      }
      return;
    }
    state.currentStepIndex = nextIdx;
    showStep();
  }

  function endFlow() {
    typeThenSay(currentFlow().summary_template, function () {
      showLeadSummary();
      setTimeout(showLeadForm, 400);
    });
  }

  /* ----------------------- Lead summary chip ----------------------- */
  function showLeadSummary() {
    var wrap = el("div", { class: "mmg-summary" });
    wrap.appendChild(el("strong", { text: "Rezumat solicitare" }));

    var flow = currentFlow();
    if (flow && flow.steps) {
      flow.steps.forEach(function (s) {
        var v = state.flowData[s.id];
        if (v) {
          var row = el("div", { class: "mmg-summary-row" }, [
            el("span", { text: s.question.replace(/\?$/, "") + ":" }),
            el("span", { text: v.label })
          ]);
          wrap.appendChild(row);
        }
      });
    }
    body.appendChild(wrap);
    scrollBodyToBottom();
  }

  /* ----------------------- Lead form ----------------------- */
  function showLeadForm() {
    state.inLeadForm = true;

    var form = el("div", { class: "mmg-form" });
    form.appendChild(el("div", { class: "mmg-form-title", text: "📝 " + knowledge.lead_form.title }));

    knowledge.lead_form.fields.forEach(function (f) {
      var field = el("div", { class: "mmg-form-field", "data-field": f.id });
      var label = el("label", { html: f.label + (f.required ? ' <span class="mmg-req">*</span>' : "") });
      var input;
      if (f.type === "textarea") {
        input = el("textarea", { name: f.id, placeholder: f.placeholder, rows: 3 });
      } else {
        input = el("input", { type: f.type, name: f.id, placeholder: f.placeholder });
      }
      var err = el("div", { class: "mmg-form-field-error", text: "Câmp obligatoriu" });
      field.appendChild(label);
      field.appendChild(input);
      field.appendChild(err);
      form.appendChild(field);
    });

    var submit = el("button", { class: "mmg-form-submit", type: "button" }, [
      el("span", { text: knowledge.lead_form.submit_label })
    ]);
    submit.addEventListener("click", submitLead);
    form.appendChild(submit);

    form.appendChild(el("div", { class: "mmg-form-privacy", text: "🔒 " + knowledge.lead_form.privacy_note }));

    body.appendChild(form);
    scrollBodyToBottom();
  }

  function validateLeadForm(form) {
    var ok = true;
    knowledge.lead_form.fields.forEach(function (f) {
      var field = form.querySelector('[data-field="' + f.id + '"]');
      var input = field.querySelector("input, textarea");
      var val = (input.value || "").trim();
      if (f.required && !val) {
        field.classList.add("has-error");
        ok = false;
      } else if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        field.classList.add("has-error");
        field.querySelector(".mmg-form-field-error").textContent = "Email invalid";
        ok = false;
      } else if (f.type === "tel" && val && !/^[+0-9\s\-()]{6,}$/.test(val)) {
        field.classList.add("has-error");
        field.querySelector(".mmg-form-field-error").textContent = "Telefon invalid";
        ok = false;
      } else {
        field.classList.remove("has-error");
      }
    });
    return ok;
  }

  function collectLeadData(form) {
    var data = {};
    knowledge.lead_form.fields.forEach(function (f) {
      var input = form.querySelector('[data-field="' + f.id + '"] input, [data-field="' + f.id + '"] textarea');
      data[f.id] = (input.value || "").trim();
    });
    return data;
  }

  function submitLead() {
    var form = body.querySelector(".mmg-form");
    if (!form) return;
    if (!validateLeadForm(form)) return;

    var submitBtn = form.querySelector(".mmg-form-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Se trimite...";

    var lead = collectLeadData(form);
    lead.flow = state.currentFlow;
    // Păstrăm flowData pentru uz intern (conține startedAt, session, flow)
    // Și expunem flowAnswers pentru backend (mapate ca {stepId: {value, label}})
    // conform schemei documentate în INTEGRARE.md
    var flowAnswers = {};
    Object.keys(state.flowData).forEach(function (k) {
      if (k === "flow" || k === "startedAt" || k === "session") return;
      var v = state.flowData[k];
      if (v && typeof v === "object") {
        flowAnswers[k] = v.label || v.value || String(v);
      } else {
        flowAnswers[k] = v;
      }
    });
    lead.flowAnswers = flowAnswers;
    lead.flowData = state.flowData;  // alias pentru backwards-compat
    lead.submittedAt = nowISO();
    lead.session = sessionId();
    lead.url = window.location.href;
    lead.userAgent = navigator.userAgent;

    // ----- Aici se trimite lead-ul la backend-ul MMG -----
    // Salvăm local + dispatch event + (dacă e configurat) POST către backend
    saveLead(lead);

    // Încearcă POST la backend (dacă există)
    postLeadToBackend(lead, function () {
      // indiferent de rezultat, afișăm success
      form.remove();
      state.inLeadForm = false;
      state.leadSubmitted = true;
      saveState();

      typeThenSay(knowledge.lead_form.success_message, function () {
        renderWhatsAppCTA(lead);
        renderEndMenu();
      });
    });
  }

  function saveLead(lead) {
    try {
      var arr = JSON.parse(localStorage.getItem("mmg_leads_v1") || "[]");
      arr.push(lead);
      localStorage.setItem("mmg_leads_v1", JSON.stringify(arr));
    } catch (e) {}
    // Când nu există endpoint backend configurat: salvăm local în localStorage
    // + dispatch event + console pentru audit. Când data-mmg-leads-endpoint
    // e setat, lead-ul se POST-ează și către backend (CRM/email/Sheets).
    try { console.log("[MMG AI] Lead capturat:", lead); } catch (e) {}
    // Eveniment principal de conversie: mmg:lead / mmg_lead
    // track() expune atat CustomEvent pe window, cat si dataLayer.push + gtag
    track("lead", lead);
  }

  function postLeadToBackend(lead, cb) {
    // MMG va înlocui URL-ul cu endpoint-ul real (ex: https://api.mmg-accounting.ro/leads)
    var endpoint = (global.__MMG_LEADS_ENDPOINT__ || null);
    if (!endpoint) { cb(false); return; }
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    }).then(function () { cb(true); }).catch(function () { cb(false); });
  }

  function renderWhatsAppCTA(lead) {
    var waNumber = knowledge.company.whatsapp;
    var waText = buildWhatsAppMessage(lead);
    var href = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(waText);

    var a = el("a", {
      class: "mmg-whatsapp-cta",
      href: href,
      target: "_blank",
      rel: "noopener noreferrer",
      html: knowledge.lead_form.whatsapp_button_label
    });
    // prepend icon
    a.insertAdjacentHTML("afterbegin", ICONS.whatsapp);
    // Analytics: click WhatsApp (conversie secundară)
    a.addEventListener("click", function () {
      track("whatsapp_click", {
        flow: lead.flow,
        phone: lead.phone,
        session: lead.session,
        source: "lead_success"
      });
    });
    body.appendChild(a);
    scrollBodyToBottom();
  }

  function buildWhatsAppMessage(lead) {
    var lines = [];
    lines.push("Bună ziua, sunt " + (lead.name || "[nume]") + ".");
    lines.push("");
    lines.push("Solicitare prin MMG AI:");

    var flow = knowledge.flows[lead.flow];
    if (flow) {
      lines.push("• Subiect: " + flowName(lead.flow));
      flow.steps.forEach(function (s) {
        var v = lead.flowData[s.id];
        if (v) lines.push("• " + s.question.replace(/\?$/, "") + ": " + v.label);
      });
    }
    if (lead.company) lines.push("• Firmă: " + lead.company);
    if (lead.email) lines.push("• Email: " + lead.email);
    if (lead.message) lines.push("• Mesaj: " + lead.message);
    lines.push("");
    lines.push("Telefon: " + lead.phone);
    return lines.join("\n");
  }

  function flowName(id) {
    var qa = knowledge.quick_actions.filter(function (q) { return q.id === id; })[0];
    return qa ? qa.label : id;
  }

  /* ----------------------- Contact flow ----------------------- */
  function showContactBlock() {
    var c = knowledge.flows.contact;
    var card = el("div", { class: "mmg-contact-card" });

    var rows = [
      { icon: ICONS.phone, label: knowledge.company.phone, href: "tel:" + knowledge.company.phone.replace(/\s/g, "") },
      { icon: ICONS.mail, label: knowledge.company.email, href: "mailto:" + knowledge.company.email },
      { icon: ICONS.clock, label: knowledge.company.program }
    ];
    rows.forEach(function (r) {
      var row = el("div", { class: "mmg-contact-row" });
      row.insertAdjacentHTML("afterbegin", r.icon);
      if (r.href) {
        row.appendChild(el("a", { href: r.href, text: r.label }));
      } else {
        row.appendChild(el("span", { text: r.label }));
      }
      card.appendChild(row);
    });

    var actions = el("div", { class: "mmg-contact-actions" });

    var waText = "Bună ziua, aș dori informații despre serviciile MMG Accounting.";
    var waHref = "https://wa.me/" + knowledge.company.whatsapp + "?text=" + encodeURIComponent(waText);
    var waBtn = el("a", {
      class: "mmg-contact-btn mmg-contact-btn-whatsapp",
      href: waHref,
      target: "_blank",
      rel: "noopener noreferrer",
      text: c.contact_block.whatsapp_label
    });
    waBtn.insertAdjacentHTML("afterbegin", ICONS.whatsapp);

    var callBtn = el("a", {
      class: "mmg-contact-btn mmg-contact-btn-call",
      href: "tel:" + knowledge.company.phone.replace(/\s/g, ""),
      text: c.contact_block.call_label
    });
    callBtn.insertAdjacentHTML("afterbegin", ICONS.phone);

    actions.appendChild(waBtn);
    actions.appendChild(callBtn);
    card.appendChild(actions);

    body.appendChild(card);

    // CTA pentru lead
    typeThenSay(c.cta, function () {
      renderLeadFormInline("contact");
    });
    scrollBodyToBottom();
  }

  function renderLeadFormInline(flowId) {
    state.currentFlow = flowId;
    state.flowData = { flow: flowId, startedAt: nowISO(), session: sessionId() };
    showLeadForm();
  }

  /* ----------------------- End menu ----------------------- */
  function renderEndMenu() {
    var menu = el("div", { class: "mmg-choice-row" });
    var restart = el("button", { class: "mmg-choice-btn", text: "↺ Solicitare nouă" });
    restart.addEventListener("click", function () { resetConversation(); });
    menu.appendChild(restart);
    body.appendChild(menu);
    scrollBodyToBottom();
  }

  /* ----------------------- Reset / greeting ----------------------- */
  function resetConversation() {
    state.currentFlow = null;
    state.currentStepIndex = 0;
    state.flowData = {};
    state.inLeadForm = false;
    body.innerHTML = "";
    greet();
  }

  function greet() {
    if (!knowledge) return;
    if (!state.greeted) {
      state.greeted = true;
      saveState();
    }
    typeThenSay(knowledge.agent.greeting, function () {
      removeQuickActions();
      renderQuickActions();
    });
  }

  /* ----------------------- Type animation ----------------------- */
  function typeThenSay(text, cb) {
    var typing = showTyping();
    var delay = 700 + Math.min(1200, text.length * 8);
    setTimeout(function () {
      typing.remove();
      addBotMessage(text);
      if (cb) cb();
    }, delay);
  }

  /* ----------------------- Free text input ----------------------- */
  function handleFreeText(text) {
    if (!text || !text.trim()) return;
    addUserMessage(text.trim());

    // Dacă suntem în mijlocul unui flux, ignorăm text liber (clientul folosește butoanele)
    if (state.currentFlow && !state.inLeadForm) {
      typeThenSay("Vă rog să alegeți una dintre opțiunile de mai jos pentru a continua. Dacă doriți să schimbați subiectul, apăsați „Solicitare nouă”.", function () {
        // re-afișează ultimul pas dacă există
        if (currentStep()) {
          renderChoices(currentStep());
        }
      });
      return;
    }

    // Căutare fallback
    var answer = findFallbackAnswer(text);
    if (answer) {
      typeThenSay(answer, function () {
        renderEndMenu();
      });
    } else {
      typeThenSay(knowledge.no_match_response, function () {
        renderQuickActions();
      });
    }
  }

  /* ----------------------- Build UI ----------------------- */
  function detectMobile() {
    // Detectare robustă: viewport mic OR user agent mobil OR touch screen
    var vw = window.innerWidth || document.documentElement.clientWidth || 1024;
    var ua = (navigator.userAgent || "").toLowerCase();
    var uaMobile = /android|iphone|ipad|ipod|blackberry|opera mini|iemobile|windows phone|mobile/.test(ua);
    var hasTouch = (navigator.maxTouchPoints || 0) > 0;
    // Telefoanele fără viewport meta raportează vw mare (ex: 980px) — dacă UA e mobil, considerăm mobil
    return vw <= 600 || (uaMobile && (vw <= 1024 || hasTouch)) || (hasTouch && vw <= 900);
  }

  function detectTablet() {
    // Tabletă: viewport între 601px și 1024px, sau UA conține iPad/Android tablet
    var vw = window.innerWidth || document.documentElement.clientWidth || 1024;
    var ua = (navigator.userAgent || "").toLowerCase();
    var uaTablet = /ipad|android(?!.*mobile)|tablet|kindle|silk|playbook/.test(ua);
    if (detectMobile()) return false; // mobil are prioritate
    return (vw > 600 && vw <= 1024) || uaTablet;
  }

  function applyMobileClass() {
    if (!widgetRoot) return;
    if (detectMobile()) {
      widgetRoot.classList.add("is-mobile");
      widgetRoot.classList.remove("is-tablet");
    } else if (detectTablet()) {
      widgetRoot.classList.add("is-tablet");
      widgetRoot.classList.remove("is-mobile");
    } else {
      widgetRoot.classList.remove("is-mobile");
      widgetRoot.classList.remove("is-tablet");
    }
  }

  function buildWidget() {
    widgetRoot = el("div", { class: "mmg-widget" });

    // Override FAB bottom offset dacă embed.min.js l-a setat (data-mmg-fab-bottom)
    if (typeof global.__MMG_FAB_BOTTOM__ === "number") {
      try {
        document.documentElement.style.setProperty("--mmg-fab-bottom", global.__MMG_FAB_BOTTOM__ + "px");
      } catch (e) {}
    }

    // Detectare dinamică a butonului WhatsApp pentru a evita suprapunerea.
    // Caută butonul WhatsApp real pe pagină și setează FAB bottom = WA top + 50px spațiu liber.
    // Dacă nu găsește WA, păstrează valorile default din CSS (150px pe toate breakpoint-urile).
    function adjustFabAboveWhatsApp() {
      try {
        var candidates = document.querySelectorAll('a, button, div, img');
        var waEl = null;
        var waTopFromBottom = -1;
        var viewportH = window.innerHeight || document.documentElement.clientHeight;
        for (var i = 0; i < candidates.length; i++) {
          var elc = candidates[i];
          // Sărim peste elementele widget-ului nostru
          if (elc.closest && elc.closest('.mmg-widget')) continue;
          if (elc.offsetParent === null && elc.style.position !== 'fixed') continue;
          var href = (elc.getAttribute && (elc.getAttribute('href') || '')) || '';
          var cls = (typeof elc.className === 'string' ? elc.className : '');
          var title = (elc.getAttribute && (elc.getAttribute('title') || elc.getAttribute('aria-label') || '')) || '';
          var src = (elc.getAttribute && (elc.getAttribute('src') || '')) || '';
          var blob = (href + ' ' + cls + ' ' + title + ' ' + src).toLowerCase();
          if (/wa\.me|whatsapp|wa-btn|wa_button|whatsapp-button|float.*wa|floating.*wa/.test(blob)) {
            var r = elc.getBoundingClientRect();
            // Trebuie să fie vizibil și să aibă dimensiuni reale
            if (r.width < 30 || r.height < 30) continue;
            // Trebuie să fie în partea de jos a viewport-ului (bottom 0-300px)
            var distanceFromBottom = viewportH - r.bottom;
            if (distanceFromBottom < 0 || distanceFromBottom > 400) continue;
            // Trebuie să fie în partea dreapta (right 0-200px)
            var distanceFromRight = (window.innerWidth || document.documentElement.clientWidth) - r.right;
            if (distanceFromRight < 0 || distanceFromRight > 300) continue;
            // Luăm elementul cu top edge cel mai jos (cel mai aproape de marginea de jos)
            var topFromBottom = viewportH - r.top;
            if (topFromBottom > waTopFromBottom) {
              waTopFromBottom = topFromBottom;
              waEl = elc;
            }
          }
        }
        if (waEl && waTopFromBottom > 0) {
          // FAB bottom = WA top + 80px spațiu liber (cerință minim 40-50px, cu margine de siguranță)
          var newBottom = waTopFromBottom + 80;
          // Limită superioară: nu muta FAB-ul prea sus (max 380px pe desktop, 320px pe mobil)
          var maxBottom = (viewportH < 600) ? 320 : 380;
          if (newBottom > maxBottom) newBottom = maxBottom;
          // Limită inferioară: minim 150px (dacă WA e mai sus de atât, păstrăm 150)
          if (newBottom < 150) newBottom = 150;
          document.documentElement.style.setProperty("--mmg-fab-bottom", newBottom + "px");
          document.documentElement.style.setProperty("--mmg-fab-bottom-tablet", newBottom + "px");
          document.documentElement.style.setProperty("--mmg-fab-bottom-mobile", newBottom + "px");
        }
      } catch (e) {}
    }
    // Rulează imediat, după 1s (pentru WA încărcat asincron), și pe resize
    setTimeout(adjustFabAboveWhatsApp, 100);
    setTimeout(adjustFabAboveWhatsApp, 1000);
    setTimeout(adjustFabAboveWhatsApp, 3000);
    window.addEventListener("resize", function() {
      clearTimeout(window.__mmgWaResize);
      window.__mmgWaResize = setTimeout(adjustFabAboveWhatsApp, 250);
    });

    // FAB
    fab = el("button", {
      class: "mmg-fab",
      "aria-label": "Deschide MMG AI Assistant",
      title: "MMG AI Assistant — Asistent digital"
    });
    fab.innerHTML =
      '<span class="mmg-fab-pulse"></span>' +
      '<span class="mmg-fab-badge">1</span>' +
      '<span class="mmg-fab-sparkle">✨</span>' +
      '<img class="mmg-fab-avatar" src="' + AVATAR_URL + '" alt="MMG AI Assistant" loading="lazy" onerror="this.style.display=\'none\'"/>' +
      '<span class="mmg-fab-label">MMG AI<span class="mmg-fab-label-sub">Asistent digital</span></span>';
    fab.addEventListener("click", toggleChat);
    widgetRoot.appendChild(fab);

    // Chat window
    chat = el("div", { class: "mmg-chat", role: "dialog", "aria-modal": "false", "aria-label": "MMG AI Chat" });

    // Header
    var header = el("div", { class: "mmg-header" });
    var avatarWrap = el("div", { class: "mmg-avatar", html: avatarImgMarkup() });
    avatarWrap.appendChild(el("span", { class: "mmg-avatar-status" }));
    var headerInfo = el("div", { class: "mmg-header-info" });
    var name = el("div", { class: "mmg-header-name" }, [
      el("span", { text: "MMG AI Assistant" }),
      el("span", { class: "mmg-ai-badge", text: "AI" })
    ]);
    var role = el("div", { class: "mmg-header-role", text: "Asistent digital" });
    headerInfo.appendChild(name);
    headerInfo.appendChild(role);

    var actions = el("div", { class: "mmg-header-actions" });
    var restartBtn = el("button", {
      class: "mmg-header-btn",
      title: "Reîncepe conversația",
      "aria-label": "Reîncepe",
      html: ICONS.refresh
    });
    restartBtn.addEventListener("click", function () {
      if (confirm("Doriți să reîncepeți conversația? Informațiile curente vor fi șterse.")) {
        resetConversation();
      }
    });
    var closeBtn = el("button", {
      class: "mmg-header-btn",
      title: "Închide",
      "aria-label": "Închide",
      html: ICONS.close
    });
    closeBtn.addEventListener("click", closeChat);
    actions.appendChild(restartBtn);
    actions.appendChild(closeBtn);

    header.appendChild(avatarWrap);
    header.appendChild(headerInfo);
    header.appendChild(actions);
    chat.appendChild(header);

    // Body
    body = el("div", { class: "mmg-body" });
    chat.appendChild(body);

    // Footer
    var footer = el("div", { class: "mmg-footer" });
    var inputRow = el("div", { class: "mmg-input-row" });
    input = el("input", { type: "text", placeholder: "Scrieți întrebarea dvs...", "aria-label": "Mesaj" });
    sendBtn = el("button", { class: "mmg-send-btn", "aria-label": "Trimite", html: ICONS.send });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); doSend(); }
    });
    sendBtn.addEventListener("click", doSend);
    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    footer.appendChild(inputRow);

    var menuWrap = el("div", { class: "mmg-footer-menu" });
    menuBtn = el("button", { class: "mmg-menu-btn", text: "↺ Meniu principal" });
    menuBtn.addEventListener("click", function () {
      resetConversation();
    });
    menuWrap.appendChild(menuBtn);
    footer.appendChild(menuWrap);

    chat.appendChild(footer);

    // Disclaimer
    var disclaimer = el("div", { class: "mmg-disclaimer", text: knowledge ? knowledge.disclaimer : "" });
    chat.appendChild(disclaimer);

    widgetRoot.appendChild(chat);
    document.body.appendChild(widgetRoot);

    // Aplică clasa de mobil după build
    applyMobileClass();

    // Re-aplică la resize (pentru orientare, desktop → mobil etc.)
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyMobileClass, 150);
    });
  }

  function doSend() {
    var text = input.value;
    if (!text || !text.trim()) return;
    input.value = "";
    handleFreeText(text);
  }

  /* ----------------------- Open / close ----------------------- */
  function openChat() {
    if (!knowledge) return;
    state.isOpen = true;
    chat.classList.add("is-open");
    fab.classList.add("is-open");
    fab.querySelector(".mmg-fab-label").innerHTML = "Închide";
    fab.querySelector(".mmg-fab-badge").classList.remove("is-visible");

    // Afișează greeting doar dacă body-ul e gol (prima deschidere per session)
    if (body.children.length === 0) {
      setTimeout(greet, 250);
    }
    setTimeout(scrollBodyToBottom, 300);

    // Analytics: deschidere chat
    track("open", { session: sessionId(), url: window.location.href });
  }

  function closeChat() {
    state.isOpen = false;
    chat.classList.remove("is-open");
    fab.classList.remove("is-open");
    fab.querySelector(".mmg-fab-label").innerHTML = "MMG AI<span class=\"mmg-fab-label-sub\">Asistent digital</span>";
    // Analytics: închidere chat
    track("close", { session: sessionId() });
  }

  function toggleChat() {
    if (state.isOpen) closeChat();
    else openChat();
  }

  /* ----------------------- Init ----------------------- */
  function init() {
    // Prevenim dublă inițializare
    if (global.__MMG_AI_INITIALIZED__) return;
    global.__MMG_AI_INITIALIZED__ = true;

    // Restore persisted flags
    var persisted = loadState();
    if (persisted) {
      state.greeted = persisted.greeted || false;
      state.leadSubmitted = persisted.leadSubmitted || false;
      // Nu restaurăm history în UI pentru a nu deranja; dar îl păstrăm pentru analytics
    }

    loadKnowledge(function (data) {
      if (!data) {
        console.warn("[MMG AI] Nu am putut încărca mmg-knowledge.json");
        return;
      }
      buildWidget();

      // Dacă utilizatorul a mai conversat în trecut, afișăm un mic badge
      if (!state.greeted && MMG_CONFIG.pulseFirstTime) {
        //_pulse este deja activ prin CSS; afișăm badge cu 1
        var badge = fab.querySelector(".mmg-fab-badge");
        if (badge) badge.classList.add("is-visible");
      }

      // Auto-open (opțional)
      if (MMG_CONFIG.autoOpenDelay > 0) {
        setTimeout(openChat, MMG_CONFIG.autoOpenDelay);
      }

      // Analytics: widget ready (singură dată per pagină)
      track("ready", {
        version: (knowledge && knowledge.version) || "unknown",
        session: sessionId(),
        url: window.location.href,
        base: global.__MMG_BASE__ || ""
      });
    });
  }

  /* ----------------------- Public API ----------------------- */
  global.MMGAI = {
    init: init,
    open: function () { if (knowledge) openChat(); },
    close: closeChat,
    toggle: toggleChat,
    reset: resetConversation,
    getKnowledge: function () { return knowledge; },
    getHistory: function () { return state.history; },
    getLeads: function () {
      try { return JSON.parse(localStorage.getItem("mmg_leads_v1") || "[]"); }
      catch (e) { return []; }
    },
    configure: function (opts) {
      for (var k in opts) {
        if (opts.hasOwnProperty(k)) MMG_CONFIG[k] = opts[k];
      }
    }
  };

  /* ----------------------- Auto-init ----------------------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(typeof window !== "undefined" ? window : this);
