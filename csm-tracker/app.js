// Page logic: import the report, pick a month, show and tick the clients to contact.
// The follow-up rules live in schedule.js.
(function () {
  const S = window.Schedule;
  const $ = (id) => document.getElementById(id);

  // Everything is kept in this browser only (localStorage), never sent anywhere
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: just don't remember */ }
    },
  };

  const escape = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d) => d.toLocaleDateString("fr-FR", { timeZone: "UTC" });
  const iso = (d) => d.toISOString().slice(0, 10);
  const fmtMoney = (n) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  let report = null;
  let done = store.get("csm.done", {});
  const doneKey = (r) => `${r.account}|${iso(r.due)}`;

  // ---- Import ----
  function load(text, fileName, importedAt) {
    const res = S.readReport(text);
    if (res.missing.length) {
      $("error").innerHTML = `Colonnes introuvables dans le fichier : <b>${res.missing.map(escape).join(", ")}</b>.<br>
        Vérifie que le rapport SFDC est exporté en « Détails uniquement » (CSV) avec ces colonnes.`;
      $("error").hidden = false;
      return false;
    }
    $("error").hidden = true;
    report = res;
    report.clients.forEach((c, i) => (c.id = i));
    $("status").textContent = `${fileName} · ${res.clients.length + res.issues.length} comptes · importé le ${new Date(importedAt).toLocaleString("fr-FR")}`;
    fillCsmFilter();
    $("view").hidden = $("results").hidden = false;
    route();
    return true;
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const now = Date.now();
      if (load(reader.result, file.name, now)) store.set("csm.report", { text: reader.result, name: file.name, at: now });
    };
    reader.readAsText(file);
  }

  $("pick").onclick = () => $("file").click();
  $("file").onchange = (e) => e.target.files[0] && readFile(e.target.files[0]);
  const drop = $("drop");
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("over"); };
  drop.ondragleave = () => drop.classList.remove("over");
  drop.ondrop = (e) => {
    e.preventDefault();
    drop.classList.remove("over");
    if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
  };

  // ---- Filters ----
  function fillCsmFilter() {
    const owners = [...new Set(report.clients.map((c) => c.csmOwner).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const keep = store.get("csm.owner", "");
    $("csm").innerHTML = `<option value="">Tous</option>` + owners.map((o) => `<option>${escape(o)}</option>`).join("");
    $("csm").value = owners.includes(keep) ? keep : "";
  }

  const today = new Date();
  $("month").value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  $("month").onchange = render;
  $("csm").onchange = () => { store.set("csm.owner", $("csm").value); render(); };

  // ---- List ----
  function currentList() {
    const [y, m] = $("month").value.split("-").map(Number);
    if (!y || !m) return [];
    const owner = $("csm").value;
    const clients = owner ? report.clients.filter((c) => c.csmOwner === owner) : report.clients;
    return S.contactsForMonth(clients, y, m);
  }

  function render() {
    if (!report) return;
    const list = currentList();
    $("rows").innerHTML = list
      .map((r, i) => {
        const key = doneKey(r);
        const isDone = !!done[key];
        return `<tr class="${isDone ? "done" : ""}">
          <td><input type="checkbox" data-key="${escape(key)}" ${isDone ? "checked" : ""} aria-label="Contacté"></td>
          <td class="num">${i + 1}</td>
          <td class="account"><a href="#client/${r.id}">${escape(r.account)}</a></td>
          <td>${escape(r.country)}</td>
          <td>${escape(r.program)}</td>
          <td><span class="tag${r.contact === "Offboarding" ? " off" : ""}">${escape(r.contact)}</span></td>
          <td>${fmtDate(r.due)}</td>
          <td class="num">${fmtMoney(r.revM1)}</td>
          <td class="num">${fmtMoney(r.revCurrent)}</td>
          <td>${escape(r.lastActivity)}</td>
          <td>${escape(r.csmOwner)}</td>
          <td>${escape(r.accountOwner)}</td>
        </tr>`;
      })
      .join("");
    $("empty").hidden = list.length > 0;
    $("count").textContent = list.length;
    $("done").textContent = list.filter((r) => done[doneKey(r)]).length;
    $("rev").textContent = fmtMoney(list.reduce((s, r) => s + r.revM1, 0));

    $("issues").hidden = report.issues.length === 0;
    $("issues-title").textContent = `${report.issues.length} compte(s) à vérifier (non planifiés)`;
    $("issue-rows").innerHTML = report.issues
      .map((c) => `<tr><td>${escape(c.account)}</td><td>${escape(c.program)}</td><td>${escape(c.startRaw)}</td><td>${escape(c.endRaw)}</td><td>${escape(c.reason)}</td></tr>`)
      .join("");
  }

  // Ticking "contacté" works the same in the list and on the client page
  const onTick = (e) => {
    const key = e.target.dataset.key;
    if (!key) return;
    if (e.target.checked) done[key] = true;
    else delete done[key];
    store.set("csm.done", done);
    route();
  };
  $("rows").onchange = onTick;
  $("c-timeline").onchange = onTick;

  // ---- Client page (#client/<id>) ----
  const todayUtc = () => { const d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); };

  function route() {
    const m = location.hash.match(/^#client\/(\d+)$/);
    const client = m && report && report.clients[Number(m[1])];
    $("client-view").hidden = !client;
    $("list-view").hidden = !!client;
    if (client) renderClient(client);
    else { document.title = "Suivi CSM"; render(); }
  }
  window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });

  function renderClient(c) {
    document.title = `${c.account} · Suivi CSM`;
    $("c-name").textContent = c.account;
    $("c-meta").textContent = [c.program, c.country].filter(Boolean).join(" · ");
    const facts = [
      ["Programme", c.program], ["Pays", c.country], ["Début", fmtDate(c.start)], ["Fin", fmtDate(c.end)],
      ["Rev M-1", fmtMoney(c.revM1)], ["Rev mois en cours", fmtMoney(c.revCurrent)], ["Dernière activité", c.lastActivity || "—"],
      ["CSM Owner", c.csmOwner || "—"], ["Propriétaire du compte", c.accountOwner || "—"],
    ];
    $("c-facts").innerHTML = facts.map(([k, v]) => `<div><span>${k}</span><b>${escape(v)}</b></div>`).join("");

    const today = todayUtc();
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const events = [
      { date: c.start, label: "Début du programme" },
      ...c.touchpoints.map((t) => ({ ...t, contact: true })),
      { date: c.end, label: "Fin du programme" },
    ];
    // "Aujourd'hui" marker, placed in date order (after events of the same day)
    const at = events.findIndex((e) => e.date > today);
    events.splice(at < 0 ? events.length : at, 0, { date: today, label: "Aujourd'hui", today: true });

    let nextShown = false; // the next email is shown open, later ones folded
    $("c-timeline").innerHTML = events
      .map((e) => {
        if (e.today) return `<li class="today"><div class="t-head"><span class="t-date">${fmtDate(e.date)}</span>Aujourd'hui</div></li>`;
        if (!e.contact) return `<li><div class="t-head"><span class="t-date">${fmtDate(e.date)}</span>${escape(e.label)}</div></li>`;
        const key = doneKey({ account: c.account, due: e.date });
        const isDone = !!done[key];
        // Upcoming = not done yet and due this month or later: that's when the email is useful
        const state = isDone ? "done" : e.date < monthStart ? "late" : "upcoming";
        const stateText = { done: "Fait", late: "Passé · non coché", upcoming: e.date < today ? "Ce mois-ci · en retard" : "À venir" }[state];
        return `<li class="${state}">
          <div class="t-head">
            <span class="t-date">${fmtDate(e.date)}</span>
            <span class="tag${e.label === "Offboarding" ? " off" : ""}">${escape(e.label)}</span>
            <span class="t-state${state === "late" ? " late" : ""}">${stateText}</span>
            <label><input type="checkbox" data-key="${escape(key)}" ${isDone ? "checked" : ""}> Contacté</label>
          </div>
          ${state !== "upcoming" ? "" : nextShown ? `<details class="later"><summary>Voir le mail</summary>${mailBlock(c, e, today)}</details>` : ((nextShown = true), mailBlock(c, e, today))}
        </li>`;
      })
      .join("");
  }

  function mailBlock(c, touchpoint, today) {
    const mail = window.Templates.emailFor(c, touchpoint, today);
    const href = `mailto:?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
    return `<div class="mail" data-subject="${escape(mail.subject)}" data-body="${escape(mail.body)}">
      <div class="subject">Objet : ${escape(mail.subject)}</div>
      <pre>${escape(mail.body)}</pre>
      <div class="actions">
        <a class="btn primary" href="${escape(href)}">Ouvrir dans ma messagerie</a>
        <button type="button" data-copy="body">Copier le texte</button>
        <button type="button" data-copy="subject">Copier l'objet</button>
        <span class="lang">${mail.lang === "fr" ? "Français (pays : France)" : "Anglais (pays hors France)"}</span>
      </div>
    </div>`;
  }

  $("c-timeline").onclick = async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const text = btn.closest(".mail").dataset[btn.dataset.copy];
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers / blocked clipboard: copy through a hidden textarea
      const ta = Object.assign(document.createElement("textarea"), { value: text });
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    const label = btn.textContent;
    btn.textContent = "Copié ✓";
    setTimeout(() => (btn.textContent = label), 1500);
  };

  // ---- Export ----
  $("export").onclick = () => {
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Priorité", "Compte", "Pays", "Programme", "Contact", "Date prévue", "Rev M-1", "Rev mois", "Dernière activité", "CSM Owner", "Propriétaire", "Contacté"];
    const lines = currentList().map((r, i) =>
      [i + 1, r.account, r.country, r.program, r.contact, fmtDate(r.due), r.revM1, r.revCurrent, r.lastActivity, r.csmOwner, r.accountOwner, done[doneKey(r)] ? "oui" : ""]
        .map(cell).join(";")
    );
    // BOM + ";" so Excel (FR) opens it directly with accents and columns
    const blob = new Blob(["﻿" + [head.map(cell).join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `clients-a-contacter-${$("month").value}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Reopen the last imported report
  const saved = store.get("csm.report", null);
  if (saved && saved.text) load(saved.text, saved.name, saved.at);
})();
