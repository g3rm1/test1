// Reads the SFDC report and computes when each client should be contacted.
// The follow-up rules are in RULES just below: that's the part you may want to edit.
(function (root) {
  // Program rules. The key is matched against "STP Program" (case-insensitive, "contains").
  //   midpoint: one follow-up halfway between start and end date
  //   everyMonths: a follow-up every N months after the start date, until the end date
  const RULES = [
    { match: "early", label: "Early", midpoint: true },
    { match: "growth", label: "Growth", everyMonths: 3 },
    { match: "nvidia", label: "Nvidia", everyMonths: 3 },
  ];

  // Report columns, as named in the SFDC export
  const COLUMNS = {
    program: "STP Program",
    country: "CLI COUNTRY",
    account: "Nom du compte",
    accountOwner: "Propriétaire du compte: Nom complet",
    csmOwner: "CSM Owner: Nom complet",
    start: "Program Start Date",
    end: "Program End Date",
    revCurrent: "ELM CURRENT MONTH REVENUE",
    revM1: "ELT TOTAL REV M-1",
    lastActivity: "Dernière activité",
  };
  const REQUIRED = ["program", "account", "start", "end", "revM1"];

  // ---- CSV ----
  // Separator: whichever of tab, ";" or "," appears most in the header line
  function detectSeparator(text) {
    const header = text.split(/\r?\n/, 1)[0];
    const count = (c) => header.split(c).length - 1;
    return ["\t", ";", ","].reduce((best, c) => (count(c) > count(best) ? c : best), ",");
  }

  function parseCsv(text) {
    text = text.replace(/^﻿/, "");
    const sep = detectSeparator(text);
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === sep) { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((f) => f.trim() !== ""));
  }

  // ---- Values ----
  // Dates are kept as UTC midnight so the day never shifts with the timezone.
  // Accepts "31/01/2026", "31/01/2026 14:05", "2026-01-31".
  function parseDate(s) {
    s = String(s || "").trim();
    let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    let y, mo, d;
    if (m) [, d, mo, y] = m.map(Number);
    else if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) [, y, mo, d] = m.map(Number);
    else return null;
    const date = new Date(Date.UTC(y, mo - 1, d));
    return date.getUTCMonth() === mo - 1 ? date : null;
  }

  // "1 234,56 €", "EUR 1,234.56", "1234.5" -> number; empty -> 0
  function parseAmount(s) {
    let t = String(s || "").replace(/[^\d,.-]/g, "");
    if (!t) return 0;
    const lastComma = t.lastIndexOf(","), lastDot = t.lastIndexOf(".");
    if (lastComma > -1 && lastDot > -1) {
      // Both: the last one is the decimal separator
      const dec = lastComma > lastDot ? "," : ".";
      t = t.split(dec === "," ? "." : ",").join("").replace(dec, ".");
    } else if (lastComma > -1) {
      // Only commas: thousands if several or exactly 3 digits after, else decimal
      const parts = t.split(",");
      t = parts.length > 2 || parts[1].length === 3 ? parts.join("") : t.replace(",", ".");
    } else if (t.split(".").length > 2) {
      t = t.split(".").join("");
    }
    const n = parseFloat(t);
    return isNaN(n) ? 0 : n;
  }

  // Adds months, keeping the day but clamping to the end of shorter months (31/01 + 1 -> 28/02)
  function addMonths(date, n) {
    const y = date.getUTCFullYear(), m = date.getUTCMonth() + n, d = date.getUTCDate();
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(d, lastDay)));
  }

  const DAY = 24 * 3600 * 1000;

  function findRule(program) {
    const p = String(program || "").toLowerCase();
    return RULES.find((r) => p.includes(r.match)) || null;
  }

  // Follow-up dates for one client: [{ date, label }]
  function touchpoints(rule, start, end) {
    if (rule.midpoint) {
      const days = Math.floor((end - start) / DAY / 2);
      return [{ date: new Date(start.getTime() + days * DAY), label: "Mi-parcours" }];
    }
    const dates = [];
    for (let i = 1; ; i++) {
      const d = addMonths(start, i * rule.everyMonths);
      if (d >= end) break;
      dates.push(d);
    }
    return dates.map((date, i) => ({ date, label: `Follow-up ${i + 1}/${dates.length}` }));
  }

  // ---- Report ----
  // Returns { clients, issues, missing }:
  //   clients: rows with their follow-up dates
  //   issues: rows that could not be scheduled (unknown program, bad dates), with the reason
  //   missing: required columns not found in the header
  function readReport(text) {
    const rows = parseCsv(text);
    const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
    const header = (rows[0] || []).map(norm);
    const idx = {};
    for (const [key, name] of Object.entries(COLUMNS)) idx[key] = header.indexOf(norm(name));
    const missing = REQUIRED.filter((k) => idx[k] < 0).map((k) => COLUMNS[k]);
    if (missing.length) return { clients: [], issues: [], missing };

    const clients = [], issues = [];
    for (const r of rows.slice(1)) {
      const get = (k) => (idx[k] >= 0 ? String(r[idx[k]] ?? "").trim() : "");
      const c = {
        account: get("account"),
        program: get("program"),
        country: get("country"),
        accountOwner: get("accountOwner"),
        csmOwner: get("csmOwner"),
        startRaw: get("start"),
        endRaw: get("end"),
        revM1: parseAmount(get("revM1")),
        revCurrent: parseAmount(get("revCurrent")),
        lastActivity: get("lastActivity"),
      };
      // SFDC adds footer lines (totals, "Confidential"…) that have no account: skip them
      if (!c.account) continue;
      c.start = parseDate(c.startRaw);
      c.end = parseDate(c.endRaw);
      const rule = findRule(c.program);
      if (!rule) { issues.push({ ...c, reason: `Programme non reconnu : « ${c.program || "vide"} »` }); continue; }
      if (!c.start || !c.end) { issues.push({ ...c, reason: "Date de début ou de fin manquante / illisible" }); continue; }
      if (c.end <= c.start) { issues.push({ ...c, reason: "Date de fin avant la date de début" }); continue; }
      c.rule = rule.label;
      c.touchpoints = touchpoints(rule, c.start, c.end);
      clients.push(c);
    }
    return { clients, issues, missing };
  }

  // Clients to contact in a given month (year, month 1-12), highest revenue M-1 first
  function contactsForMonth(clients, year, month) {
    const out = [];
    for (const c of clients) {
      for (const t of c.touchpoints) {
        if (t.date.getUTCFullYear() === year && t.date.getUTCMonth() === month - 1) out.push({ ...c, due: t.date, contact: t.label });
      }
    }
    return out.sort((a, b) => b.revM1 - a.revM1 || a.account.localeCompare(b.account));
  }

  const api = { RULES, COLUMNS, parseCsv, parseDate, parseAmount, addMonths, touchpoints, readReport, contactsForMonth };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Schedule = api;
})(this);
