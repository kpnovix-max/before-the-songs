const root = document.documentElement;
const themeButton = document.querySelector("[data-theme-toggle]");
const storedTheme = localStorage.getItem("before-the-songs-theme");

if (storedTheme === "light" || storedTheme === "dark") {
  root.dataset.theme = storedTheme;
}

themeButton?.addEventListener("click", () => {
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  localStorage.setItem("before-the-songs-theme", next);
});

const scales = [0.82, 0.88, 0.94, 1, 1.08];
let scaleIndex = Number(localStorage.getItem("before-the-songs-scale") || 1);

function applyScale() {
  scaleIndex = Math.max(0, Math.min(scales.length - 1, scaleIndex));
  root.style.setProperty("--reader-scale", scales[scaleIndex]);
  localStorage.setItem("before-the-songs-scale", String(scaleIndex));
}

document.querySelectorAll("[data-font]").forEach((button) => {
  button.addEventListener("click", () => {
    scaleIndex += Number(button.dataset.font);
    applyScale();
  });
});

applyScale();

const progress = document.querySelector(".reading-progress span");
const article = document.querySelector(".prose");

function updateProgress() {
  if (!progress || !article) return;
  const start = article.offsetTop;
  const total = article.offsetHeight - window.innerHeight;
  const read = Math.max(0, Math.min(1, (window.scrollY - start) / total));
  progress.style.transform = "scaleX(" + read + ")";
}

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();
