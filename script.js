/* ============================================================
   For Gullu · 26 October
   Click-nav slide deck + birthday pack interactions + sound.
   Vanilla JS, no dependencies.
   ============================================================ */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------------------------------
   0) SOUND — tiny engine using Web Audio + SpeechSynthesis.
      Globally mutable with a floating speaker button.
   ------------------------------------------------------- */
const Sound = (() => {
  let muted = (localStorage.getItem("csg-muted") === "1");
  let ctx = null;
  const ensure = () => {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };

  const chime = (notes, { gain = 0.18, type = "sine" } = {}) => {
    if (muted) return;
    const ac = ensure(); if (!ac) return;
    const now = ac.currentTime;
    notes.forEach(({ freq, start, dur, g = gain }) => {
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      amp.gain.setValueAtTime(0, now + start);
      amp.gain.linearRampToValueAtTime(g, now + start + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(amp).connect(ac.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    });
  };

  // short noise burst, used for the balloon pop
  const pop = () => {
    if (muted) return;
    const ac = ensure(); if (!ac) return;
    const now = ac.currentTime;
    const buf = ac.createBuffer(1, 2048, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const amp = ac.createGain();
    amp.gain.setValueAtTime(0.25, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    src.connect(amp).connect(ac.destination);
    src.start(now);
  };

  // play a recorded audio file — unlocked on first gesture so setTimeout play works on mobile
  const audioElCache = new Map();
  const getAudioEl = (src) => {
    if (!audioElCache.has(src)) {
      const a = new Audio(src);
      a.preload = "auto";
      audioElCache.set(src, a);
    }
    return audioElCache.get(src);
  };
  const playFile = (src) =>
    new Promise((resolve, reject) => {
      if (muted) { resolve(); return; }
      const a = getAudioEl(src);
      a.currentTime = 0;
      a.volume = 0.92;
      a.onended = resolve;
      a.onerror = reject;
      a.play().catch(reject);
    });

  // speak a line — prefers a recorded clip if `voiceFile` is supplied and exists.
  const say = (text, { pitch = 1.05, rate = 0.95, voiceFile } = {}) => {
    if (muted) return;
    const fallback = () => {
      if (!("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.pitch = pitch; u.rate = rate; u.volume = 1;
        const voices = window.speechSynthesis.getVoices();
        const en = voices.find(v => /en[-_]?(US|GB|IN)/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
        if (en) u.voice = en;
        window.speechSynthesis.speak(u);
      } catch {}
    };
    if (voiceFile) {
      playFile(voiceFile).catch(() => {});
    } else {
      fallback();
    }
  };

  // happy-birthday-ish mini melody (3 ascending notes)
  const birthdayJingle = () => {
    chime([
      { freq: 523.25, start: 0.00, dur: 0.22, g: 0.18 }, // C5
      { freq: 587.33, start: 0.20, dur: 0.22, g: 0.16 }, // D5
      { freq: 659.25, start: 0.40, dur: 0.26, g: 0.18 }, // E5
      { freq: 783.99, start: 0.68, dur: 0.42, g: 0.20 }, // G5
    ], { type: "triangle" });
  };

  // a soft wish-sent chime
  const twinkle = () => {
    chime([
      { freq: 1046.50, start: 0.00, dur: 0.22, g: 0.14 }, // C6
      { freq: 1318.51, start: 0.14, dur: 0.26, g: 0.14 }, // E6
      { freq: 1567.98, start: 0.30, dur: 0.36, g: 0.16 }, // G6
    ], { type: "sine" });
  };

  // single soft blow-out puff for each candle
  const puff = () => {
    chime([{ freq: 220, start: 0, dur: 0.14, g: 0.14 }], { type: "sawtooth" });
  };

  // background music — loops softly, starts on first gesture
  const bg = new Audio("./audio/bg-music.mp3");
  bg.loop = true;
  bg.volume = 0.12;
  bg.preload = "auto";
  let bgPlaying = false;

  const playBg = () => {
    if (bgPlaying || muted) return;
    bg.play().then(() => { bgPlaying = true; }).catch(() => {});
  };

  const setMuted = (v) => {
    muted = !!v;
    localStorage.setItem("csg-muted", muted ? "1" : "0");
    if (muted) {
      if ("speechSynthesis" in window) try { window.speechSynthesis.cancel(); } catch {}
      bg.pause();
      const ve = document.getElementById("voice-hb"); if (ve) ve.pause();
    } else {
      playBg();
    }
    const btn = document.getElementById("sound-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", String(!muted));
      btn.textContent = muted ? "🔇" : "🔊";
      btn.title = muted ? "sound off — tap to enable" : "sound on — tap to mute";
    }
  };

  // Floating speaker button in the top-left
  const mountToggle = () => {
    const btn = document.createElement("button");
    btn.id = "sound-toggle";
    btn.className = "sound-toggle";
    btn.type = "button";
    btn.textContent = muted ? "🔇" : "🔊";
    btn.setAttribute("aria-label", "toggle sound");
    btn.setAttribute("aria-pressed", String(!muted));
    btn.title = muted ? "sound off — tap to enable" : "sound on — tap to mute";
    btn.addEventListener("click", () => setMuted(!muted));
    document.body.appendChild(btn);
  };
  mountToggle();

  // Try autoplay immediately; if blocked, retry on first gesture
  const tryStart = () => {
    ensure();
    playBg();
  };
  tryStart();
  const onFirstGesture = () => {
    ensure();
    playBg();
  };
  window.addEventListener("click",      onFirstGesture, { once: true, passive: true, capture: true });
  window.addEventListener("touchstart", onFirstGesture, { once: true, passive: true, capture: true });
  window.addEventListener("keydown",    onFirstGesture, { once: true, passive: true });

  // Preload voice list (some browsers populate it async)
  if ("speechSynthesis" in window) {
    try { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => {}; } catch {}
  }

  return { say, birthdayJingle, twinkle, puff, pop, setMuted, get muted() { return muted; } };
})();

/* -------------------------------------------------------
   1) SLIDE DECK
   ------------------------------------------------------- */
const slides = Array.from(document.querySelectorAll("[data-slide]"));
const prevBtn = document.getElementById("nav-prev");
const nextBtn = document.getElementById("nav-next");
const progressBar = document.getElementById("top-progress-bar");
const slideCurrent = document.getElementById("slide-current");
const slideTotal = document.getElementById("slide-total");

let current = 0;
slideTotal.textContent = String(slides.length).padStart(2, "0");

function goTo(i) {
  if (i < 0 || i >= slides.length || i === current) return;
  const dir = i > current ? 1 : -1;
  slides[current].classList.remove("active");
  slides[current].classList.toggle("prev", dir > 0);
  slides[i].classList.remove("prev");
  slides[i].classList.add("active");
  current = i;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
  slideCurrent.textContent = String(current + 1).padStart(2, "0");
  progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
  // reset scroll of the newly active slide (long ones scroll internally)
  slides[current].scrollTop = 0;
  window.dispatchEvent(new CustomEvent("slide-changed", { detail: { index: i } }));
}
function next() { goTo(current + 1); }
function prev() { goTo(current - 1); }

// init
slides[0].classList.add("active");
prevBtn.disabled = true;
progressBar.style.width = `${(1 / slides.length) * 100}%`;

prevBtn.addEventListener("click", prev);
nextBtn.addEventListener("click", next);
document.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", next));
document.querySelectorAll("[data-restart]").forEach((b) => b.addEventListener("click", () => goTo(0)));

// keyboard
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
});

// swipe (only when a touch starts outside interactive elements)
let touchX = null, touchY = null;
window.addEventListener("touchstart", (e) => {
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener("touchend", (e) => {
  if (touchX == null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx < 0 ? next : prev)();
  touchX = touchY = null;
}, { passive: true });

/* -------------------------------------------------------
   2) SPARKLE LAYER (subtle, respects reduced-motion)
   ------------------------------------------------------- */
(() => {
  const canvas = document.getElementById("sparkles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const count = reducedMotion ? 0 : (window.innerWidth < 720 ? 14 : 24);
  let w, h, dots;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }
  function makeDot() {
    const dpr = window.devicePixelRatio || 1;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: (0.6 + Math.random() * 1.4) * dpr,
      a: 0.25 + Math.random() * 0.45,
      vy: (0.08 + Math.random() * 0.22) * dpr,
      vx: (Math.random() - 0.5) * 0.1 * dpr,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.6 ? "198,161,91" : "216,167,167",
    };
  }
  function step() {
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      d.y += d.vy; d.x += d.vx; d.phase += 0.02;
      if (d.y > h + 10) { d.y = -10; d.x = Math.random() * w; }
      if (d.x < -10 || d.x > w + 10) d.x = Math.random() * w;
      const t = (Math.sin(d.phase) + 1) * 0.5;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * (0.8 + t * 0.6), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${d.hue}, ${(d.a * (0.4 + t * 0.6)).toFixed(3)})`;
      ctx.fill();
    }
    requestAnimationFrame(step);
  }
  resize();
  dots = Array.from({ length: count }, makeDot);
  window.addEventListener("resize", () => { resize(); dots = Array.from({ length: count }, makeDot); });
  if (count > 0) step();
})();

/* -------------------------------------------------------
   3) BIRTHDAY PACK · CAKE CUTTING
   ------------------------------------------------------- */
(() => {
  const cake = document.getElementById("cake");
  if (!cake) return;
  const caption = document.getElementById("cake-caption");
  const continueBtn = document.getElementById("cake-continue");

  const voiceEl = document.getElementById("voice-hb");
  const cut = () => {
    if (cake.classList.contains("cut")) return;
    cake.classList.add("cut");
    caption.textContent = "a slice for the birthday girl ✦";
    setTimeout(() => continueBtn.classList.remove("hidden"), 1200);
    // play voice directly in gesture handler — most reliable on iOS/Android
    if (!Sound.muted && voiceEl) {
      voiceEl.currentTime = 0;
      voiceEl.volume = 0.85;
      voiceEl.play().catch(() => {});
    }
    Sound.birthdayJingle();
    confettiBurst(cake, 22, ["#C6A15B", "#D8A7A7", "#702D3A", "#E4CFA2"]);
  };
  cake.addEventListener("click", cut);
  cake.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cut(); }
  });

  // reset when the user comes back to this slide after leaving
  window.addEventListener("slide-changed", (e) => {
    if (e.detail.index !== slides.indexOf(cake.closest(".slide"))) {
      setTimeout(() => {
        cake.classList.remove("cut");
        caption.textContent = "tap to cut ✦";
        continueBtn.classList.add("hidden");
      }, 800);
    }
  });
})();

/* -------------------------------------------------------
   4) BIRTHDAY PACK · CANDLES (blow out, count)
   ------------------------------------------------------- */
(() => {
  const row = document.getElementById("candles-row");
  if (!row) return;
  const candles = Array.from(row.querySelectorAll(".candle"));
  const status = document.getElementById("candles-status");
  const wishEl = document.getElementById("candle-wish-text");
  const continueBtn = document.getElementById("candle-continue");

  const update = () => {
    const out = candles.filter(c => c.classList.contains("out")).length;
    status.textContent = `${out} / ${candles.length} blown out`;
    if (out === candles.length) {
      wishEl.classList.add("show");
      setTimeout(() => continueBtn.classList.remove("hidden"), 500);
      // all out — twinkle only
      Sound.twinkle();
    }
  };

  candles.forEach((c) => {
    const blow = () => {
      if (c.classList.contains("out")) return;
      c.classList.add("out");
      update();
      sparkleBurst(c, 8, ["#ffcf72", "#fff6c4", "#C6A15B"]);
      Sound.puff();
    };
    c.addEventListener("click", blow);
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); blow(); }
    });
  });

  window.addEventListener("slide-changed", (e) => {
    if (e.detail.index !== slides.indexOf(row.closest(".slide"))) {
      setTimeout(() => {
        candles.forEach(c => c.classList.remove("out"));
        wishEl.classList.remove("show");
        continueBtn.classList.add("hidden");
        status.textContent = `0 / ${candles.length} blown out`;
      }, 800);
    }
  });
})();

/* -------------------------------------------------------
   5) BIRTHDAY PACK · BALLOONS (pop)
   ------------------------------------------------------- */
(() => {
  const stage = document.getElementById("balloons-stage");
  if (!stage) return;
  const balloons = Array.from(stage.querySelectorAll(".balloon"));
  const countEl = document.getElementById("pop-count");
  const continueBtn = document.getElementById("balloons-continue");

  const update = () => {
    const popped = balloons.filter(b => b.classList.contains("popped")).length;
    countEl.textContent = popped;
    if (popped === balloons.length) {
      setTimeout(() => continueBtn.classList.remove("hidden"), 500);
      setTimeout(() => Sound.twinkle(), 300);
    }
  };

  balloons.forEach((b) => {
    const msg = b.getAttribute("data-msg") || "✦";
    const pop = () => {
      if (b.classList.contains("popped")) return;
      b.classList.add("popped");
      // show a small floating word where the balloon was
      const rect = b.getBoundingClientRect();
      floatingWord(msg, rect.left + rect.width / 2, rect.top + rect.height / 2);
      confettiBurst(b, 14, ["#D8A7A7", "#C6A15B", "#702D3A"]);
      Sound.pop();
      update();
    };
    b.addEventListener("click", pop);
    b.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pop(); }
    });
  });

  window.addEventListener("slide-changed", (e) => {
    if (e.detail.index !== slides.indexOf(stage.closest(".slide"))) {
      setTimeout(() => {
        balloons.forEach(b => b.classList.remove("popped"));
        countEl.textContent = 0;
        continueBtn.classList.add("hidden");
      }, 800);
    }
  });
})();

/* -------------------------------------------------------
   6) Small animations: sparkle burst, confetti, floating word
   ------------------------------------------------------- */
function sparkleBurst(anchor, count, colors) {
  if (reducedMotion) return;
  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height * 0.3;
  const palette = colors || ["#C6A15B", "#D8A7A7"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.textContent = "✦";
    Object.assign(el.style, {
      position: "fixed",
      left: cx + "px",
      top: cy + "px",
      fontSize: 8 + Math.random() * 12 + "px",
      color: palette[Math.floor(Math.random() * palette.length)],
      pointerEvents: "none",
      zIndex: 60,
      transition: "transform 1.4s cubic-bezier(0.2,0.7,0.3,1), opacity 1.4s ease",
      opacity: "1",
      transform: "translate(-50%, -50%)",
    });
    document.body.appendChild(el);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 40 + Math.random() * 100;
    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist - 20}px))`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 1500);
  }
}

function confettiBurst(anchor, count, colors) {
  if (reducedMotion) return;
  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height * 0.3;
  const palette = colors || ["#C6A15B", "#D8A7A7", "#702D3A"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    Object.assign(el.style, {
      position: "fixed",
      left: cx + "px",
      top: cy + "px",
      width: 4 + Math.random() * 5 + "px",
      height: 8 + Math.random() * 8 + "px",
      background: palette[Math.floor(Math.random() * palette.length)],
      borderRadius: Math.random() < 0.5 ? "2px" : "50%",
      pointerEvents: "none",
      zIndex: 60,
      transition: "transform 1.6s cubic-bezier(0.2,0.6,0.2,1), opacity 1.6s ease",
      opacity: "1",
      transform: "translate(-50%, -50%) rotate(0deg)",
    });
    document.body.appendChild(el);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = 60 + Math.random() * 160;
    const spin = (Math.random() - 0.5) * 720;
    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist - 10}px)) rotate(${spin}deg)`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 1700);
  }
}

function floatingWord(text, x, y) {
  const el = document.createElement("span");
  el.textContent = text;
  Object.assign(el.style, {
    position: "fixed",
    left: x + "px",
    top: y + "px",
    transform: "translate(-50%, -50%)",
    fontFamily: '"Caveat", cursive',
    fontSize: "26px",
    color: "#702D3A",
    pointerEvents: "none",
    zIndex: 70,
    opacity: "1",
    transition: "transform 1.6s ease, opacity 1.6s ease",
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = "translate(-50%, calc(-50% - 60px)) rotate(-6deg)";
    el.style.opacity = "0";
  });
  setTimeout(() => el.remove(), 1700);
}

/* -------------------------------------------------------
   7) Welcome / finale buttons: little flourish on click
   ------------------------------------------------------- */
document.querySelectorAll(".slide-welcome .btn, .slide-finale .btn").forEach((btn) => {
  btn.addEventListener("click", () => confettiBurst(btn, 18, ["#C6A15B", "#D8A7A7", "#702D3A", "#E4CFA2"]));
});

/* -------------------------------------------------------
   7b) Play closing twinkle on the finale slide (no voice)
   ------------------------------------------------------- */
(() => {
  const finaleIdx = slides.findIndex(s => s.classList.contains("slide-finale"));
  if (finaleIdx === -1) return;
  let playedOnce = false;
  window.addEventListener("slide-changed", (e) => {
    if (e.detail.index === finaleIdx && !playedOnce) {
      playedOnce = true;
      setTimeout(() => Sound.twinkle(), 600);
    }
  });
})();

/* -------------------------------------------------------
   8) Asset safety — gentle deterrents
   ------------------------------------------------------- */
(() => {
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
  }

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showToast("this page is a gift — please don't save the pictures ♡");
  });
  document.addEventListener("dragstart", (e) => {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });
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

  try {
    console.log(
      "%cfor Gullu · 26 October ♡",
      "font: italic 500 16px 'Cormorant Garamond', serif; color: #702D3A;"
    );
  } catch {}
})();
