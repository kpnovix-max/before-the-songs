# Before the Songs

> By dawn, one man will be a god. The other will be a monster.

A ten-chapter literary novel by **KP**.

The current edition contains Chapters One to Four. Chapter Three has its own restrained rose-and-ashoka reading palette; the reader may still choose light or dark mode.

The manuscript lives in the \`manuscript/\` folder as clean Markdown. The reading website is generated automatically, so the prose remains easy to edit in GitHub without working inside HTML.

## Repository

Recommended name: **before-the-songs**

Recommended location: **kpnovix-max/before-the-songs**

## Edit a chapter

1. Open the relevant file in \`manuscript/\`.
2. Select the pencil icon in GitHub.
3. Edit the Markdown prose.
4. Commit the change to \`main\`.

The included workflow rebuilds the mobile reading site after every commit.

## Replace the current GitHub version

Upload the contents of this package into the repository root and allow GitHub to replace files with matching names. Do not delete the repository or its settings. Commit the upload to `main`; the Pages workflow will rebuild all available chapters automatically.

## Publish with GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Commit or run the **Publish Before the Songs** workflow.
4. The site will appear at:

   \`https://kpnovix-max.github.io/before-the-songs/\`

GitHub Pages sites are normally public. Keep Pages disabled until you are comfortable making the current manuscript readable on the open internet.

## Preview locally

Run:

    npm run build

Then serve the generated \`dist/\` folder with any static web server.

## Files

- \`manuscript/\` — authoritative chapter text
- \`assets/\` — reading design and controls
- \`scripts/build.mjs\` — dependency-free Markdown site builder
- \`dist/\` — generated site, deliberately excluded from Git
- \`.github/workflows/pages.yml\` — automatic GitHub Pages publication

## Rights

Copyright © 2026 KP. All rights reserved.
