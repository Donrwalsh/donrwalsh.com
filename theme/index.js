export const pdfRenderOptions = {
  format: "Letter",
  printBackground: true,
  margin: { top: "0.4in", right: "0.55in", bottom: "0.4in", left: "0.55in" },
};

export const pdfViewport = { width: 900, height: 1165, deviceScaleFactor: 2 };

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDate(str) {
  if (!str) return "Present";
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dateRange(start, end) {
  // Plain spaces (not &nbsp;) so extracted text reads "Jan 2024 – Jun 2025".
  return `${fmtDate(start)} – ${fmtDate(end || null)}`;
}

function bareUrl(u) {
  return String(u ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

// Visible text separator so parsers see real delimiters between items.
const SEP = `<span class="sep" aria-hidden="true"> | </span>`;

function section(title, body) {
  if (!body) return "";
  return `
  <section class="section">
    <h2 class="section-title">${esc(title)}</h2>
    ${body}
  </section>`;
}

// One-line entry: bold title, optional detail, right-aligned date.
function lineEntry(title, detail, date) {
  return `
    <div class="line-entry">
      <span class="line-main"><strong>${esc(title)}</strong>${detail ? `, ${esc(detail)}` : ""}</span>
      ${date ? `<span class="date">${esc(date)}</span>` : ""}
    </div>`;
}

export function render(resume) {
  const {
    basics = {},
    work = [],
    skills = [],
    projects = [],
    education = [],
    awards = [],
    volunteer = [],
    publications = [],
  } = resume;

  const {
    name,
    label,
    email,
    phone,
    url,
    summary,
    location = {},
    profiles = [],
  } = basics;

  /* ---- Header contact line ---- */
  const contactHtml = [
    email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : "",
    location.city
      ? `<span>${esc(location.city)}, ${esc(location.region)}</span>`
      : "",
    phone
      ? `<a href="tel:${esc(phone.replace(/[^\d+]/g, ""))}">${esc(phone)}</a>`
      : "",
    url ? `<a href="${esc(url)}">${esc(bareUrl(url))}</a>` : "",
    // Show the actual URL as text: link targets are lost in text extraction.
    ...profiles.map((p) =>
      p.url ? `<a href="${esc(p.url)}">${esc(bareUrl(p.url))}</a>` : "",
    ),
  ]
    .filter(Boolean)
    .map((s) => `<span class="contact-item">${s}</span>`)
    .join(SEP);

  /* ---- Skills: "Label: a, b, c" rows ---- */
  const skillsHtml = skills.length
    ? `<div class="skills">${skills
        .map(
          (s) => `
      <div class="skill-row">
        <span class="skill-label">${esc(s.name)}:</span>
        <span class="skill-list">${(s.keywords || []).map(esc).join(", ")}</span>
      </div>`,
        )
        .join("")}</div>`
    : "";

  /* ---- Experience ---- */
  const workHtml = work
    .map(
      (w) => `
    <div class="work-entry">
      <div class="entry-head">
        <span class="work-org">${esc(w.name)}</span>
        <span class="date">${dateRange(w.startDate, w.endDate)}</span>
      </div>
      <div class="work-pos">${esc(w.position)}</div>
      ${
        w.highlights && w.highlights.length
          ? `<ul class="bullets">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
          : ""
      }
    </div>`,
    )
    .join("");

  /* ---- Projects: name + URL, keywords right; description below ---- */
  const projectsHtml = projects
    .map(
      (p) => `
    <div class="work-entry">
      <div class="entry-head">
        <span><span class="work-org">${esc(p.name)}</span>${
          p.url ? `${SEP}<a href="${esc(p.url)}">${esc(bareUrl(p.url))}</a>` : ""
        }</span>
        ${p.keywords && p.keywords.length ? `<span class="date">${p.keywords.map(esc).join(", ")}</span>` : ""}
      </div>
      ${p.description ? `<div class="project-desc">${esc(p.description)}</div>` : ""}
    </div>`,
    )
    .join("");

  /* ---- Education ---- */
  const educationHtml = education
    .map((e) => {
      const degree = `${e.studyType || ""}${e.area ? ", " + e.area : ""}`;
      const extras =
        e.courses && e.courses.length ? "; " + e.courses.join(", ") : "";
      // Graduation year only, right-aligned like the other dates.
      const year = e.endDate ? String(e.endDate).slice(0, 4) : "";
      return lineEntry(e.institution, degree + extras, year);
    })
    .join("");

  /* ---- Recognition & Community ---- */
  // Awards, talks, and volunteering merged into one list, newest first.
  // Year-only dates (e.g. "2022") render as just the year.
  const shortDate = (d) => (/^\d{4}$/.test(String(d)) ? String(d) : fmtDate(d));
  const recognitionHtml = [
    ...awards.map((a) => ({ title: a.title, detail: a.awarder, date: a.date })),
    ...publications.map((p) => ({
      title: p.name,
      detail: `Speaker, ${p.publisher}`,
      date: p.releaseDate,
    })),
    ...volunteer.map((v) => ({
      title: v.organization,
      detail: `Volunteer ${v.position}`,
      date: v.startDate,
    })),
  ]
    .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")))
    .map((r) => lineEntry(r.title, r.detail, r.date ? shortDate(r.date) : ""))
    .join("");

  /* ---- Document ---- */
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${esc(name)} – Resume</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:      #26344a;
    --clay:      #b0512f;
    --ink:       #171b20;
    --ink-soft:  #4d545c;
    --line:      #e1e1dc;
    --body-size: 8.5pt;
  }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: var(--body-size);
    color: var(--ink);
    line-height: 1.36;
    background: #fff;
  }

  a { color: var(--clay); text-decoration: none; }
  strong { font-weight: 600; }

  /* ---- Header: name, title and contact each on their own line ---- */
  .resume-header {
    padding-bottom: 8px;
    margin-bottom: 9px;
    border-bottom: 2px solid var(--navy);
  }
  .resume-name {
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 22pt;
    color: var(--navy);
    /* Normal tracking keeps word spaces intact in PDF text extraction. */
    letter-spacing: normal;
    word-spacing: 0.08em;
    line-height: 1.1;
  }
  .resume-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9pt;
    color: var(--ink-soft);
    margin-top: 3px;
  }
  .contact {
    margin-top: 6px;
    font-size: 7.5pt;
    color: var(--ink-soft);
  }
  .contact-item { white-space: nowrap; }
  .sep { color: #b5b8bc; }

  /* ---- Sections ---- */
  .section { margin-bottom: 9px; }
  .section:last-child { margin-bottom: 0; }

  .section-title {
    font-family: 'Outfit', sans-serif;
    font-weight: 600;
    font-size: 10pt;
    color: var(--navy);
    padding-bottom: 2px;
    margin-bottom: 5px;
    border-bottom: 1px solid var(--line);
  }

  .summary { color: var(--ink-soft); }

  /* ---- Shared row: text left, date right, same baseline ---- */
  .entry-head,
  .line-entry {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .line-entry + .line-entry { margin-top: 2px; }
  .date {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.5pt;
    color: var(--ink-soft);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ---- Skills ---- */
  .skill-row {
    display: flex;
    gap: 8px;
    margin-bottom: 1px;
  }
  .skill-row:last-child { margin-bottom: 0; }
  .skill-label {
    flex: 0 0 165px;
    font-weight: 600;
    color: var(--navy);
  }
  .skill-list { color: var(--ink); }

  /* ---- Experience ---- */
  .work-entry + .work-entry { margin-top: 6px; }
  .work-org {
    font-weight: 600;
    font-size: 9.5pt;
    color: var(--navy);
  }
  .work-pos {
    font-weight: 500;
    color: var(--ink);
    margin: 0 0 2px;
  }
  .bullets { padding-left: 15px; }
  .bullets li {
    color: var(--ink);
    margin-bottom: 1px;
    line-height: 1.36;
  }
  .bullets li:last-child { margin-bottom: 0; }

  .project-desc { color: var(--ink); }

  /* ---- Education ---- */

  @media print {
    .work-entry, .line-entry { break-inside: avoid; }
  }
</style>
</head>
<body>

<header class="resume-header">
  <h1 class="resume-name">${esc(name)}</h1>
  ${label ? `<div class="resume-label">${esc(label)}</div>` : ""}
  ${contactHtml ? `<div class="contact">${contactHtml}</div>` : ""}
</header>

<main>
  ${summary ? section("Summary", `<p class="summary">${esc(summary)}</p>`) : ""}
  ${section("Skills", skillsHtml)}
  ${section("Projects", projectsHtml)}
  ${section("Experience", workHtml)}
  ${section("Education", educationHtml)}
  ${section("Recognition & Community", recognitionHtml)}
</main>

</body>
</html>`;
}
