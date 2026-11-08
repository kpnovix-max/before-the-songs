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
      if (block === "---" || block === "***") return "<hr>";
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
    "title": "The Boat That Left",
    "teaser": "Some journeys begin before anyone is ready to leave."
  },
  {
    "title": "The Other Shore",
    "teaser": "The sea had delivered them. It had promised nothing else."
  },
  {
    "title": "The Man Who Didn't Come",
    "teaser": "There are many ways to lose someone."
  },
  {
    "title": "The Names We Lost",
    "teaser": "Not everyone who disappears is gone."
  },
  {
    "title": "The House Across the Water",
    "teaser": "Some distances cannot be measured in miles."
  },
  {
    "title": "The Things They Forgot",
    "teaser": "What remains of a life when others begin telling it?"
  },
  {
    "title": "The Boat That Stayed",
    "teaser": "There are journeys made to return home, and journeys made to discover what home has become."
  },
  {
    "title": "The Unopened Door",
    "teaser": "There are things that time cannot make easier."
  },
  {
    "title": "The Children of the Island",
    "teaser": "Every generation inherits something it does not understand."
  },
  {
    "title": "The Other Song",
    "teaser": "The words were different. The melody was familiar."
  }
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
    <a class="wordmark" href="./" aria-label="After the Songs, home">
      <span class="wordmark__mark"></span>
      After the Songs
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
        <h1 id="book-title"><span>After</span><span>the Songs</span></h1>
        <div class="cover__rule" aria-hidden="true"></div>
        <p class="cover__tagline">They survived the war.<br>The truth would have to survive them.</p>
        <p class="cover__author">By KP</p>
        <a class="primary-link" href="${chapters[0]?.href ?? "#chapters"}">
          Begin reading <span aria-hidden="true">→</span>
        </a>
      </div>
      <p class="cover__scroll">A kingdom after the songs</p>
    </section>

    <section class="premise" aria-labelledby="premise-title">
      <div class="premise__heading">
        <p class="section-label">The novel</p>
        <h2 id="premise-title">Across the water, they remembered differently.</h2>
      </div>
      <div class="premise__story">
        <p>The songs had been written.</p>
        <p>They had given the brave their names, the wicked their faces, and the dead their proper places.</p>
        <p>But across the water, there were people who remembered differently.</p>
        <p>There are things the sea does not return.</p>
        <p>A sandal washed from a child’s foot. A wooden toy that slips between the planks of a boat. The sound of a familiar voice calling from another room. A house with its lamps still burning, though nobody who lived there will ever see it again.</p>
        <p>And there are things the sea carries to the other shore.</p>
        <p>Children who have forgotten their names. Women clutching bundles of clothing that belong to people who did not come. Men who can no longer remember whether they were brave. A little girl who has been told she is safe, and who cannot understand why everyone keeps saying it.</p>
        <p>The boats have arrived.</p>
        <p>The fires are far away now. Salt dries upon the children’s faces. Wet clothes hang between trees whose names nobody knows. Someone is boiling water. Someone is counting the living. Someone has begun to sing, very softly, because there is a child who will not sleep.</p>
        <p>The girl listens.</p>
        <p>She has been listening for something else.</p>
        <p>There was a time when she knew exactly where she belonged. She knew the sounds of her home, the smell of its corridors after rain, the particular footsteps that meant someone she loved had returned. She knew which questions would make him laugh, and which ones would make him put aside his work and listen.</p>
        <p>Now she knows very little.</p>
        <p>The years will give her other things. A place to live. People to love. Ordinary mornings. The small consolations by which a life becomes possible again.</p>
        <p>And stories.</p>
        <p>Stories of the city that burned. Stories of those who escaped. Stories of those who stayed. Stories of things that happened, and things that might have happened, and things that everyone eventually agrees must have happened.</p>
        <p>Some will be told in anger.</p>
        <p>Some in gratitude.</p>
        <p>Some simply because the children ask.</p>
        <p>The girl will remember more than most. She will also forget things. There will be days when she is certain of something she cannot prove, and days when a familiar memory changes without her noticing.</p>
        <p>For now, none of that matters.</p>
        <p>She is fourteen years old.</p>
        <p>She has survived the end of one world.</p>
        <p>She does not yet know how many others will be made from it.</p>
      </div>
    </section>

    <section class="chapters" id="chapters" aria-labelledby="chapters-title">
      <div class="chapters__heading">
        <div>
          <p class="section-label">Read</p>
          <h2 id="chapters-title">The chapters</h2>
        </div>
        <p>${chapters.length} available · 10 chapters</p>
      </div>
      <div class="chapter-list">${chapterCards}</div>
    </section>
  </main>

  <footer class="site-footer">
    <span>After the Songs</span>
    <span>© 2026 KP</span>
  </footer>`;

  return documentShell({
    pageTitle: "After the Songs — A novel by KP",
    description:
      "A girl survives the crossing. The stories of what was lost are only beginning.",
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
    <a class="wordmark" href="../" aria-label="After the Songs, home">
      <span class="wordmark__mark"></span>
      After the Songs
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
    <a href="../">After the Songs</a>
    <span>KP</span>
  </footer>`;

  return documentShell({
    pageTitle: chapter.title + " — After the Songs",
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
    pageTitle: "Page not found — After the Songs",
    description: "Page not found.",
    className: "not-found-page",
    base: "",
    content:
      '<main class="not-found"><p class="section-label">404</p><h1>The story does not begin here.</h1><a class="primary-link" href="./">Return to the cover →</a></main>',
  })
);

writeFileSync(path.join(distDir, ".nojekyll"), "");
console.log("Built " + chapters.length + " chapters in " + distDir);
