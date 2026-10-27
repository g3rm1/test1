// Email templates to book each meeting. French when "CLI COUNTRY" is France, English otherwise.
// Edit the texts freely; the {placeholders} are filled in for each client:
//   {account} {program} {start} {end} {months} (months since start) {week} (suggested week) {csm} (CSM Owner)
(function (root) {
  const TEMPLATES = {
    fr: {
      followUp: {
        subject: "{account} – Point de suivi {program}",
        body: `Bonjour,

J'espère que vous allez bien. Cela fait {months} mois que votre programme {program} a démarré, et j'aimerais organiser un point de suivi de 30 minutes pour faire le bilan de ces derniers mois, échanger sur vos priorités et voir comment nous pouvons vous accompagner pour la suite.

Auriez-vous des disponibilités la semaine du {week} ? N'hésitez pas à me proposer le créneau qui vous convient le mieux.

Bien à vous,
{csm}`,
      },
      offboarding: {
        subject: "{account} – Bilan de fin de programme {program}",
        body: `Bonjour,

Votre programme {program} arrive à son terme le {end}. Je vous propose que nous prenions rendez-vous d'ici là pour revenir ensemble sur les résultats obtenus, recueillir vos retours et préparer la suite.

Auriez-vous un créneau de 45 minutes la semaine du {week} ? N'hésitez pas à me proposer le moment qui vous convient le mieux.

Bien à vous,
{csm}`,
      },
    },
    en: {
      followUp: {
        subject: "{account} – {program} check-in",
        body: `Hello,

I hope you are doing well. It has been {months} months since your {program} program started, and I would like to set up a 30-minute check-in to review the past few months, discuss your priorities and see how we can best support you going forward.

Would you be available during the week of {week}? Feel free to suggest a time that works best for you.

Best regards,
{csm}`,
      },
      offboarding: {
        subject: "{account} – {program} end-of-program review",
        body: `Hello,

Your {program} program comes to an end on {end}. I would like to schedule a review meeting before then to go over the results together, gather your feedback and discuss next steps.

Would you have 45 minutes during the week of {week}? Feel free to suggest a time that works best for you.

Best regards,
{csm}`,
      },
    },
  };

  const isFrench = (country) => ["france", "fr"].includes(String(country || "").trim().toLowerCase());

  // Monday of the week of `date`, or of next week if that Monday is already past
  function suggestedWeek(date, today) {
    const monday = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
    const m = monday(date);
    return m > today ? m : monday(new Date(today.getTime() + 7 * 24 * 3600 * 1000));
  }

  // client: a row from Schedule.readReport; touchpoint: { date, label }; today: Date (UTC midnight)
  function emailFor(client, touchpoint, today) {
    const lang = isFrench(client.country) ? "fr" : "en";
    const kind = touchpoint.label === "Offboarding" ? "offboarding" : "followUp";
    const t = TEMPLATES[lang][kind];
    const fmt = (d) => d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    const s = client.start, d = touchpoint.date;
    const months = Math.max(1, Math.round((d.getUTCFullYear() - s.getUTCFullYear()) * 12 + d.getUTCMonth() - s.getUTCMonth()));
    const values = {
      account: client.account,
      program: client.program,
      start: fmt(client.start),
      end: fmt(client.end),
      months,
      week: fmt(suggestedWeek(d, today)),
      csm: client.csmOwner,
    };
    const fill = (text) => text.replace(/\{(\w+)\}/g, (all, k) => (k in values ? values[k] : all));
    return { lang, subject: fill(t.subject), body: fill(t.body) };
  }

  const api = { TEMPLATES, isFrench, emailFor };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Templates = api;
})(this);
