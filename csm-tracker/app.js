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
    $("status").textContent = `${fileName} · ${res.clients.length + res.issues.length} comptes · importé le ${new Date(importedAt).toLocaleString("fr-FR")}`;
    fillCsmFilter();
    $("view").hidden = $("results").hidden = false;
    render();
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
          <td class="account">${escape(r.account)}</td>
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

  $("rows").onchange = (e) => {
    const key = e.target.dataset.key;
    if (!key) return;
    if (e.target.checked) done[key] = true;
    else delete done[key];
    store.set("csm.done", done);
    render();
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
