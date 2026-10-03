/* Jour J — révision des questions de l'examen pratique du permis B.
   Tout est stocké sur le téléphone (localStorage). Aucune donnée n'est envoyée. */
(function () {
  'use strict';

  // ---------- Réglages ----------
  const STORE_KEY = 'jourj.v1';
  const INTERVALS = [0, 1, 2, 4, 8, 15];   // jours d'attente par boîte de Leitner (boîte 0 = jamais vue)
  const SESSION_MAX = 12;                  // questions max par séance (~5 min)
  const NEW_MIN = 6;                       // nouvelles questions par jour au minimum
  const CAT = {
    VI: 'Vérification intérieure', VE: 'Vérification extérieure',
    SR: 'Sécurité routière', PS: 'Premiers secours'
  };
  const NO_ANSWER = "Pas de réponse écrite dans la banque officielle : réalise l'action ou montre l'élément demandé.";

  // ---------- Icônes ----------
  const I = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
    phones: '<svg viewBox="0 0 24 24" fill="none" stroke="#1F4FD1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M9 18l6-6-6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M20 6L9 17l-5-5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><path d="M5 19V5"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><path d="M19 5v14"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/><circle cx="8.5" cy="15.5" r="1"/></svg>'
  };

  // ---------- Outils ----------
  const $app = document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[?.!\s]+/g, ' ').trim();
  const today = () => { const d = new Date(); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
  const dayOf = (iso) => { if (!iso) return null; const [y, m, d] = iso.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pad2 = (n) => String(n).padStart(2, '0');

  // ---------- Stockage ----------
  function load() {
    try { const s = JSON.parse(localStorage.getItem(STORE_KEY)); if (s && s.cards) return s; } catch (e) { /* stockage indisponible */ }
    return { onboarded: false, examDate: '', mode: 'audio', pause: 5, cards: {}, history: [] };
  }
  let S = load();
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

  // ---------- Données ----------
  let FICHES = [];      // 100 fiches, index 1..100 (00 = 100)
  let CARDS = [];       // questions uniques à réviser
  let BY_ID = {};
  let FICHE_CARDS = {}; // numéro -> {v, sr, ps} ids
  let NEUTRAL = [];     // parties neutralisées (pour affichage)

  function build(data) {
    FICHES = data.questions;
    const seen = new Map();
    const add = (key, mk, num) => {
      if (seen.has(key)) { const c = seen.get(key); c.fiches.push(num); return c.id; }
      const c = mk(); c.fiches = [num]; seen.set(key, c); CARDS.push(c); return c.id;
    };
    FICHES.forEach((f) => {
      const num = f.numero, ids = {};
      const vcat = /intérieure/i.test(f.type) ? 'VI' : 'VE';
      if (!f.neutralise_v) ids.v = add('V|' + norm(f.verif_question), () => ({ id: 'V' + num, cat: vcat, q: f.verif_question, a: f.verif_reponse || NO_ANSWER }), num);
      else NEUTRAL.push({ num, cat: vcat, q: f.verif_question });
      if (!f.neutralise_sr) ids.sr = add('SR|' + norm(f.verif_question) + '|' + norm(f.qser_question), () => ({ id: 'SR' + num, cat: 'SR', ctx: f.verif_question, q: f.qser_question, a: f.qser_reponse }), num);
      else NEUTRAL.push({ num, cat: 'SR', q: f.qser_question });
      if (!f.neutralise_ps) ids.ps = add('PS|' + norm(f.ps_question), () => ({ id: 'PS' + num, cat: 'PS', q: f.ps_question, a: f.ps_reponse }), num);
      else NEUTRAL.push({ num, cat: 'PS', q: f.ps_question });
      FICHE_CARDS[num] = ids;
    });
    CARDS.forEach((c) => { BY_ID[c.id] = c; });
  }

  // ---------- Révision espacée (boîtes de Leitner) ----------
  const st = (id) => S.cards[id] || { box: 0 };
  function daysLeft() { const e = dayOf(S.examDate); return e == null ? null : e - today(); }
  function rate(id, r) {
    const s = Object.assign({ box: 0, lapses: 0 }, S.cards[id]);
    if (r === 'rate') { s.box = 1; s.lapses = (s.lapses || 0) + 1; }
    else if (r === 'hes') { s.box = Math.max(1, s.box); }
    else { s.box = Math.min(5, s.box + 1); }
    let interval = Math.max(1, INTERVALS[s.box]);
    const left = daysLeft();
    if (left != null && left > 0) interval = Math.min(interval, Math.max(1, Math.ceil(left / 2)));
    s.due = today() + interval; s.last = r; s.seen = true;
    S.cards[id] = s; save();
  }
  function status(id) {
    const s = S.cards[id];
    if (!s || !s.seen) return 'n';
    if (s.last === 'rate') return 'r';
    if (s.box >= 4) return 'm';
    return 'c';
  }
  const STATUS_LABEL = { m: 'Maîtrisée', c: 'En cours', r: 'À revoir', n: 'Nouvelle' };
  const RANK = { VI: 0, VE: 0, SR: 1, PS: 2 };
  const ficheOrder = (c) => (c.fiches[0] === '00' ? 100 : parseInt(c.fiches[0], 10)) * 3 + RANK[c.cat];
  function dueCards() {
    const t = today();
    // à date égale, on garde l'ordre des fiches : vérification → sécurité routière → premiers secours
    return CARDS.filter((c) => { const s = S.cards[c.id]; return s && s.seen && s.due <= t; })
      .sort((a, b) => (S.cards[a.id].due - S.cards[b.id].due) || (ficheOrder(a) - ficheOrder(b)));
  }
  function newQuota() {
    const unseen = CARDS.filter((c) => !(S.cards[c.id] && S.cards[c.id].seen)).length;
    if (!unseen) return 0;
    const left = daysLeft();
    const perDay = left != null && left > 1 ? Math.ceil(unseen / Math.max(1, left - 1)) : NEW_MIN;
    return Math.min(unseen, Math.max(NEW_MIN, perDay));
  }
  function buildSession() {
    const due = dueCards();
    const maxTotal = Math.max(SESSION_MAX, Math.min(20, newQuota() + 4));
    const q = due.slice(0, maxTotal);
    const room = Math.max(0, maxTotal - q.length);
    const nNew = Math.min(room, newQuota());
    // nouvelles questions présentées par fiche entière : V → SR → PS (lot de trois)
    const pick = [], taken = new Set();
    for (const f of FICHES) {
      if (pick.length >= nNew) break;
      const ids = FICHE_CARDS[f.numero];
      const group = ['v', 'sr', 'ps'].map((k) => ids[k]).filter((id) => id && !taken.has(id) && !(S.cards[id] && S.cards[id].seen));
      group.forEach((id) => { taken.add(id); pick.push(BY_ID[id]); });
    }
    return q.concat(pick).map((c) => ({ id: c.id, requeued: false }));
  }
  function mastery() {
    let m = 0, c = 0;
    CARDS.forEach((x) => { const s = status(x.id); if (s === 'm') m++; else if (s !== 'n') c++; });
    return { m, c, n: CARDS.length - m - c, total: CARDS.length };
  }

  // ---------- Voix (synthèse vocale du téléphone) ----------
  const TTS = 'speechSynthesis' in window;
  let voice = null;
  function pickVoice() { if (!TTS) return; const v = speechSynthesis.getVoices(); voice = v.find((x) => /^fr(-|_)FR/i.test(x.lang)) || v.find((x) => /^fr/i.test(x.lang)) || null; }
  if (TTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  const spoken = (t) => String(t).replace(/\n- /g, '. ').replace(/^- /, '').replace(/1ers? secours/gi, 'premiers secours');
  // Chaque lecture a un numéro : les fins de lecture d'une ancienne phrase sont ignorées.
  // Sur certains Android, la fin de lecture est signalée trop tôt : on attend donc que la voix
  // ait réellement fini (speaking = false) ET une durée minimale selon la longueur du texte.
  let sayToken = 0, lastCancel = 0;
  function say(text, onend) {
    const token = ++sayToken;
    if (!TTS) { if (onend) setTimeout(() => { if (token === sayToken) onend(); }, 300); return; }
    const txt = spoken(text);
    if (speechSynthesis.speaking || speechSynthesis.pending) { lastCancel = Date.now(); speechSynthesis.cancel(); }
    // Android : après un arrêt, il faut laisser un court délai avant de relancer la voix,
    // sinon la nouvelle phrase est mal suivie (fin annoncée trop tôt).
    const delay = Math.max(0, 400 - (Date.now() - lastCancel));
    const start = () => {
      if (token !== sayToken) return;
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'fr-FR'; if (voice) u.voice = voice; u.rate = 1;
      window.__jourjUtterance = u; // évite que le navigateur supprime la phrase en cours de lecture
      const t0 = Date.now(), minDur = txt.length * 55, maxDur = Math.max(30000, txt.length * 200);
      let done = false;
      const finish = () => {
        if (done || token !== sayToken) return;
        const check = () => {
          if (done || token !== sayToken) return;
          const el = Date.now() - t0;
          if (el < maxDur && (speechSynthesis.speaking || speechSynthesis.pending || el < minDur)) { setTimeout(check, 200); return; }
          done = true; if (onend) onend();
        };
        check();
      };
      u.onend = finish; u.onerror = finish;
      speechSynthesis.speak(u);
    };
    if (delay) setTimeout(start, delay); else start();
  }
  function hush() { sayToken++; if (TTS) { lastCancel = Date.now(); speechSynthesis.cancel(); } }

  // ---------- Navigation ----------
  let view = null;               // état de l'écran courant
  let session = null, sessionStats = null;
  let exam = null, listen = null;
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  window.addEventListener('hashchange', route);
  function route() {
    hush(); stopListen(); stopRec();
    document.body.classList.remove('is-dark');
    const h = location.hash.replace('#', '') || 'home';
    if (!S.onboarded && h !== 'onboarding') return go('#onboarding');
    ({ onboarding: vOnboarding, home: vHome, session: vSession, bilan: vBilan, exam: vExam, biblio: vBiblio, ecoute: vEcoute, settings: vSettings }[h] || vHome)();
    window.scrollTo(0, 0);
  }
  function render(html) { if (location.hash !== '#ecoute') $app.classList.remove('dark'); $app.innerHTML = html; }
  const header = (title, sub, backTo) => `<div class="row"><a class="icon-btn" href="${backTo || '#home'}" aria-label="Retour">${I.back}</a><div><h1 style="font-size:24px;font-weight:800">${esc(title)}</h1>${sub ? `<div class="small muted">${esc(sub)}</div>` : ''}</div></div>`;

  // ---------- Écran : premier lancement ----------
  function vOnboarding() {
    let mode = S.mode || 'audio';
    render(`
      <div class="stack" style="gap:10px"><div class="brand">Jour J</div>
      <h1 style="font-size:30px;line-height:1.12">Prépare les questions de ton examen pratique, 5 minutes par jour.</h1></div>
      <div class="field"><label for="d">Quand passes-tu ton examen ?</label>
        <input id="d" class="input" type="date" value="${esc(S.examDate)}">
        <div class="check"><input id="nf" type="checkbox" ${S.examDate ? '' : 'checked'}><label for="nf" style="font-weight:400">Pas encore fixée</label></div></div>
      <div class="field"><span class="legend-t">Comment préfères-tu réviser ?</span>
        <div class="options">
          <button class="option" data-m="audio" aria-pressed="${mode === 'audio'}"><b>Audio</b><small>Les questions sont lues à voix haute</small></button>
          <button class="option" data-m="lecture" aria-pressed="${mode === 'lecture'}"><b>Lecture</b><small>En silence, texte seul</small></button>
        </div></div>
      <div class="spacer stack">
        <p class="footer" style="margin:0">Aucun compte à créer. Ta progression reste sur ton téléphone.</p>
        <button class="btn btn-primary" id="go">C'est parti</button>
      </div>`);
    const d = $app.querySelector('#d'), nf = $app.querySelector('#nf');
    d.addEventListener('input', () => { if (d.value) nf.checked = false; });
    nf.addEventListener('change', () => { if (nf.checked) d.value = ''; });
    $app.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.m; $app.querySelectorAll('[data-m]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.m === mode));
    }));
    $app.querySelector('#go').addEventListener('click', () => {
      S.examDate = nf.checked ? '' : d.value; S.mode = mode; S.onboarded = true; save(); go('#home');
    });
  }

  // ---------- Écran : accueil ----------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

  function vHome() {
    const left = daysLeft();
    const due = dueCards().length, nq = newQuota();
    const total = Math.min(Math.max(SESSION_MAX, Math.min(20, nq + 4)), due + nq);
    const ms = mastery(), pm = Math.round(ms.m / ms.total * 100), pc = Math.round(ms.c / ms.total * 100);
    const doneToday = S.history.some((h) => h.day === today());
    let when = '<div class="countdown" style="font-size:34px">Date d\'examen à fixer</div>';
    if (left != null) when = left > 0 ? `<div class="small muted" style="font-size:15px">Ton examen pratique dans</div><div class="countdown">${left} jour${left > 1 ? 's' : ''}</div>`
      : left === 0 ? '<div class="countdown">C\'est le jour J</div>' : '<div class="countdown" style="font-size:34px">Examen passé</div>';
    const install = standalone() ? '' : `<div class="banner"><b>Installe l'appli sur ton écran d'accueil</b> pour ne pas perdre ta progression.
      ${deferredPrompt ? '<button class="btn btn-light" id="inst" style="margin-top:10px;min-height:44px">Installer</button>' : isIOS() ? '<br>Safari : bouton Partager, puis « Sur l\'écran d\'accueil ».' : '<br>Menu du navigateur (⋮), puis « Installer l\'application » (ou « Ajouter à l\'écran d\'accueil » selon le navigateur).'}</div>`;
    render(`
      <div class="row between"><div class="brand">Jour J</div><a class="icon-btn" href="#settings" aria-label="Réglages">${I.gear}</a></div>
      <div>${when}</div>
      <div class="hero">
        <div class="row between"><h2 style="font-size:24px">Séance du jour</h2><b style="font-size:15px">≈ 5 min</b></div>
        <div style="line-height:1.4">${total ? `${total} question${total > 1 ? 's' : ''}${due ? ` dont ${due} à revoir` : ''}.` : 'Tout est à jour. Reviens demain !'}${doneToday && total ? ' Tu peux refaire une séance.' : ''}</div>
        <button class="btn" id="start" ${total ? '' : 'disabled'}>${I.play} Commencer</button>
      </div>
      <div class="card stack">
        <div class="row between"><b>Ta maîtrise</b><span class="display" style="font-size:22px;font-weight:800">${pm} %</span></div>
        <div class="bar" role="img" aria-label="${ms.m} maîtrisées, ${ms.c} en cours, ${ms.n} nouvelles"><div class="m" style="width:${pm}%"></div><div class="c" style="width:${pc}%"></div></div>
        <div class="legend"><span><i class="dot" style="background:var(--ink)"></i>${ms.m} maîtrisées</span><span><i class="dot" style="background:var(--blue-m)"></i>${ms.c} en cours</span><span><i class="dot" style="background:var(--soft);border:1px solid #C9C2B3"></i>${ms.n} nouvelles</span></div>
      </div>
      <div class="tiles">
        <a class="tile" href="#exam">${I.clock}<div><b>Examen blanc</b><div class="small muted">Tirage au compteur</div></div></a>
        <a class="tile" href="#ecoute">${I.phones}<div><b>Écoute continue</b><div class="small muted">Avec écouteurs</div></div></a>
      </div>
      <a class="btn btn-light" href="#biblio" style="justify-content:space-between">Toutes les questions ${I.chev}</a>
      ${install}
      <p class="footer">${CARDS.length} questions uniques issues des 100 fiches officielles · <a href="mentions-legales.html">Mentions légales</a></p>`);
    $app.querySelector('#start').addEventListener('click', () => { session = { queue: buildSession(), i: 0, revealed: false }; sessionStats = { su: 0, hes: 0, rate: 0, cats: {} }; go('#session'); });
    const inst = $app.querySelector('#inst');
    if (inst) inst.addEventListener('click', async () => { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; vHome(); });
  }

  // ---------- Écran : séance ----------
  function cardBlock(c) {
    return `<span class="chip chip-${c.cat}">${CAT[c.cat]}</span>
      ${c.ctx ? `<div class="context">Après la vérification : ${esc(c.ctx)}</div>` : ''}
      <div class="question">${esc(c.q)}</div>`;
  }
  function vSession() {
    if (!session || !session.queue.length) return go('#home');
    if (session.i >= session.queue.length) return go('#bilan');
    const item = session.queue[session.i], c = BY_ID[item.id];
    const pct = Math.round(session.i / session.queue.length * 100);
    const nb = Math.max(1, INTERVALS[Math.min(5, st(c.id).box + 1)]);
    const top = `<div class="row"><a class="icon-btn" href="#home" aria-label="Quitter la séance">${I.close}</a><div class="progress"><div style="width:${pct}%"></div></div><b style="font-size:15px">${session.i + 1} / ${session.queue.length}</b></div>`;
    if (!session.revealed) {
      render(`${top}<div class="stack" style="gap:16px"><div class="small muted" style="font-weight:700">Fiche n° ${c.fiches[0]}</div>${cardBlock(c)}</div>
        <button class="listen" id="lq"><span class="round" style="color:#fff">${I.speaker}</span>Écouter la question</button>
        <div class="hint"><span style="color:var(--orange)">${I.mic.replace('<svg', '<svg width="24" height="24"')}</span><span>Réponds à voix haute, comme devant l'inspecteur. Puis vérifie.</span></div>
        <button class="btn btn-dark spacer" id="rev">Voir la réponse</button>`);
      const speakQ = () => say(c.q);
      $app.querySelector('#lq').addEventListener('click', speakQ);
      $app.querySelector('#rev').addEventListener('click', () => { session.revealed = true; vSession(); });
      if (S.mode === 'audio') speakQ();
    } else {
      render(`${top}<div class="context" style="font-size:15px">${esc(c.q)}</div>
        <div class="answer"><div class="row between"><span class="label">Réponse officielle</span><button class="icon-btn" id="la" aria-label="Écouter la réponse">${I.speaker}</button></div>
        <div class="text">${esc(c.a)}</div></div>
        <div class="small muted">Fiche${c.fiches.length > 1 ? 's' : ''} n° ${c.fiches.join(', ')}</div>
        <div class="spacer stack"><b style="text-align:center">Tu savais ?</b>
        <div class="rate">
          <button class="r-rate" data-r="rate"><b>Raté</b><span>revient demain</span></button>
          <button class="r-hes" data-r="hes"><b>Hésité</b><span>à revoir</span></button>
          <button class="r-su" data-r="su"><b>Su</b><span>dans ${nb} j</span></button>
        </div></div>`);
      $app.querySelector('#la').addEventListener('click', () => say(c.a));
      if (S.mode === 'audio') say(c.a);
      $app.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
        const r = b.dataset.r;
        if (!item.requeued) { // seule la 1re réponse compte pour la boîte
          rate(c.id, r); sessionStats[r]++;
          if (r === 'rate') sessionStats.cats[c.cat] = (sessionStats.cats[c.cat] || 0) + 1;
        }
        if (r === 'rate' && !item.requeued) session.queue.push({ id: c.id, requeued: true }); // l'erreur revient en fin de séance
        session.i++; session.revealed = false; vSession();
      }));
    }
  }

  // ---------- Écran : fin de séance ----------
  function vBilan() {
    if (!sessionStats) return go('#home');
    if (!sessionStats.saved) { S.history.push({ day: today(), su: sessionStats.su, hes: sessionStats.hes, rate: sessionStats.rate }); S.history = S.history.slice(-60); save(); sessionStats.saved = true; }
    const weak = Object.entries(sessionStats.cats).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const tomorrow = CARDS.filter((c) => { const s = S.cards[c.id]; return s && s.seen && s.due <= today() + 1; }).length;
    render(`
      <div class="stack" style="margin-top:24px"><div style="width:56px;height:56px;border-radius:28px;background:var(--blue);display:flex;align-items:center;justify-content:center">${I.check}</div>
      <h1 style="font-size:36px;font-weight:800">Séance terminée</h1></div>
      <div class="stats"><div class="stat stat-su"><div class="n">${sessionStats.su}</div><div class="l">Su</div></div>
        <div class="stat stat-hes"><div class="n">${sessionStats.hes}</div><div class="l">Hésité</div></div>
        <div class="stat stat-rate"><div class="n">${sessionStats.rate}</div><div class="l">Raté</div></div></div>
      ${weak.length ? `<div class="card stack"><b>Tes points faibles</b>${weak.map(([k, n]) => `<div class="row between"><span>${CAT[k]}</span><span class="small" style="color:var(--orange-d);font-weight:700">${n} ratée${n > 1 ? 's' : ''}</span></div>`).join('<hr>')}</div>` : '<div class="card">Aucune erreur aujourd\'hui. Bien joué.</div>'}
      <div class="row">${I.clock.replace('#C2410C', 'currentColor')}<span>Prochaine séance demain · environ ${tomorrow + Math.min(newQuota(), SESSION_MAX)} questions</span></div>
      <a class="btn btn-dark spacer" href="#home">Retour à l'accueil</a>`);
  }

  // ---------- Examen blanc : tirage au compteur ----------
  const fiche = (n) => FICHES[(n === 0 ? 100 : n) - 1];
  const wrap = (n) => ((n - 1 + 100) % 100) + 1; // 1..100
  function resolveDraw(n) {
    n = n === 0 ? 100 : n;
    // Vérification + sécurité routière : fiche précédente de même parité si neutralisée (convention)
    let v = n, guard = 0, notes = [];
    while ((fiche(v).neutralise_v || fiche(v).neutralise_sr) && guard++ < 50) v = wrap(v - 2);
    if (v !== n) notes.push({ part: 'v', txt: `Fiche ${pad2(n % 100)} neutralisée → fiche ${pad2(v % 100)}` });
    // Premiers secours : fiche suivante si neutralisée (mention officielle)
    let p = n; guard = 0;
    while (fiche(p).neutralise_ps && guard++ < 50) p = wrap(p + 1);
    if (p !== n) notes.push({ part: 'ps', txt: `Premiers secours n° ${pad2(n % 100)} neutralisé → n° ${pad2(p % 100)}` });
    const fv = fiche(v), fp = fiche(p);
    return {
      n, parts: [
        { key: 'v', label: fv.type, q: fv.verif_question, a: fv.verif_reponse || NO_ANSWER, card: FICHE_CARDS[fv.numero].v, note: (notes.find((x) => x.part === 'v') || {}).txt },
        { key: 'sr', label: 'Sécurité routière', q: fv.qser_question, a: fv.qser_reponse, card: FICHE_CARDS[fv.numero].sr, ctx: fv.verif_question },
        { key: 'ps', label: 'Premiers secours', q: fp.ps_question, a: fp.ps_reponse, card: FICHE_CARDS[fp.numero].ps, note: (notes.find((x) => x.part === 'ps') || {}).txt }
      ]
    };
  }
  function vExam() {
    if (!exam || exam.done) exam = { stage: 'draw', digits: pad2(Math.floor(Math.random() * 100)), step: 0, revealed: false, score: [] };
    if (exam.stage === 'draw') return vExamDraw();
    return vExamRun();
  }
  function vExamDraw() {
    const d = exam.digits, r = resolveDraw(parseInt(d, 10));
    const rest = String(Math.floor(Math.random() * 9000) + 1000);
    render(`${header('Examen blanc', 'Étape 1 · Tirage au compteur')}
      <div class="muted" style="line-height:1.45;color:var(--ink2)">Le jour J, l'inspecteur choisit tes questions avec les 2 derniers chiffres du compteur kilométrique.</div>
      <div class="odo"><div class="digits" aria-hidden="true">${rest.split('').map((x) => `<div class="digit">${x}</div>`).join('')}<div class="digit on">${d[0]}</div><div class="digit on">${d[1]}</div><span class="small" style="color:#C9C5BC;padding-bottom:6px">km</span></div>
        <div class="grid2"><div class="field" style="gap:4px"><label for="dg">2 derniers chiffres</label><input id="dg" inputmode="numeric" maxlength="2" value="${d}"></div>
        <button class="btn btn-ghost" id="rnd" style="align-self:flex-end;min-height:48px;font-size:15px;color:#fff">${I.dice} Au hasard</button></div></div>
      <div class="list draw"><div class="part"><b class="small">Tirage n° ${d}</b></div>
        ${r.parts.map((p) => `<div class="part"><span class="k" style="color:${p.key === 'v' ? 'var(--blue-d)' : p.key === 'sr' ? 'var(--orange-d)' : 'var(--ink2)'}">${esc(p.label)}</span><span>${esc(p.q)}</span>${p.note ? `<span class="note">${esc(p.note)}</span>` : ''}</div>`).join('')}</div>
      <p class="small muted" style="margin:0;line-height:1.4">Partie neutralisée : premiers secours → fiche suivante (règle officielle). Vérification + sécurité routière → fiche précédente de même parité (convention de l'appli).</p>
      <button class="btn btn-primary spacer" id="go">Commencer l'examen</button>`);
    const inp = $app.querySelector('#dg');
    inp.addEventListener('change', () => { const v = inp.value.replace(/\D/g, '').slice(0, 2); if (v.length) { exam.digits = pad2(parseInt(v, 10)); vExamDraw(); } });
    $app.querySelector('#rnd').addEventListener('click', () => { exam.digits = pad2(Math.floor(Math.random() * 100)); vExamDraw(); });
    $app.querySelector('#go').addEventListener('click', () => { exam.draw = resolveDraw(parseInt(exam.digits, 10)); exam.stage = 'run'; exam.step = 0; exam.revealed = false; vExamRun(); });
  }
  // enregistrement vocal (facultatif)
  let rec = null, recChunks = [], recUrl = null;
  function stopRec() { if (rec && rec.state === 'recording') rec.stop(); }
  function vExamRun() {
    const parts = exam.draw.parts;
    if (exam.step >= 3) return vExamResult();
    const p = parts[exam.step];
    const steps = parts.map((x, i) => {
      const cls = i < exam.step ? '' : i === exam.step ? 'cur' : 'todo';
      const end = i < exam.step ? (exam.score[i] ? '<span class="small" style="font-weight:700;color:var(--blue-d)">1 pt</span>' : '<span class="small" style="font-weight:700;color:var(--orange-d)">0 pt</span>') : i === exam.step ? '<span class="small">En cours</span>' : '<span class="small">À venir</span>';
      return `<div class="step ${cls}"><span class="n">${i + 1}</span><span class="grow">${esc(x.label)}</span>${end}</div>`;
    }).join('');
    const canRec = !!(navigator.mediaDevices && window.MediaRecorder);
    render(`${header('Examen blanc', 'Tirage n° ' + exam.digits, '#home')}
      <div class="steps">${steps}</div>
      ${p.ctx ? `<div class="context">Après la vérification : ${esc(p.ctx)}</div>` : ''}
      <div class="question" style="font-size:24px">${esc(p.q)}</div>
      ${exam.revealed ? `<div class="answer"><span class="label">Réponse officielle</span><div class="text">${esc(p.a)}</div></div>
        ${recUrl ? `<audio controls src="${recUrl}" style="width:100%"></audio>` : ''}
        <div class="rate spacer" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button class="r-rate" data-s="0"><b>Point perdu</b></button><button class="r-su" data-s="1"><b>Point gagné</b></button></div>`
      : `${canRec ? `<div class="stack" style="align-items:center;gap:8px"><button class="rec" id="rec" aria-label="${rec && rec.state === 'recording' ? 'Arrêter' : 'Enregistrer ma réponse'}"><span class="${rec && rec.state === 'recording' ? 'sq' : 'ci'}"></span></button><span class="small muted" id="recl">${rec && rec.state === 'recording' ? 'Enregistrement…' : recUrl ? 'Réponse enregistrée' : 'Enregistre ta réponse (facultatif)'}</span></div>` : ''}
        <div class="spacer stack"><button class="btn btn-light" id="lq">${I.speaker} Écouter la question</button><button class="btn btn-dark" id="rev">Voir la réponse</button></div>`}`);
    if (!exam.revealed) {
      $app.querySelector('#lq').addEventListener('click', () => say(p.q));
      $app.querySelector('#rev').addEventListener('click', () => { stopRec(); exam.revealed = true; setTimeout(vExamRun, 150); });
      const rb = $app.querySelector('#rec');
      if (rb) rb.addEventListener('click', async () => {
        if (rec && rec.state === 'recording') { stopRec(); return; }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          recChunks = []; rec = new MediaRecorder(stream);
          rec.ondataavailable = (e) => recChunks.push(e.data);
          rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); if (recUrl) URL.revokeObjectURL(recUrl); recUrl = URL.createObjectURL(new Blob(recChunks, { type: rec.mimeType })); if (location.hash === '#exam') vExamRun(); };
          rec.start(); vExamRun();
        } catch (e) { const l = $app.querySelector('#recl'); if (l) l.textContent = 'Micro non autorisé.'; }
      });
      if (S.mode === 'audio') say(p.q);
    } else {
      $app.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
        const ok = b.dataset.s === '1'; exam.score[exam.step] = ok;
        if (p.card) rate(p.card, ok ? 'su' : 'rate');
        if (recUrl) { URL.revokeObjectURL(recUrl); recUrl = null; }
        exam.step++; exam.revealed = false; vExamRun();
      }));
    }
  }
  function vExamResult() {
    const pts = exam.score.filter(Boolean).length; exam.done = true;
    render(`${header('Examen blanc', 'Tirage n° ' + exam.digits)}
      <div class="stack" style="margin-top:12px"><div class="countdown">${pts} / 3</div><div class="muted">${pts === 3 ? 'Tous les points. Parfait.' : 'Les questions ratées reviennent dans tes prochaines séances.'}</div></div>
      <div class="list">${exam.draw.parts.map((p, i) => `<div class="item" style="cursor:default"><div class="grow"><div class="t">${esc(p.label)}</div><div class="s">${esc(p.q)}</div></div><span class="badge ${exam.score[i] ? 'b-m' : 'b-r'}">${exam.score[i] ? '1 pt' : '0 pt'}</span></div>`).join('')}</div>
      <div class="spacer stack"><a class="btn btn-primary" href="#exam" id="again">Nouveau tirage</a><a class="btn btn-light" href="#home">Accueil</a></div>`);
    $app.querySelector('#again').addEventListener('click', (e) => { e.preventDefault(); exam = null; vExam(); });
  }

  // ---------- Bibliothèque ----------
  let filter = 'all', search = '';
  function vBiblio() {
    const filters = [['all', 'Toutes'], ['VI', 'Intérieures'], ['VE', 'Extérieures'], ['SR', 'Sécurité routière'], ['PS', 'Premiers secours'], ['r', 'À revoir'], ['x', 'Neutralisées']];
    const q = norm(search);
    let rows = '';
    if (filter === 'x') {
      rows = NEUTRAL.map((n) => `<div class="item strike" style="cursor:default"><div class="grow"><div class="t">${esc(n.q)}</div><div class="s">${CAT[n.cat]} · fiche ${n.num}</div></div><span class="badge b-x">Neutralisée</span></div>`).join('');
    } else {
      const list = CARDS.filter((c) => (filter === 'all' || c.cat === filter || (filter === 'r' && status(c.id) === 'r')) && (!q || norm(c.q + ' ' + (c.ctx || '') + ' ' + c.a).includes(q)));
      rows = list.map((c) => { const s = status(c.id); return `<button class="item" data-id="${c.id}"><div class="grow"><div class="t">${esc(c.q)}</div><div class="s">${CAT[c.cat]}${c.ctx ? ' · ' + esc(c.ctx) : ''}</div></div><span class="badge b-${s}">${STATUS_LABEL[s]}</span></button>`; }).join('') || '<div class="item" style="cursor:default"><span class="muted">Aucune question.</span></div>';
    }
    render(`${header('Toutes les questions', CARDS.length + ' questions uniques')}
      <div><label for="se" class="sr-only">Rechercher une question</label><input id="se" class="input" type="search" placeholder="Rechercher (feux, pneus, alerter…)" value="${esc(search)}"></div>
      <div class="chips" role="group" aria-label="Filtrer">${filters.map(([k, l]) => `<button data-f="${k}" aria-pressed="${filter === k}">${l}</button>`).join('')}</div>
      <div class="list">${rows}</div>
      <dialog id="dlg"></dialog>`);
    const se = $app.querySelector('#se');
    se.addEventListener('input', () => { search = se.value; const pos = se.selectionStart; vBiblio(); const n = $app.querySelector('#se'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* */ } });
    $app.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; vBiblio(); }));
    $app.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => openCard(b.dataset.id)));
  }
  function openCard(id) {
    const c = BY_ID[id], dlg = $app.querySelector('#dlg');
    dlg.innerHTML = `<div class="sheet">${cardBlock(c)}
      <div class="answer"><div class="row between"><span class="label">Réponse officielle</span><button class="icon-btn" id="la" aria-label="Écouter">${I.speaker}</button></div><div class="text">${esc(c.a)}</div></div>
      <div class="small muted">Fiche${c.fiches.length > 1 ? 's' : ''} n° ${c.fiches.join(', ')} · ${STATUS_LABEL[status(id)]}</div>
      <button class="btn btn-dark" id="cl">Fermer</button></div>`;
    dlg.querySelector('#la').addEventListener('click', () => say(c.q + '. Réponse : ' + c.a));
    dlg.querySelector('#cl').addEventListener('click', () => { hush(); dlg.close(); });
    dlg.addEventListener('close', hush, { once: true });
    dlg.showModal();
  }

  // ---------- Écoute continue ----------
  // Lecture dans l'ordre des fiches (01 → 00) : vérification, sécurité routière, premiers secours.
  // Les parties neutralisées sont sautées. Le numéro de fiche est annoncé avant chaque question.
  function stopListen() { if (listen) { clearTimeout(listen.timer); clearInterval(listen.timer); listen.playing = false; } }
  function listenItems() {
    const out = [];
    FICHES.forEach((f) => {
      const ids = FICHE_CARDS[f.numero], vcat = /intérieure/i.test(f.type) ? 'VI' : 'VE';
      if (!f.neutralise_v) out.push({ num: f.numero, cat: vcat, q: f.verif_question, a: f.verif_reponse || 'Montre l\'élément ou réalise l\'action demandée.', card: ids.v });
      if (!f.neutralise_sr) out.push({ num: f.numero, cat: 'SR', q: f.qser_question, a: f.qser_reponse, ctx: f.verif_question, card: ids.sr });
      if (!f.neutralise_ps) out.push({ num: f.numero, cat: 'PS', q: f.ps_question, a: f.ps_reponse, card: ids.ps });
    });
    return out;
  }
  function vEcoute() {
    document.body.classList.add('is-dark');
    if (!listen) { const items = listenItems(); listen = { items, i: Math.max(0, items.findIndex((x) => x.num === S.listenAt)), phase: 'idle', count: 0, playing: false }; }
    const it = listen.items[listen.i];
    const partsOfFiche = listen.items.filter((x) => x.num === it.num);
    const pos = partsOfFiche.indexOf(it) + 1;
    const center = listen.phase === 'wait' ? `<div class="ring">${listen.count}</div><div style="text-align:center;color:#C9C5BC">secondes pour répondre dans ta tête</div>`
      : listen.phase === 'answer' ? `<div class="answer" style="background:#2A2D35;border-color:#3A3E47;color:var(--ground)"><span class="label" style="color:var(--blue-m)">Réponse</span><div class="text">${esc(it.a)}</div></div>`
      : listen.phase === 'idle' ? '<div style="text-align:center;color:#C9C5BC">Choisis la fiche de départ puis appuie sur lecture. Chaque question est lue, puis une pause, puis la réponse.</div>' : '';
    const fiches = FICHES.map((f) => f.numero);
    $app.classList.add('dark');
    render(`<div class="row"><a class="icon-btn" href="#home" aria-label="Retour">${I.back}</a><h1 style="font-size:22px;font-weight:800">Écoute continue</h1></div>
      <div class="warn">${I.warn}<span>Jamais en conduisant. À utiliser à pied ou dans les transports.</span></div>
      ${TTS ? '' : '<div class="banner" style="color:var(--ink)">La lecture vocale n\'est pas disponible sur ce navigateur.</div>'}
      <div class="stack" style="margin-top:8px"><div class="display" style="font-size:26px;font-weight:800">Fiche ${it.num} <span style="font-size:15px;color:#C9C5BC;font-family:var(--body);font-weight:400">· ${pos} / ${partsOfFiche.length}</span></div>
      <div class="small" style="font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--blue-m)">${CAT[it.cat]}</div>
      ${it.ctx ? `<div class="small" style="color:#C9C5BC">Après : ${esc(it.ctx)}</div>` : ''}
      <div class="question">${esc(it.q)}</div></div>
      ${center}
      <div class="spacer stack" style="gap:18px">
        <div class="player"><button class="big" id="pp" aria-label="${listen.playing ? 'Pause' : 'Lecture'}">${listen.playing ? I.pause : I.play}</button></div>
        ${listen.playing ? '' : `<div class="tiles">
          <div class="field" style="gap:6px"><label for="fs" class="small" style="color:#C9C5BC;font-weight:400">Démarrer à la fiche</label>
          <select id="fs" class="input" style="background:#2A2D35;color:#fff;border-color:#3A3E47">${fiches.map((n) => `<option value="${n}" ${n === it.num ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="field" style="gap:6px"><label for="pz" class="small" style="color:#C9C5BC;font-weight:400">Temps pour répondre</label>
          <select id="pz" class="input" style="background:#2A2D35;color:#fff;border-color:#3A3E47">${[3, 5, 8, 12].map((s) => `<option value="${s}" ${S.pause === s ? 'selected' : ''}>${s} s</option>`).join('')}</select></div></div>`}
        <button class="btn btn-ghost" id="ko" style="color:var(--ground)" ${it.card ? '' : 'disabled'}>Je ne savais pas — à revoir</button></div>`);
    $app.querySelector('#pp').addEventListener('click', () => {
      if (listen.playing) { stopListen(); hush(); listen.phase = 'idle'; S.listenAt = it.num; save(); vEcoute(); }
      else { listen.playing = true; playStep('question'); }
    });
    const fs = $app.querySelector('#fs');
    if (fs) fs.addEventListener('change', () => { listen.i = listen.items.findIndex((x) => x.num === fs.value); listen.phase = 'idle'; S.listenAt = fs.value; save(); vEcoute(); });
    const pz = $app.querySelector('#pz');
    if (pz) pz.addEventListener('change', (e) => { S.pause = parseInt(e.target.value, 10); save(); });
    $app.querySelector('#ko').addEventListener('click', (e) => { if (it.card) rate(it.card, 'rate'); e.target.textContent = 'Ajoutée à tes révisions'; e.target.disabled = true; });
  }
  function playStep(phase) {
    if (!listen.playing || location.hash !== '#ecoute') return;
    const it = listen.items[listen.i];
    clearTimeout(listen.timer); clearInterval(listen.timer);
    if (phase === 'question') {
      listen.phase = 'q'; vEcoute();
      say(`Fiche ${it.num === "00" ? "zéro zéro" : parseInt(it.num, 10)}. ${CAT[it.cat]}. ${it.q}`, () => playStep('wait'));
    } else if (phase === 'wait') {
      listen.phase = 'wait'; listen.count = S.pause || 5; vEcoute();
      listen.timer = setInterval(() => {
        listen.count--;
        if (listen.count <= 0) { clearInterval(listen.timer); playStep('answer'); } else { const r = $app.querySelector('.ring'); if (r) r.textContent = listen.count; }
      }, 1000);
    } else if (phase === 'answer') {
      listen.phase = 'answer'; vEcoute();
      say('Réponse : ' + it.a, () => {
        if (!listen.playing) return;
        listen.timer = setTimeout(() => { listen.i = (listen.i + 1) % listen.items.length; S.listenAt = listen.items[listen.i].num; save(); playStep('question'); }, 1200);
      });
    }
  }

  // ---------- Réglages ----------
  function icsReminder(time) {
    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    const a = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    const b = new Date(a.getTime() + 5 * 60000);
    const fmt = (d) => d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + pad2(d.getMinutes()) + '00';
    const until = S.examDate ? 'UNTIL=' + S.examDate.replace(/-/g, '') + 'T235959' : 'COUNT=60';
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const url = location.href.split('#')[0];
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Jour J//FR', 'BEGIN:VEVENT', 'UID:jourj-' + Date.now() + '@jourj', 'DTSTAMP:' + stamp,
      'DTSTART:' + fmt(a), 'DTEND:' + fmt(b), 'RRULE:FREQ=DAILY;' + until, 'SUMMARY:Jour J — séance de 5 min', 'DESCRIPTION:' + url, 'URL:' + url,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Séance Jour J', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    download(new Blob([ics], { type: 'text/calendar' }), 'rappel-jour-j.ics');
  }
  function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  function vSettings() {
    render(`${header('Réglages')}
      <div class="field"><label for="d">Date de l'examen</label><input id="d" class="input" type="date" value="${esc(S.examDate)}"></div>
      <div class="field"><span class="legend-t">Mode de révision</span><div class="options">
        <button class="option" data-m="audio" aria-pressed="${S.mode === 'audio'}"><b>Audio</b><small>Lecture à voix haute</small></button>
        <button class="option" data-m="lecture" aria-pressed="${S.mode === 'lecture'}"><b>Lecture</b><small>Texte seul</small></button></div></div>
      <div class="card stack"><b>Rappel quotidien</b><span class="small muted">Ajoute un rendez-vous répété dans l'agenda de ton téléphone, jusqu'au jour de l'examen.</span>
        <div class="row"><label for="t" class="sr-only">Heure du rappel</label><input id="t" class="input" type="time" value="18:30" style="width:auto"><button class="btn btn-light" id="ics" style="min-height:52px">Ajouter à l'agenda</button></div></div>
      <div class="card stack"><b>Ta progression</b><span class="small muted">Elle est enregistrée uniquement sur ce téléphone. Sauvegarde-la avant de changer de téléphone.</span>
        <div class="row"><button class="btn btn-light" id="ex" style="min-height:48px;font-size:15px">Sauvegarder</button><label class="btn btn-light" style="min-height:48px;font-size:15px">Restaurer<input type="file" id="im" accept="application/json" class="sr-only"></label></div>
        <button class="btn btn-ghost" id="rs" style="min-height:44px;font-size:15px;border-color:var(--orange);color:var(--orange-d)">Tout effacer</button></div>
      <p class="footer">Questions : banque officielle DSR (version du 1er janvier 2023), neutralisations à jour.<br>Aucune donnée n'est collectée. · <a href="mentions-legales.html">Mentions légales</a></p>`);
    $app.querySelector('#d').addEventListener('change', (e) => { S.examDate = e.target.value; save(); });
    $app.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { S.mode = b.dataset.m; save(); vSettings(); }));
    $app.querySelector('#ics').addEventListener('click', () => icsReminder($app.querySelector('#t').value || '18:30'));
    $app.querySelector('#ex').addEventListener('click', () => download(new Blob([JSON.stringify(S)], { type: 'application/json' }), 'progression-jour-j.json'));
    $app.querySelector('#im').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => { const s = JSON.parse(t); if (!s.cards) throw new Error(); S = s; save(); go('#home'); }).catch(() => alert('Fichier non reconnu.'));
    });
    $app.querySelector('#rs').addEventListener('click', () => { if (confirm('Effacer toute ta progression ?')) { S = { onboarded: false, examDate: '', mode: 'audio', pause: 5, cards: {}, history: [] }; save(); go('#onboarding'); } });
  }

  // ---------- Démarrage ----------
  fetch('data/questions.json').then((r) => r.json()).then((data) => { build(data); route(); })
    .catch(() => { $app.innerHTML = '<p class="loading">Impossible de charger les questions. Vérifie ta connexion puis recharge la page.</p>'; });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* hors GitHub Pages */ }); });
  }
})();
