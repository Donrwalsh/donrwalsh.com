export const pdfRenderOptions = {
  format: "Letter",
  printBackground: true,
  margin: { top: "0.45in", right: "0.65in", bottom: "0.45in", left: "0.65in" },
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
  return `${fmtDate(start)}&nbsp;–&nbsp;${fmtDate(end || null)}`;
}

function tags(keywords = []) {
  return keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join("");
}

export function render(resume) {
  const {
    basics = {},
    work = [],
    skills = [],
    education = [],
    awards = [],
    volunteer = [],
    publications = [],
  } = resume;

  const {
    name,
    label,
    email,
    url,
    summary,
    location = {},
    profiles = [],
  } = basics;

  /* ---- Sidebar ---- */
  const contactHtml = [
    email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : "",
    location.city
      ? `<span>${esc(location.city)}, ${esc(location.region)}</span>`
      : "",
    `<span class="remote-badge">Open to Remote</span>`,
    url
      ? `<a href="${esc(url)}">${esc(url.replace(/^https?:\/\//, ""))}</a>`
      : "",
    ...profiles.map(
      (p) =>
        `<a href="${esc(p.url)}">${esc(p.network)}${p.username ? " / " + esc(p.username) : ""}</a>`,
    ),
  ]
    .filter(Boolean)
    .map((s) => `<div class="contact-item">${s}</div>`)
    .join("");

  const skillsHtml = skills
    .map(
      (s) => `
    <div class="skill-cat">
      <div class="skill-cat-label">${esc(s.name)}</div>
      <div class="tag-row">${tags(s.keywords)}</div>
    </div>`,
    )
    .join("");

  const educationHtml = education
    .map(
      (e) => `
    <div class="edu-entry">
      <div class="edu-inst">${esc(e.institution)}</div>
      <div class="edu-degree">${esc(e.studyType)}${e.area ? ", " + esc(e.area) : ""}</div>
      ${e.courses && e.courses.length ? `<div class="edu-courses">${e.courses.map(esc).join(" · ")}</div>` : ""}
    </div>`,
    )
    .join("");

  const awardsHtml = awards
    .map(
      (a) => `
    <div class="aside-entry">
      <div class="aside-title">${esc(a.title)}</div>
      <div class="aside-meta">${esc(a.awarder)}${a.date ? " · " + fmtDate(a.date) : ""}</div>
    </div>`,
    )
    .join("");

  const speakingHtml = publications
    .map(
      (p) => `
    <div class="aside-entry">
      <div class="aside-title">${esc(p.name)}</div>
      <div class="aside-meta">${esc(p.publisher)}${p.releaseDate ? " · " + fmtDate(p.releaseDate) : ""}</div>
    </div>`,
    )
    .join("");

  const volunteerHtml = volunteer
    .map(
      (v) => `
    <div class="aside-entry">
      <div class="aside-title">${esc(v.organization)}</div>
      <div class="aside-meta">${esc(v.position)}${v.startDate ? " · " + fmtDate(v.startDate) : ""}</div>
    </div>`,
    )
    .join("");

  /* ---- Main ---- */
  const workHtml = work
    .map(
      (w) => `
    <div class="work-entry">
      <div class="work-top">
        <span class="work-org">${esc(w.name)}</span>
        <span class="work-dates">${dateRange(w.startDate, w.endDate)}</span>
      </div>
      <div class="work-pos">${esc(w.position)}</div>
      ${w.highlights && w.highlights.length ? `<ul class="work-bullets">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    </div>`,
    )
    .join("");

  /* ---- Document ---- */
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:      #26344a;
    --clay:      #b0512f;
    --ink:       #171b20;
    --ink-soft:  #5a6169;
    --line:      #e6e6e2;
    --navy-soft: #eef1f5;
    --sidebar-w: 190px;
    --gap:       32px;
    --body-size: 8.5pt;
  }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: var(--body-size);
    color: var(--ink);
    line-height: 1.5;
    background: #fff;
  }

  a { color: var(--clay); text-decoration: none; }

  /* ---- Header ---- */
  .resume-header {
    border-bottom: 2px solid var(--navy);
    padding-bottom: 10px;
    margin-bottom: 18px;
    display: flex;
    align-items: baseline;
    gap: 14px;
  }
  .resume-name {
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 22pt;
    color: var(--navy);
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .resume-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8pt;
    color: var(--ink-soft);
  }

  /* ---- Two-column layout ---- */
  .layout {
    display: grid;
    grid-template-columns: var(--sidebar-w) 1fr;
    gap: 0 var(--gap);
    align-items: start;
  }

  /* ---- Sidebar ---- */
  .sidebar {}

  .sidebar-section {
    margin-bottom: 11px;
    padding-bottom: 11px;
    border-bottom: 1px solid var(--line);
  }
  .sidebar-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .section-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 6.5pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--navy);
    margin-bottom: 7px;
  }

  .contact-item {
    font-size: 7.5pt;
    color: var(--ink-soft);
    margin-bottom: 3px;
    word-break: break-all;
  }
  .contact-item a { color: var(--clay); }
  .remote-badge {
    font-size: 7.5pt;
    color: var(--ink-soft);
    font-style: italic;
  }

  .skills-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px 14px;
  }
  .skill-cat { }
  .skill-cat-label {
    font-size: 6.5pt;
    font-weight: 600;
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 4px;
  }
  .tag-row { display: flex; flex-wrap: wrap; gap: 3px; }
  .tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 6pt;
    color: var(--navy);
    background: var(--navy-soft);
    padding: 1px 5px;
    border-radius: 2px;
  }

  .edu-entry { margin-bottom: 6px; }
  .edu-entry:last-child { margin-bottom: 0; }
  .edu-inst { font-size: 7.5pt; font-weight: 600; }
  .edu-degree { font-size: 7.5pt; color: var(--ink-soft); }
  .edu-courses { font-size: 7pt; color: var(--ink-soft); margin-top: 2px; }

  .aside-entry { margin-bottom: 6px; }
  .aside-entry:last-child { margin-bottom: 0; }
  .aside-title { font-size: 7.5pt; font-weight: 600; }
  .aside-meta {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 6.5pt;
    color: var(--ink-soft);
    margin-top: 1px;
  }

  /* ---- Main ---- */
  .main {}

  .summary {
    font-size: 8.5pt;
    color: var(--ink-soft);
    line-height: 1.5;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line);
  }

  .main-section { margin-bottom: 11px; }
  .main-section:last-child { margin-bottom: 0; }

  .main-section-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 6.5pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--navy);
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--line);
  }

  .work-entry {
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .work-entry:first-of-type { border-top: none; padding-top: 0; }

  .work-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .work-org {
    font-weight: 600;
    font-size: 9pt;
    color: var(--navy);
  }
  .work-dates {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 6.5pt;
    color: var(--ink-soft);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .work-pos {
    font-size: 7.5pt;
    color: var(--ink-soft);
    margin: 2px 0 5px;
  }
  .work-bullets {
    margin: 0;
    padding-left: 14px;
  }
  .work-bullets li {
    font-size: 8pt;
    color: var(--ink-soft);
    margin-bottom: 2px;
    line-height: 1.45;
  }
  .work-bullets li:last-child { margin-bottom: 0; }
</style>
</head>
<body>

<div class="resume-header">
  <div class="resume-name">${esc(name)}</div>
  <div class="resume-label">${esc(label)}</div>
</div>

<div class="layout">
  <aside class="sidebar">

    ${
      contactHtml
        ? `<div class="sidebar-section">
      <div class="section-label">Contact</div>
      ${contactHtml}
    </div>`
        : ""
    }


    ${
      educationHtml
        ? `<div class="sidebar-section">
      <div class="section-label">Education</div>
      ${educationHtml}
    </div>`
        : ""
    }

    ${
      awardsHtml
        ? `<div class="sidebar-section">
      <div class="section-label">Awards & Achievements</div>
      ${awardsHtml}
    </div>`
        : ""
    }

    ${
      speakingHtml
        ? `<div class="sidebar-section">
      <div class="section-label">Speaking</div>
      ${speakingHtml}
    </div>`
        : ""
    }

    ${
      volunteerHtml
        ? `<div class="sidebar-section">
      <div class="section-label">Volunteer</div>
      ${volunteerHtml}
    </div>`
        : ""
    }

  </aside>

  <main class="main">

    ${summary ? `<p class="summary">${esc(summary)}</p>` : ""}

    ${
      skillsHtml
        ? `<div class="main-section">
      <div class="main-section-label">Skills</div>
      <div class="skills-grid">${skillsHtml}</div>
    </div>`
        : ""
    }

    ${
      workHtml
        ? `<div class="main-section">
      <div class="main-section-label">Experience</div>
      ${workHtml}
    </div>`
        : ""
    }

  </main>
</div>

</body>
</html>`;
}
