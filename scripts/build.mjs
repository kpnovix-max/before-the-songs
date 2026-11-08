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

const chapterPlan = [
  {
    title: "The Returned Man",
    teaser:
      "He returned in one piece, hungry but satisfied with one version of the story.",
  },
  {
    title: "They Began It",
    teaser:
      "A wound enters the room before the woman who carries it, and every cause acquires an ancestor.",
  },
  {
    title: "The Guest in the Garden",
    teaser:
      "In a garden dressed in pink, even longing is washed, braided and carefully fed.",
  },
  {
    title: "The Brother Who Crossed",
    teaser:
      "A brother discovers that leaving and betraying can wear the same footprints.",
  },
  {
    title: "What Kings Owe",
    teaser:
      "A crown weighs least in ceremony and most when an ordinary life waits upon a word.",
  },
  {
    title: "A Bridge Across the Water",
    teaser:
      "Across the dark water, impossible things begin as measurements, rope and sleepless hands.",
  },
  {
    title: "The Shape of Ten Men",
    teaser:
      "A man is given many faces by those who need only one of them to be hated.",
  },
  {
    title: "The Last Honest Thing",
    teaser:
      "At the edge of defeat, mercy and pride begin to resemble one another.",
  },
  {
    title: "Four Hours Until Dawn",
    teaser:
      "The lamps burn low; four hours remain, and a king must decide what the fire will not take.",
  },
  {
    title: "Before the Songs",
    teaser:
      "Before memory makes gods and monsters, two men choose what can still be said.",
  },
];

const chapterNames = [
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

function documentShell({ pageTitle, description, className, base, content }) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#e9e0d2">
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
  const chapterCards = chapterPlan
    .map(
      (planned, index) => {
        const chapter = chapters[index];
        const tag = chapter ? "a" : "div";
        const link = chapter ? ` href="${chapter.href}"` : "";
        const stateClass = chapter ? "" : " is-forthcoming";
        const status = chapter ? `Chapter ${chapterNames[index]}` : `Chapter ${chapterNames[index]} · Forthcoming`;

        return `
        <${tag} class="chapter-card${stateClass}"${link}>
          <span class="chapter-card__number">${String(index + 1).padStart(2, "0")}</span>
          <span class="chapter-card__copy">
            <small>${status}</small>
            <strong>${escapeHtml(planned.title)}</strong>
            <span class="chapter-card__teaser">${escapeHtml(planned.teaser)}</span>
          </span>
          <span class="chapter-card__arrow" aria-hidden="true">${chapter ? "→" : "◇"}</span>
        </${tag}>`;
      }
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
        <p class="cover__author">By KP</p>
        <a class="primary-link" href="${chapters[0]?.href ?? "#chapters"}">
          Begin reading <span aria-hidden="true">→</span>
        </a>
      </div>
      <p class="cover__scroll">A kingdom before the songs</p>
    </section>

    <section class="premise" aria-labelledby="premise-title">
      <div class="premise__heading">
        <p class="section-label">The novel</p>
        <h2 id="premise-title">History has already chosen its ending.</h2>
      </div>
      <div class="premise__story">
        <p>When the songs are written, the victors will have names for everything. Courage will belong to one shore. Wickedness will belong to the other. A complicated war will be cleaned, polished and made simple enough to sing.</p>
        <p>But the songs have not yet been written.</p>
        <p>Night lies warm upon the city. Salt gathers on the palace screens. The corridors smell of sesame oil, wet stone and jasmine bruised beneath hurried feet. From the kitchens comes woodsmoke and the sweetness of coconut; from the harbour, tar, fish and rope soaked by the sea. Servants carry clean linen past wounded soldiers. Somewhere below, a carpenter is still being asked to mend a hinge—as though the palace expects another season.</p>
        <p>In an upper room, a king waits with a man who was not expected to return. Between them stand a jug of water, an unfinished meal and a report neither can afford to misunderstand.</p>
        <p>The king wants to know how the enemy intends to win.</p>
        <p>The returned man has also brought back a version of why.</p>
        <p>Their conversation follows them out of the room: through corridors where servants make way, into gardens where another life waits, towards walls that no longer keep the sounds of war outside. Night gives way to day. The lamps are lit again. Between one order and the next, there is still water to fetch, a wound to dress, someone asking where the clean cloth has gone.</p>
        <p>The king has been a scholar, musician, builder, brother, husband and ruler. He knows how to hear a fault in a string, a weakness in an argument and a hesitation in a report. He is clever enough to recognise his mistakes and human enough to rename them.</p>
        <p>Now the city needs more from him than an explanation.</p>
        <p>Beyond its walls, an enemy is building a road towards victory. Within them, cooks, physicians, soldiers and engineers continue the small practical work by which a kingdom insists upon tomorrow.</p>
        <p>There are people here who love their king. There are people with reasons not to. Some have been protected by his decisions. Others are still living inside them.</p>
        <p>Before anyone becomes a god or a monster, there is a person deciding what to do next.</p>
      </div>
    </section>

    <section class="chapters" id="chapters" aria-labelledby="chapters-title">
      <div class="chapters__heading">
        <div>
          <p class="section-label">Read</p>
          <h2 id="chapters-title">The conversation</h2>
        </div>
        <p>${chapters.length} available · 10 chapters</p>
      </div>
      <div class="chapter-list">${chapterCards}</div>
    </section>
  </main>

  <footer class="site-footer">
    <span>Before the Songs</span>
    <span>© 2026 KP</span>
  </footer>`;

  return documentShell({
    pageTitle: "Before the Songs — A novel by KP",
    description:
      "Across two nights and the day between them, a king fights for his city—and for a life the songs may never remember.",
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
    <span>KP</span>
  </footer>`;

  return documentShell({
    pageTitle: chapter.title + " — Before the Songs",
    description: chapter.number + ": " + chapter.title,
    className: `reader-page chapter-theme-${chapter.index + 1}`,
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
