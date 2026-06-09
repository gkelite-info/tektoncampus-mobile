

// ── Helpers ──────────────────────────────────────────────────────────────────

import { ComplexityRow, TopicNotes } from "./Generatetopicnotes";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bulletList(items: string[], icon = "◆"): string {
  return `<ul class="bullet-list">${items
    .map((i) => `<li><span class="bullet-icon">${icon}</span>${esc(i)}</li>`)
    .join("")}</ul>`;
}

function complexityTable(rows: ComplexityRow[]): string {
  if (!rows || rows.length === 0) return "";
  return `
    <div class="section">
      <h2 class="section-title">&#9881; Complexity Analysis</h2>
      <table class="complexity-table">
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Best Case</th>
            <th>Average Case</th>
            <th>Worst Case</th>
            <th>Space</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r, i) => `
          <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
            <td class="algo-name">${esc(r.algorithm)}</td>
            <td class="complexity good">${esc(r.best)}</td>
            <td class="complexity avg">${esc(r.average)}</td>
            <td class="complexity bad">${esc(r.worst)}</td>
            <td class="complexity space">${esc(r.space)}</td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function codeBlock(label: string, code: string): string {
  return `
    <div class="code-block">
      <div class="code-label">${esc(label)}</div>
      <pre class="code-content">${esc(code)}</pre>
    </div>`;
}

// ── Main template ─────────────────────────────────────────────────────────────

export function buildTopicHtml(notes: TopicNotes): string {
  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const sectionsHtml = notes.sections
    .map(
      (s) => `
      <div class="section">
        <h2 class="section-title">&#9670; ${esc(s.heading)}</h2>
        <p class="body-text">${esc(s.content)}</p>
        ${s.bulletPoints ? bulletList(s.bulletPoints) : ""}
        ${s.codeExample ? codeBlock(s.codeExample.label, s.codeExample.code) : ""}
      </div>`
    )
    .join("");

  const keyTermsHtml = notes.keyTerms
    .map(
      (kt, i) => `
      <div class="term-row ${i % 2 === 0 ? "term-even" : "term-odd"}">
        <div class="term-name">${esc(kt.term)}</div>
        <div class="term-def">${esc(kt.definition)}</div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(notes.topicTitle)}</title>
<style>
  /* ── Reset ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Page setup ── */
  @page { size: A4; margin: 0; }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a2e;
    background: #ffffff;
    line-height: 1.7;
  }

  /* ── Cover page ── */
  .cover {
    width: 100%;
    min-height: 297mm;
    background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 60px 60px 40px 60px;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }
  .cover::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }
  .cover::after {
    content: '';
    position: absolute;
    bottom: -100px; left: -60px;
    width: 500px; height: 300px;
    border-radius: 50%;
    background: rgba(255,255,255,0.03);
  }
  .cover-badge {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    color: #a8c7fa;
    font-size: 9pt;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 6px 16px;
    border-radius: 20px;
    margin-bottom: 32px;
  }
  .cover-topic {
    font-size: 32pt;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
    margin-bottom: 24px;
    max-width: 520px;
  }
  .cover-meta {
    margin-top: 8px;
  }
  .cover-meta-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255,255,255,0.7);
    font-size: 10pt;
    margin-bottom: 10px;
  }
  .cover-meta-label {
    color: #a8c7fa;
    font-weight: 600;
    min-width: 100px;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .cover-divider {
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #e94560, #a8c7fa);
    border-radius: 2px;
    margin: 32px 0;
  }
  .cover-footer {
    position: absolute;
    bottom: 40px;
    left: 60px;
    right: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 20px;
  }
  .cover-footer-text {
    color: rgba(255,255,255,0.4);
    font-size: 8.5pt;
  }
  .cover-page-num {
    color: rgba(255,255,255,0.3);
    font-size: 8.5pt;
  }

  /* ── Content pages ── */
  .content-page {
    padding: 50px 60px 60px 60px;
  }

  /* ── Page header (repeating) ── */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    border-bottom: 2px solid #1a1a2e;
    margin-bottom: 32px;
  }
  .page-header-title {
    font-size: 9pt;
    font-weight: 700;
    color: #1a1a2e;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .page-header-subject {
    font-size: 9pt;
    color: #6b7280;
  }

  /* ── Sections ── */
  .section {
    margin-bottom: 30px;
  }
  .section-title {
    font-size: 13pt;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1.5px solid #e5e7eb;
  }
  .body-text {
    font-size: 10.5pt;
    color: #374151;
    line-height: 1.75;
    margin-bottom: 10px;
  }

  /* ── Intro / Explanation highlight blocks ── */
  .highlight-block {
    background: #f0f4ff;
    border-left: 5px solid #1a1a2e;
    border-radius: 0 8px 8px 0;
    padding: 16px 20px;
    margin-bottom: 24px;
  }
  .highlight-block.explanation {
    background: #fff7ed;
    border-left-color: #e94560;
  }
  .highlight-label {
    font-size: 8.5pt;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }

  /* ── Bullet list ── */
  .bullet-list {
    list-style: none;
    margin: 8px 0 4px 0;
    padding: 0;
  }
  .bullet-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 10.5pt;
    color: #374151;
    padding: 4px 0;
    border-bottom: 0.5px solid #f3f4f6;
  }
  .bullet-list li:last-child { border-bottom: none; }
  .bullet-icon {
    color: #e94560;
    font-size: 8pt;
    margin-top: 4px;
    flex-shrink: 0;
  }

  /* ── Code block ── */
  .code-block {
    background: #0f172a;
    border-radius: 8px;
    overflow: hidden;
    margin: 12px 0;
  }
  .code-label {
    background: #1e293b;
    color: #94a3b8;
    font-size: 8.5pt;
    font-weight: 600;
    padding: 8px 16px;
    border-bottom: 1px solid #334155;
    letter-spacing: 0.5px;
  }
  .code-content {
    font-family: 'Courier New', Courier, monospace;
    font-size: 9.5pt;
    color: #e2e8f0;
    line-height: 1.7;
    padding: 16px;
    white-space: pre;
    overflow-x: auto;
  }

  /* ── Complexity table ── */
  .complexity-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin-top: 10px;
    border-radius: 8px;
    overflow: hidden;
  }
  .complexity-table thead tr {
    background: #1a1a2e;
    color: #ffffff;
  }
  .complexity-table th {
    padding: 12px 14px;
    text-align: left;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .complexity-table td {
    padding: 10px 14px;
    font-size: 10pt;
  }
  .row-even { background: #f8faff; }
  .row-odd  { background: #ffffff; }
  .algo-name { font-weight: 700; color: #1a1a2e; }
  .complexity { font-family: 'Courier New', monospace; font-weight: 600; }
  .complexity.good  { color: #15803d; }
  .complexity.avg   { color: #b45309; }
  .complexity.bad   { color: #b91c1c; }
  .complexity.space { color: #1d4ed8; }

  /* ── Two-column grid ── */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }
  .col-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 18px;
  }
  .col-card-title {
    font-size: 10pt;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e94560;
  }

  /* ── Key terms table ── */
  .terms-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    border-radius: 8px;
    overflow: hidden;
  }
  .term-row {
    display: grid;
    grid-template-columns: 180px 1fr;
    border-bottom: 1px solid #e5e7eb;
  }
  .term-row:last-child { border-bottom: none; }
  .term-even { background: #f0f4ff; }
  .term-odd  { background: #ffffff; }
  .term-name {
    padding: 10px 14px;
    font-weight: 700;
    font-size: 10pt;
    color: #1a1a2e;
    border-right: 2px solid #c7d2fe;
  }
  .term-def {
    padding: 10px 14px;
    font-size: 10pt;
    color: #374151;
    line-height: 1.6;
  }

  /* ── Real-world example callout ── */
  .example-callout {
    background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
    border: 1px solid #fcd34d;
    border-left: 5px solid #f59e0b;
    border-radius: 0 8px 8px 0;
    padding: 16px 20px;
    margin: 24px 0;
  }
  .example-callout-label {
    font-size: 8.5pt;
    font-weight: 700;
    color: #92400e;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .example-callout p {
    font-size: 10.5pt;
    color: #78350f;
    line-height: 1.7;
  }

  /* ── Summary block ── */
  .summary-block {
    background: #1a1a2e;
    color: #e2e8f0;
    border-radius: 10px;
    padding: 24px 28px;
    margin-top: 8px;
  }
  .summary-block p {
    font-size: 10.5pt;
    line-height: 1.8;
    color: #cbd5e1;
  }

  /* ── Page footer ── */
  .page-footer {
    margin-top: 40px;
    padding-top: 14px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #9ca3af;
  }

  /* ── Page break utility ── */
  .page-break { page-break-before: always; }
</style>
</head>
<body>

<!-- ════════════════════════════════════════════════════════ COVER PAGE ══ -->
<div class="cover">
  <div class="cover-badge">${esc(notes.educationType)} &nbsp;&bull;&nbsp; ${esc(notes.branch)}</div>
  <div class="cover-topic">${esc(notes.topicTitle)}</div>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    <div class="cover-meta-item">
      <span class="cover-meta-label">Subject</span>
      <span>${esc(notes.subject)}</span>
    </div>
    <div class="cover-meta-item">
      <span class="cover-meta-label">Unit</span>
      <span>${esc(notes.unit)}</span>
    </div>
    <div class="cover-meta-item">
      <span class="cover-meta-label">Document</span>
      <span>Academic Notes</span>
    </div>
  </div>
  <div class="cover-footer">
    <span class="cover-footer-text">Generated on ${generatedDate}</span>
    <span class="cover-page-num">Page 1</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════ CONTENT PAGES ══ -->
<div class="content-page">

  <!-- Page header -->
  <div class="page-header">
    <span class="page-header-title">${esc(notes.topicTitle)}</span>
    <span class="page-header-subject">${esc(notes.subject)} &nbsp;|&nbsp; ${esc(notes.unit)}</span>
  </div>

  <!-- Introduction -->
  <div class="section">
    <h2 class="section-title">&#9670; Introduction</h2>
    <div class="highlight-block">
      <div class="highlight-label">Definition &amp; Overview</div>
      <p class="body-text" style="margin:0">${esc(notes.introduction)}</p>
    </div>
  </div>

  <!-- Explanation -->
  <div class="section">
    <h2 class="section-title">&#9670; Explanation</h2>
    <div class="highlight-block explanation">
      <div class="highlight-label">Deep Dive</div>
      <p class="body-text" style="margin:0">${esc(notes.explanation)}</p>
    </div>
  </div>

  <!-- Dynamic sections -->
  ${sectionsHtml}

  <!-- Complexity table (if any) -->
  ${complexityTable(notes.complexityTable ?? [])}

  <!-- Key Points + Advantages (two column) -->
  <div class="two-col">
    <div class="col-card">
      <div class="col-card-title">&#128204; Key Points</div>
      ${bulletList(notes.keyPoints, "&#10003;")}
    </div>
    <div class="col-card">
      <div class="col-card-title">&#128077; Advantages</div>
      ${bulletList(notes.advantages, "&#10022;")}
    </div>
  </div>

  <!-- Applications -->
  <div class="section">
    <h2 class="section-title">&#9670; Real-World Applications</h2>
    ${bulletList(notes.applications, "&#10148;")}
  </div>

  <!-- Real-world example callout -->
  ${
    notes.realWorldExample
      ? `<div class="example-callout">
      <div class="example-callout-label">&#9889; Real-World Example</div>
      <p>${esc(notes.realWorldExample)}</p>
    </div>`
      : ""
  }

  <!-- Key terms (new page) -->
  <div class="page-break"></div>
  <div class="page-header">
    <span class="page-header-title">Key Terms &amp; Definitions</span>
    <span class="page-header-subject">${esc(notes.subject)} &nbsp;|&nbsp; ${esc(notes.unit)}</span>
  </div>

  <div class="section">
    <h2 class="section-title">&#9670; Key Terms &amp; Definitions</h2>
    <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-top: 10px;">
      ${keyTermsHtml}
    </div>
  </div>

  <!-- Summary -->
  <div class="section" style="margin-top: 30px;">
    <h2 class="section-title">&#9670; Summary</h2>
    <div class="summary-block">
      <p>${esc(notes.summary)}</p>
    </div>
  </div>

  <!-- Footer -->
  <div class="page-footer">
    <span>${esc(notes.subject)} &mdash; ${esc(notes.topicTitle)}</span>
    <span>Generated on ${generatedDate} &nbsp;|&nbsp; Academic Notes</span>
  </div>

</div>
</body>
</html>`;
}