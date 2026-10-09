const STORAGE_KEY = "aubie-font-colour";
const input = document.getElementById("font-colour");
const root = document.documentElement;

function applyColour(colour) {
  root.style.setProperty("--font-colour", colour);
}

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  input.value = saved;
  applyColour(saved);
}

input.addEventListener("input", (e) => {
  applyColour(e.target.value);
  localStorage.setItem(STORAGE_KEY, e.target.value);
});
