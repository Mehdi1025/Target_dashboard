// =============================================================
// Target OS — Génération rapport Brand / Audit (niveau Awwards)
// Nœud n8n : Code (JavaScript)
// =============================================================

const aiInput = $input.item.json;

let aiData = {};
try {
  const rawText = aiInput.content.parts[0].text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  aiData = JSON.parse(rawText);
} catch (e) {
  aiData = {
    ia_score: 0,
    analyse_site: "Analyse indisponible pour le moment.",
    forces: "—",
    faiblesses: "—",
    proposition_commerciale: "Proposition indisponible pour le moment.",
  };
}

const sheetData = $("Google Sheets Trigger").item.json;

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const entreprise = escapeHtml(sheetData.Entreprise || "Entreprise");
const slug = slugify(sheetData.Entreprise || sheetData.entreprise || "entreprise");
const prenom = escapeHtml(sheetData.Prénom || sheetData.Prenom || "");
const nom = escapeHtml(sheetData.Nom || "");
const poste = escapeHtml(sheetData.Poste || "Décideur");
const url = escapeHtml(sheetData.URL || sheetData.Url || sheetData.url || "");
const secteur = escapeHtml(sheetData.Secteur || sheetData.secteur || "—");
const score = escapeHtml(aiData.ia_score ?? "0");
const analyse = escapeHtml(aiData.analyse_site || "Analyse en cours...");
const forces = escapeHtml(aiData.forces || "—");
const faiblesses = escapeHtml(aiData.faiblesses || "—");
const proposition = escapeHtml(aiData.proposition_commerciale || "Proposition en cours...");
const contactLine = [prenom, nom].filter(Boolean).join(" ") || "Contact";

const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Brand Audit — ${entreprise}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Syne:wght@500;600;700;800&display=swap');

    :root {
      --bg: #050505;
      --bg-elevated: #0c0c0e;
      --bg-card: rgba(255, 255, 255, 0.03);
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.14);
      --text: #fafafa;
      --muted: #a1a1aa;
      --accent: #818cf8;
      --accent-2: #c084fc;
      --glow: rgba(129, 140, 248, 0.35);
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "Instrument Sans", system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    body {
      min-height: 100vh;
      overflow-x: hidden;
    }

    .noise {
      pointer-events: none;
      position: fixed;
      inset: 0;
      opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      z-index: 0;
    }

    .mesh {
      position: fixed;
      inset: 0;
      background:
        radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.18), transparent 28%),
        radial-gradient(circle at 85% 10%, rgba(168, 85, 247, 0.14), transparent 24%),
        radial-gradient(circle at 50% 100%, rgba(59, 130, 246, 0.08), transparent 30%);
      z-index: 0;
    }

    .page {
      position: relative;
      z-index: 1;
      max-width: 1120px;
      margin: 0 auto;
      padding: 56px 32px 80px;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      margin-bottom: 48px;
    }

    .eyebrow {
      font-size: 11px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 600;
    }

    .badge-live {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
      font-size: 12px;
      color: var(--muted);
    }

    .badge-live::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.8);
    }

    .hero {
      display: grid;
      grid-template-columns: 1.4fr 0.8fr;
      gap: 32px;
      align-items: end;
      padding-bottom: 40px;
      margin-bottom: 40px;
      border-bottom: 1px solid var(--border);
    }

    .hero-title {
      font-family: "Syne", sans-serif;
      font-size: clamp(42px, 7vw, 78px);
      line-height: 0.95;
      letter-spacing: -0.04em;
      font-weight: 800;
      margin: 14px 0 0;
      max-width: 12ch;
    }

    .hero-meta {
      margin-top: 22px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
      color: #d4d4d8;
      font-size: 13px;
    }

    .score-panel {
      position: relative;
      padding: 28px;
      border-radius: 28px;
      border: 1px solid var(--border-strong);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015)),
        var(--bg-elevated);
      box-shadow:
        0 30px 80px rgba(0, 0, 0, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      overflow: hidden;
    }

    .score-panel::after {
      content: "";
      position: absolute;
      inset: auto -20% -40% -20%;
      height: 120px;
      background: radial-gradient(circle, var(--glow), transparent 70%);
      filter: blur(20px);
    }

    .score-label {
      font-size: 11px;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 12px;
    }

    .score-value {
      position: relative;
      font-family: "Syne", sans-serif;
      font-size: 72px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -0.05em;
      background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 45%, #818cf8 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .score-caption {
      margin-top: 10px;
      font-size: 13px;
      color: var(--muted);
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }

    .metric {
      padding: 22px 24px;
      border-radius: 22px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      backdrop-filter: blur(12px);
    }

    .metric-label {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 10px;
    }

    .metric-value {
      font-family: "Syne", sans-serif;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .card {
      position: relative;
      padding: 32px;
      border-radius: 28px;
      border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01));
      backdrop-filter: blur(14px);
      overflow: hidden;
    }

    .card::before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    }

    .card.full { grid-column: 1 / -1; }

    .section-index {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
      font-size: 11px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: 700;
    }

    .section-index::after {
      content: "";
      width: 48px;
      height: 1px;
      background: linear-gradient(90deg, var(--accent), transparent);
    }

    .card h2 {
      margin: 0 0 16px;
      font-family: "Syne", sans-serif;
      font-size: 28px;
      line-height: 1.1;
      letter-spacing: -0.03em;
      font-weight: 700;
    }

    .card p {
      margin: 0;
      color: #d4d4d8;
      font-size: 16px;
      line-height: 1.85;
    }

    .split-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .mini-card {
      padding: 24px;
      border-radius: 22px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.02);
      min-height: 100%;
    }

    .mini-card.positive h3 { color: #86efac; }
    .mini-card.negative h3 { color: #fca5a5; }

    .mini-card h3 {
      margin: 0 0 12px;
      font-size: 12px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }

    .footer {
      margin-top: 36px;
      padding-top: 28px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      gap: 20px;
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    @media (max-width: 900px) {
      .hero, .grid, .split-card, .metrics {
        grid-template-columns: 1fr;
      }
      .page { padding: 32px 20px 64px; }
    }

    @media print {
      html, body {
        background: #050505 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .noise, .mesh { display: none; }
      .page { max-width: 100%; padding: 24px; }
      .card, .metric, .score-panel, .mini-card {
        break-inside: avoid;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="noise"></div>
  <div class="mesh"></div>

  <main class="page">
    <div class="topbar">
      <div class="eyebrow">Target OS / Executive Brand Audit</div>
      <div class="badge-live">Audit généré par IA</div>
    </div>

    <section class="hero">
      <div>
        <div class="eyebrow">Dossier stratégique</div>
        <h1 class="hero-title">${entreprise}</h1>
        <div class="hero-meta">
          <span class="pill">${contactLine}</span>
          <span class="pill">${poste}</span>
          ${url ? `<span class="pill">${url}</span>` : ""}
        </div>
      </div>

      <div class="score-panel">
        <div class="score-label">Score Awwards</div>
        <div class="score-value">${score}</div>
        <div class="score-caption">Indice de maturité brand & conversion</div>
      </div>
    </section>

    <section class="metrics">
      <div class="metric">
        <div class="metric-label">Secteur</div>
        <div class="metric-value">${secteur}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Décideur</div>
        <div class="metric-value">${contactLine}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Poste</div>
        <div class="metric-value">${poste}</div>
      </div>
    </section>

    <section class="grid">
      <article class="card full">
        <div class="section-index">01</div>
        <h2>Analyse stratégique & expérience digitale</h2>
        <p>${analyse}</p>
      </article>

      <div class="card full">
        <div class="section-index">02</div>
        <h2>Lecture concurrentielle</h2>
        <div class="split-card">
          <div class="mini-card positive">
            <h3>Forces</h3>
            <p>${forces}</p>
          </div>
          <div class="mini-card negative" data-audit-section="faiblesses">
            <h3>Axes d'amélioration</h3>
            <p>${faiblesses}</p>
          </div>
        </div>
      </div>

      <article class="card full">
        <div class="section-index">03</div>
        <h2>Recommandations commerciales</h2>
        <p>${proposition}</p>
      </article>
    </section>

    <footer class="footer">
      <span>Target OS — Brand Intelligence</span>
      <span>Confidentiel / Usage interne</span>
    </footer>
  </main>
</body>
</html>`;

return [{ json: { slug, html_rapport: htmlContent } }];
