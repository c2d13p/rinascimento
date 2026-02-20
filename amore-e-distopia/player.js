const STORAGE_KEY = "amore-distopia-order";

// Song list - edit these to match your actual files
const SONGS_BASE = [
  { file: "atena.mp3", label: "Atena" },
  { file: "perla-in-dono-al-mare.mp3", label: "Perla in Dono al Mare" },
  { file: "catàbasi.mp3", label: "Catàbasi" },
  {
    file: "nel-profondo-dell-universo.mp3",
    label: "Nel Profondo dell'Universo",
  },
  { file: "il-puzzle-dei-tempi.mp3", label: "Il Puzzle dei Tempi" },
  { file: "amore-e-distopia.mp3", label: "Amore e Distopia" },
  { file: "boomerang.mp3", label: "Boomerang" },
  { file: "molla-la-presa.mp3", label: "Molla la Presa" },
  {
    file: "amore-santo.mp3",
    label: "Amore Santo",
  },
  { file: "come-un-onda.mp3", label: "Come un'Onda" },
];

let songs = [];
let currentIndex = 0;
let isPlaying = false;
let dragSrcIndex = null;
let ghost = null;
let touchOffsetX = 0;
let touchOffsetY = 0;

const audio = document.getElementById("audioPlayer");
const playlist = document.getElementById("playlist");
const progressBar = document.getElementById("progressBar");
const timeElapsed = document.getElementById("timeElapsed");
const timeRemaining = document.getElementById("timeRemaining");
const nowPlayingTitle = document.getElementById("nowPlayingTitle");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");

// Load saved order from localStorage
function loadOrder() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const order = JSON.parse(saved);
      const reordered = [];
      order.forEach((file) => {
        const s = SONGS_BASE.find((x) => x.file === file);
        if (s) reordered.push(s);
      });
      // Add any new songs not in saved order
      SONGS_BASE.forEach((s) => {
        if (!reordered.find((x) => x.file === s.file)) reordered.push(s);
      });
      return reordered;
    }
  } catch (e) {}
  return [...SONGS_BASE];
}

function saveOrder() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs.map((s) => s.file)));
}

function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function renderPlaylist() {
  playlist.innerHTML = "";
  songs.forEach((song, i) => {
    const item = document.createElement("div");
    item.className = "song-item" + (i === currentIndex ? " active" : "");
    item.dataset.index = i;

    const eqVisible = i === currentIndex;
    item.innerHTML = `
      <div class="drag-handle" data-handle>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </div>
      <span class="song-num">${String(i + 1).padStart(2, "0")}</span>
      <span class="song-name">${song.label}</span>
      ${
        eqVisible
          ? `<div class="eq-bars${isPlaying ? "" : " paused"}">
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
      </div>`
          : ""
      }
    `;

    // Click to play (not on handle)
    item.addEventListener("click", (e) => {
      if (e.target.closest("[data-handle]")) return;
      if (i === currentIndex) {
        togglePlay();
      } else {
        currentIndex = i;
        loadSong(true);
      }
    });

    // Mouse drag
    item.addEventListener("dragstart", onDragStart);
    item.addEventListener("dragover", onDragOver);
    item.addEventListener("drop", onDrop);
    item.addEventListener("dragend", onDragEnd);
    item.setAttribute("draggable", "true");

    // Touch drag (handle only for mobile friendliness)
    const handle = item.querySelector("[data-handle]");
    handle.addEventListener("touchstart", onTouchStart, {
      passive: false,
    });

    playlist.appendChild(item);
  });
}

function loadSong(autoplay = false) {
  const song = songs[currentIndex];
  audio.src = `songs/${song.file}`;
  nowPlayingTitle.textContent = song.label;
  progressBar.value = 0;
  timeElapsed.textContent = "0:00";
  timeRemaining.textContent = "0:00";
  if (autoplay) {
    audio.play().catch(() => {});
    setPlaying(true);
  }
  renderPlaylist();
}

function setPlaying(state) {
  isPlaying = state;
  playIcon.style.display = state ? "none" : "";
  pauseIcon.style.display = state ? "" : "none";
  const eq = document.querySelector(".eq-bars");
  if (eq) eq.classList.toggle("paused", !state);
}

function togglePlay() {
  if (!audio.src) {
    loadSong(true);
    return;
  }
  if (isPlaying) {
    audio.pause();
    setPlaying(false);
  } else {
    audio.play().catch(() => {});
    setPlaying(true);
  }
}

playBtn.addEventListener("click", togglePlay);

document.getElementById("prevBtn").addEventListener("click", () => {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  loadSong(isPlaying);
});

document.getElementById("nextBtn").addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % songs.length;
  loadSong(isPlaying);
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressBar.value = pct;
  timeElapsed.textContent = formatTime(audio.currentTime);
  timeRemaining.textContent =
    "-" + formatTime(audio.duration - audio.currentTime);
});

audio.addEventListener("ended", () => {
  currentIndex = (currentIndex + 1) % songs.length;
  loadSong(true);
});

progressBar.addEventListener("input", () => {
  if (audio.duration) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }
});

// ── Mouse drag & drop ──────────────────────────────────────────────────
function getItemIndex(el) {
  return parseInt(el.closest(".song-item")?.dataset.index ?? -1);
}

function onDragStart(e) {
  dragSrcIndex = getItemIndex(e.currentTarget);
  e.currentTarget.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  document
    .querySelectorAll(".song-item")
    .forEach((el) => el.classList.remove("drag-over"));
  e.currentTarget.classList.add("drag-over");
}

function onDrop(e) {
  e.preventDefault();
  const destIndex = getItemIndex(e.currentTarget);
  if (dragSrcIndex === null || dragSrcIndex === destIndex) return;
  reorder(dragSrcIndex, destIndex);
}

function onDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  document
    .querySelectorAll(".song-item")
    .forEach((el) => el.classList.remove("drag-over"));
  dragSrcIndex = null;
}

// ── Touch drag ─────────────────────────────────────────────────────────
function onTouchStart(e) {
  e.preventDefault();
  const item = e.currentTarget.closest(".song-item");
  dragSrcIndex = parseInt(item.dataset.index);
  const rect = item.getBoundingClientRect();
  const touch = e.touches[0];
  touchOffsetX = touch.clientX - rect.left;
  touchOffsetY = touch.clientY - rect.top;

  ghost = document.createElement("div");
  ghost.className = "ghost-item";
  ghost.textContent = songs[dragSrcIndex].label;
  ghost.style.width = rect.width + "px";
  document.body.appendChild(ghost);

  moveGhost(touch.clientX, touch.clientY);
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);
}

function moveGhost(cx, cy) {
  ghost.style.left = cx - touchOffsetX + "px";
  ghost.style.top = cy - touchOffsetY + "px";
}

function onTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  moveGhost(touch.clientX, touch.clientY);

  document
    .querySelectorAll(".song-item")
    .forEach((el) => el.classList.remove("drag-over"));
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const item = el?.closest(".song-item");
  if (item) item.classList.add("drag-over");
}

function onTouchEnd(e) {
  const touch = e.changedTouches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const item = el?.closest(".song-item");
  const destIndex = item ? parseInt(item.dataset.index) : -1;

  ghost.remove();
  ghost = null;
  document
    .querySelectorAll(".song-item")
    .forEach((el) => el.classList.remove("drag-over"));
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);

  if (destIndex >= 0 && destIndex !== dragSrcIndex) {
    reorder(dragSrcIndex, destIndex);
  }
  dragSrcIndex = null;
}

// ── Reorder logic ───────────────────────────────────────────────────────
function reorder(from, to) {
  const currentFile = songs[currentIndex].file;
  const [moved] = songs.splice(from, 1);
  songs.splice(to, 0, moved);
  // Keep currentIndex tracking the same song
  currentIndex = songs.findIndex((s) => s.file === currentFile);
  saveOrder();
  renderPlaylist();
}

// ── Init ────────────────────────────────────────────────────────────────
songs = loadOrder();
renderPlaylist();
// Load first song (don't autoplay - browser restrictions)
if (songs.length > 0) {
  nowPlayingTitle.textContent = songs[0].label;
}
