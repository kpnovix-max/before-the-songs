import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const manuscriptDir = path.join(root, "manuscript");
const distDir = path.join(root, "dist");

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
cpSync(path.join(root, "assets"), path.join(distDir, "assets"), {
  recursive: true,
});

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const renderInline = (value) =>
  escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

function renderMarkdown(markdown) {
  const blocks = markdown
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      if (block.startsWith("### ")) {
        return "<h3>" + renderInline(block.slice(4)) + "</h3>";
      }
      if (block.startsWith("> ")) {
        return "<blockquote><p>" +
          renderInline(block.replace(/^> ?/gm, "").replace(/\n/g, " ")) +
          "</p></blockquote>";
      }
      if (block === "---") return "<hr>";
      return "<p>" + renderInline(block.replace(/\n/g, " ")) + "</p>";
    })
    .join("\n");
}

function readChapter(fileName, index) {
  const source = readFileSync(path.join(manuscriptDir, fileName), "utf8");
  const lines = source.split(/\r?\n/);
  const numberLine = lines.findIndex((line) => line.startsWith("# "));
  const titleLine = lines.findIndex((line) => line.startsWith("## "));

  if (numberLine === -1 || titleLine === -1) {
    throw new Error("Missing chapter headings in " + fileName);
  }

  return {
    index,
    fileName,
    number: lines[numberLine].slice(2).trim(),
    title: lines[titleLine].slice(3).trim(),
    html: renderMarkdown(lines.slice(titleLine + 1).join("\n")),
    href: "chapter-" + (index + 1) + "/",
  };
}

const chapterFiles = readdirSync(manuscriptDir)
  .filter((file) => file.endsWith(".md"))
  .sort();

const chapters = chapterFiles.map(readChapter);

function documentShell({ pageTitle, description, className, base, content }) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0d0c0b">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="stylesheet" href="${base}assets/novel.css">
  <script src="${base}assets/reader.js" defer></script>
</head>
<body class="${className}">
  <div class="reading-progress" aria-hidden="true"><span></span></div>
  ${content}
</body>
</html>`;
}

function buildHome() {
  const chapterCards = chapters
    .map(
      (chapter, index) => `
        <a class="chapter-card" href="${chapter.href}">
          <span class="chapter-card__number">${String(index + 1).padStart(2, "0")}</span>
          <span>
            <small>${escapeHtml(chapter.number)}</small>
            <strong>${escapeHtml(chapter.title)}</strong>
          </span>
          <span class="chapter-card__arrow" aria-hidden="true">→</span>
        </a>`
    )
    .join("");

  const content = `
  <header class="site-bar">
    <a class="wordmark" href="./" aria-label="Before the Songs, home">
      <span class="wordmark__mark"></span>
      Before the Songs
    </a>
    <button class="icon-button" type="button" data-theme-toggle aria-label="Change colour theme">
      <span aria-hidden="true">◐</span>
    </button>
  </header>

  <main>
    <section class="cover" aria-labelledby="book-title">
      <div class="cover__halo" aria-hidden="true"></div>
      <div class="cover__content">
        <p class="cover__kicker">A ten-chapter novel</p>
        <h1 id="book-title"><span>Before</span><span>the Songs</span></h1>
        <div class="cover__rule" aria-hidden="true"></div>
        <p class="cover__tagline">By dawn, one man will be a god.<br>The other will be a monster.</p>
        <p class="cover__author">KP Novix</p>
        <a class="primary-link" href="${chapters[0]?.href ?? "#chapters"}">
          Begin reading <span aria-hidden="true">→</span>
        </a>
      </div>
      <p class="cover__scroll">The last night of a kingdom</p>
    </section>

    <section class="premise" aria-labelledby="premise-title">
      <p class="section-label">The novel</p>
      <h2 id="premise-title">History has already chosen its ending.</h2>
      <p>In the final hours before an army enters his city, a king sits with a wounded spy and tells the story that will not survive him.</p>
      <p>No gods. No demons. Only gifted, frightened human beings—and the explanations by which they learn to live with what they have done.</p>
    </section>

    <section class="chapters" id="chapters" aria-labelledby="chapters-title">
      <div class="chapters__heading">
        <div>
          <p class="section-label">Read</p>
          <h2 id="chapters-title">The conversation</h2>
        </div>
        <p>${chapters.length} of 10 chapters</p>
      </div>
      <div class="chapter-list">${chapterCards}</div>
    </section>
  </main>

  <footer class="site-footer">
    <span>Before the Songs</span>
    <span>© 2026 KP Novix</span>
  </footer>`;

  return documentShell({
    pageTitle: "Before the Songs — A novel by KP Novix",
    description:
      "On the last night of a kingdom, a king tells the story that history will not preserve.",
    className: "home-page",
    base: "",
    content,
  });
}

function buildChapter(chapter) {
  const previous = chapters[chapter.index - 1];
  const next = chapters[chapter.index + 1];
  const previousLink = previous
    ? `<a class="chapter-nav__link chapter-nav__link--previous" href="../${previous.href}">
         <small>Previous</small><strong>${escapeHtml(previous.title)}</strong>
       </a>`
    : `<a class="chapter-nav__link chapter-nav__link--previous" href="../">
         <small>Return</small><strong>Book cover</strong>
       </a>`;
  const nextLink = next
    ? `<a class="chapter-nav__link chapter-nav__link--next" href="../${next.href}">
         <small>Next</small><strong>${escapeHtml(next.title)}</strong>
       </a>`
    : `<span class="chapter-nav__link chapter-nav__link--next is-muted">
         <small>Next</small><strong>To be written</strong>
       </span>`;

  const content = `
  <header class="reader-bar">
    <a class="wordmark" href="../" aria-label="Before the Songs, home">
      <span class="wordmark__mark"></span>
      Before the Songs
    </a>
    <div class="reader-tools" aria-label="Reading controls">
      <button type="button" data-font="-1" aria-label="Reduce text size">A−</button>
      <button type="button" data-font="1" aria-label="Increase text size">A+</button>
      <button class="icon-button" type="button" data-theme-toggle aria-label="Change colour theme">
        <span aria-hidden="true">◐</span>
      </button>
    </div>
  </header>

  <main class="reader-main" id="main-content">
    <article class="chapter">
      <header class="chapter__header">
        <p class="chapter__number">${escapeHtml(chapter.number)}</p>
        <h1>${escapeHtml(chapter.title)}</h1>
        <div class="chapter__ornament" aria-hidden="true"><span></span></div>
      </header>
      <div class="prose">${chapter.html}</div>
      <nav class="chapter-nav" aria-label="Chapter navigation">
        ${previousLink}
        ${nextLink}
      </nav>
    </article>
  </main>

  <footer class="reader-footer">
    <a href="../">Before the Songs</a>
    <span>KP Novix</span>
  </footer>`;

  return documentShell({
    pageTitle: chapter.title + " — Before the Songs",
    description: chapter.number + ": " + chapter.title,
    className: "reader-page",
    base: "../",
    content,
  });
}

writeFileSync(path.join(distDir, "index.html"), buildHome());

for (const chapter of chapters) {
  const chapterDir = path.join(distDir, "chapter-" + (chapter.index + 1));
  mkdirSync(chapterDir, { recursive: true });
  writeFileSync(path.join(chapterDir, "index.html"), buildChapter(chapter));
}

writeFileSync(
  path.join(distDir, "404.html"),
  documentShell({
    pageTitle: "Page not found — Before the Songs",
    description: "Page not found.",
    className: "not-found-page",
    base: "",
    content:
      '<main class="not-found"><p class="section-label">404</p><h1>The story does not begin here.</h1><a class="primary-link" href="./">Return to the cover →</a></main>',
  })
);

writeFileSync(path.join(distDir, ".nojekyll"), "");
console.log("Built " + chapters.length + " chapters in " + distDir);
