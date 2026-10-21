/* ============================================================
   Birthday letter — slider + petals + candle
   Everything is vanilla JS. No dependencies. Deploys anywhere.
   ============================================================ */

/* -------------------------------------------------------
   1) SLIDER
   ------------------------------------------------------- */
const slides = Array.from(document.querySelectorAll("[data-slide]"));
const dotsEl = document.getElementById("dots");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const progressBar = document.getElementById("progress-bar");
let current = 0;

// build dots
slides.forEach((_, i) => {
  const d = document.createElement("button");
  d.className = "dot";
  d.setAttribute("aria-label", `go to slide ${i + 1}`);
  d.addEventListener("click", () => goTo(i));
  dotsEl.appendChild(d);
});
const dots = Array.from(dotsEl.children);

function goTo(i) {
  if (i < 0 || i >= slides.length || i === current) return;
  slides[current].classList.remove("active");
  slides[current].classList.toggle("prev", i > current);
  slides[i].classList.remove("prev");
  slides[i].classList.add("active");
  dots[current].classList.remove("active");
  dots[i].classList.add("active");
  current = i;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
  progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
  window.dispatchEvent(new CustomEvent("slide-changed", { detail: { index: i } }));
}

function next() { goTo(current + 1); }
function prev() { goTo(current - 1); }

// init
slides[0].classList.add("active");
dots[0].classList.add("active");
prevBtn.disabled = true;
progressBar.style.width = `${(1 / slides.length) * 100}%`;

// button events
prevBtn.addEventListener("click", prev);
nextBtn.addEventListener("click", next);

document.querySelectorAll("[data-next]").forEach((b) =>
  b.addEventListener("click", next)
);
document.querySelectorAll("[data-restart]").forEach((b) =>
  b.addEventListener("click", () => goTo(0))
);

// keyboard
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
});

// swipe
let touchX = null;
window.addEventListener(
  "touchstart",
  (e) => { touchX = e.touches[0].clientX; },
  { passive: true }
);
window.addEventListener(
  "touchend",
  (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 55) (dx < 0 ? next : prev)();
    touchX = null;
  },
  { passive: true }
);

/* -------------------------------------------------------
   2) FLOATING PETALS (canvas)
   ------------------------------------------------------- */
(() => {
  const canvas = document.getElementById("petals");
  const ctx = canvas.getContext("2d");
  let w, h, petals;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const count = reduced ? 0 : (window.innerWidth < 720 ? 14 : 26);

  const colors = [
    "#ffd1dc", "#ffb6c1", "#f7c8d8", "#f4b5cd",
    "#e4c7f0", "#d9b8e8", "#ffd7a8"
  ];

  function resize() {
    w = canvas.width = window.innerWidth * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }

  function makePetal() {
    return {
      x: Math.random() * w,
      y: Math.random() * -h,
      size: (6 + Math.random() * 8) * devicePixelRatio,
      speedY: (0.4 + Math.random() * 0.9) * devicePixelRatio,
      speedX: (Math.random() - 0.5) * 0.5 * devicePixelRatio,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.03,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.55 + Math.random() * 0.4,
    };
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    for (const p of petals) {
      p.x += p.speedX + Math.sin(p.y * 0.008) * 0.5 * devicePixelRatio;
      p.y += p.speedY;
      p.rot += p.spin;
      if (p.y > h + 30) { p.y = -20; p.x = Math.random() * w; }
      drawPetal(p);
    }
    requestAnimationFrame(step);
  }

  resize();
  petals = Array.from({ length: count }, makePetal);
  window.addEventListener("resize", () => {
    resize();
    petals = Array.from({ length: count }, makePetal);
  });
  if (count > 0) step();
})();

/* -------------------------------------------------------
   3a) HERO GIFT CUBE — tap → flower petal burst → photo card blooms
   ------------------------------------------------------- */
(() => {
  const cube  = document.getElementById("hero-cube");
  const stage = document.getElementById("gift-stage");
  const card  = document.getElementById("reveal-card");
  if (!cube || !stage || !card) return;

  const bloom = () => {
    if (stage.classList.contains("bloomed")) return;
    // Big flower burst from the cube center
    flowerBurst(cube, 26);
    // Cube shrinks + fades, polaroid rises
    setTimeout(() => stage.classList.add("bloomed"), 220);
  };
  cube.addEventListener("click", bloom);
  cube.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bloom(); }
  });

  // Reset if user comes back to slide 1
  window.addEventListener("slide-changed", (e) => {
    if (e.detail && e.detail.index === 0) return; // don't reset while viewing
    setTimeout(() => stage.classList.remove("bloomed"), 800);
  });
})();

/* Flower/petal burst — larger, softer, more visual than sparkle */
function flowerBurst(anchor, count) {
  const flowers = ["🌸", "🌷", "🌺", "🌼", "🌻", "💐", "🏵️", "💮"];
  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    Object.assign(el.style, {
      position: "fixed",
      left: cx + "px",
      top: cy + "px",
      fontSize: 20 + Math.random() * 22 + "px",
      pointerEvents: "none",
      zIndex: 999,
      transition: "transform 2.2s cubic-bezier(0.15,0.7,0.3,1), opacity 2.2s ease",
      opacity: "1",
      transform: "translate(-50%, -50%) scale(0.3) rotate(0deg)",
    });
    document.body.appendChild(el);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 120 + Math.random() * 220;
    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist - 60}px)) scale(1) rotate(${Math.random() * 720 - 360}deg)`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 2300);
  }
}

/* -------------------------------------------------------
   3b) CHILDHOOD CHEST — tap to reveal photo01 with a burst
   ------------------------------------------------------- */
(() => {
  const chest = document.getElementById("chest");
  if (!chest) return;
  const wrap = chest.closest(".secret-wrap");

  const openChest = () => {
    if (chest.classList.contains("opened")) return;
    chest.classList.add("opened");
    if (wrap) setTimeout(() => wrap.classList.add("revealed"), 1000);
    sparkleBurst(chest, 22);
  };
  chest.addEventListener("click", openChest);
  chest.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openChest(); }
  });
})();

/* Shared sparkle-burst helper (used by cubes and chest) */
function sparkleBurst(anchor, count) {
  const emojis = ["✨", "💗", "🌸", "🌟", "💫", "🎀", "🌷"];
  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    Object.assign(el.style, {
      position: "fixed",
      left: cx + "px",
      top: cy + "px",
      fontSize: 14 + Math.random() * 16 + "px",
      pointerEvents: "none",
      zIndex: 999,
      transition: "transform 1.6s cubic-bezier(0.2,0.7,0.4,1), opacity 1.6s ease",
      opacity: "1",
    });
    document.body.appendChild(el);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 60 + Math.random() * 160;
    requestAnimationFrame(() => {
      el.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 40}px) rotate(${Math.random() * 360}deg)`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 1800);
  }
}

/* -------------------------------------------------------
   3) CANDLE (tap to blow out + tiny confetti)
   ------------------------------------------------------- */
(() => {
  const candle = document.getElementById("candle");
  const hint = document.getElementById("candle-hint");
  const wish = document.getElementById("candle-wish");
  if (!candle) return;

  function blow() {
    if (candle.classList.contains("out")) return;
    candle.classList.add("out");
    hint.textContent = "your wish is on its way ✨";
    wish.classList.add("show");
    burstConfetti();
  }

  candle.addEventListener("click", blow);
  candle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); blow(); }
  });

  function burstConfetti() {
    const emojis = ["💗", "✨", "🎉", "🌸", "🌟", "🎈", "💫"];
    const rect = candle.getBoundingClientRect();
    for (let i = 0; i < 18; i++) {
      const el = document.createElement("span");
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      Object.assign(el.style, {
        position: "fixed",
        left: rect.left + rect.width / 2 + "px",
        top: rect.top + "px",
        fontSize: 12 + Math.random() * 14 + "px",
        pointerEvents: "none",
        zIndex: 999,
        transition: "transform 1.6s cubic-bezier(0.2,0.7,0.4,1), opacity 1.6s ease",
        opacity: "1",
      });
      document.body.appendChild(el);
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.6;
      const dist = 80 + Math.random() * 140;
      requestAnimationFrame(() => {
        el.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 30}px) rotate(${Math.random() * 360}deg)`;
        el.style.opacity = "0";
      });
      setTimeout(() => el.remove(), 1800);
    }
  }
})();

/* -------------------------------------------------------
   4) NAME PERSONALISATION (optional URL param)
      Try: index.html?name=Gullu
   ------------------------------------------------------- */
(() => {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  if (name) {
    const el = document.getElementById("friend-name");
    if (el) el.textContent = name;
    document.title = `Happy Birthday, ${name} ♡`;
  }
})();

/* -------------------------------------------------------
   5) ASSET SECURITY — deter casual copying
   NOTE: nothing served to a browser is truly private. This
   just makes casual saving harder (right-click, drag, save
   shortcuts, dev-tools shortcuts). Determined users can
   still get the images.
   ------------------------------------------------------- */
(() => {
  // Block right-click (with a soft toast so the friend knows what happened)
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showToast("this page is a gift ♡ please don't save the pictures");
  });

  // Block drag-save on images
  document.addEventListener("dragstart", (e) => {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });

  // Block common save / view-source shortcuts
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    const meta = e.metaKey || e.ctrlKey;
    if (
      (meta && (k === "s" || k === "u" || k === "p")) ||
      (meta && e.shiftKey && (k === "i" || k === "c" || k === "j")) ||
      k === "f12"
    ) {
      e.preventDefault();
      showToast("shhh — this is a private letter ♡");
    }
  });

  // small toast
  let toastEl = null;
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  // Console message
  try {
    console.log(
      "%cthis is a private birthday page ♡",
      "font: 500 16px 'Cormorant Garamond', serif; color: #c96f83;"
    );
    console.log(
      "%cif you're inspecting this out of curiosity — welcome. be kind with what you find.",
      "font: 300 12px sans-serif; color: #6b4d5a;"
    );
  } catch {}
})();
