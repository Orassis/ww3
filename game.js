const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const ISRAEL_ID     = 376;
const PALESTINE_ID  = 275; // West Bank + Gaza — merged into Israel
const IRAN_ID       = 364;

// Golan Heights approximate polygon (Israeli-controlled area)
const GOLAN_GEOJSON = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [[
      [35.63, 32.70],
      [35.62, 33.00],
      [35.68, 33.28],
      [35.78, 33.42],
      [35.92, 33.40],
      [36.00, 33.20],
      [35.98, 32.95],
      [35.90, 32.72],
      [35.75, 32.68],
      [35.63, 32.70]
    ]]
  }
};

const CAPITALS = {
  israel: { coords: [35.2163, 31.7683], name: "ירושלים" },
  iran:   { coords: [51.3890, 35.6892], name: "טהרן"    },
};

function drawMap(containerId, features, capital) {
  const container = document.getElementById(containerId);
  const w = container.clientWidth  || 400;
  const h = container.clientHeight || 400;

  const svg = d3.select(`#${containerId}`)
    .append("svg")
    .attr("viewBox", `0 0 ${w} ${h}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  svg.append("rect")
    .attr("width", w).attr("height", h)
    .attr("fill", "#b0c8d8");

  // Fit projection to bounding box of all features combined
  const collection = { type: "FeatureCollection", features };
  const projection = d3.geoMercator()
    .fitExtent([[24, 24], [w - 24, h - 24]], collection);

  const path = d3.geoPath().projection(projection);

  features.forEach(f => {
    const noStroke = f.properties && f.properties.noStroke;
    svg.append("path")
      .datum(f)
      .attr("class", "country-shape")
      .attr("d", path)
      .attr("stroke", noStroke ? "none" : null);
  });

  if (capital) {
    const [cx, cy] = projection(capital.coords);
    svg.append("circle")
      .attr("class", "capital-dot")
      .attr("cx", cx).attr("cy", cy).attr("r", 5);
    svg.append("text")
      .attr("class", "capital-label")
      .attr("x", cx + 8).attr("y", cy + 4)
      .text(capital.name);
  }
}

async function init() {
  try {
    const world = await d3.json(WORLD_URL);

    // Merge Israel + Palestine into one polygon (removes internal border)
    const merged = topojson.merge(
      world,
      world.objects.countries.geometries.filter(d => [ISRAEL_ID, PALESTINE_ID].includes(+d.id))
    );
    const israelMerged = { type: "Feature", geometry: merged };

    // Golan drawn without stroke so it blends in
    const golanNoStroke = { ...GOLAN_GEOJSON, properties: { noStroke: true } };

    const allFeatures = topojson.feature(world, world.objects.countries).features;
    const iran = allFeatures.find(d => +d.id === IRAN_ID);

    drawMap("israel-map", [israelMerged, golanNoStroke], CAPITALS.israel);
    if (iran) drawMap("iran-map", [iran], CAPITALS.iran);
  } catch (e) {
    console.error("Failed to load map data:", e);
  }
}

init();

// ── Modal logic ──
const overlay     = document.getElementById("modal-overlay");
const confirmBtn  = document.getElementById("confirm-btn");
const nameInput   = document.getElementById("player-name");
const avatarCards = document.querySelectorAll(".avatar-card");

let selectedGender = null;

document.getElementById("start-btn").addEventListener("click", () => {
  overlay.classList.remove("hidden");
});

avatarCards.forEach(card => {
  card.addEventListener("click", () => {
    avatarCards.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedGender = card.dataset.gender;
    updateConfirmBtn();
  });
});

nameInput.addEventListener("input", updateConfirmBtn);

function updateConfirmBtn() {
  confirmBtn.disabled = !(selectedGender && nameInput.value.trim().length > 0);
}

// ── Game state ──
const state = {
  money:       50000,
  popularity:  65,
  security:    70,
  nuclear:     95,
  legitimacy:  60,
  turn:        1,
  gameDate:    new Date(2026, 3, 21), // April 21 2026
};

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function updateTurnUI() {
  document.getElementById("cal-date").textContent = formatDate(state.gameDate);
  document.getElementById("cal-turn").textContent = `תור ${state.turn} | 30`;
}

function updateResourcesUI() {
  document.getElementById("val-money").textContent =
    "$" + state.money.toLocaleString("en-US");
  document.getElementById("val-popularity").textContent = state.popularity + "%";
  document.getElementById("fill-popularity").style.width = state.popularity + "%";
  document.getElementById("val-security").textContent = state.security + "%";
  document.getElementById("fill-security").style.width   = state.security + "%";
  document.getElementById("val-nuclear").textContent    = state.nuclear + "%";
  document.getElementById("fill-nuclear").style.width   = state.nuclear + "%";
  document.getElementById("val-legitimacy").textContent = state.legitimacy + "%";
  document.getElementById("fill-legitimacy").style.width = state.legitimacy + "%";
}

let playerName = "";

confirmBtn.addEventListener("click", () => {
  playerName = nameInput.value.trim();
  const gender = selectedGender;

  overlay.classList.add("hidden");

  // Show briefing screen
  const greeting = gender === "female" ? `ברוכה הבאה, ${playerName}` : `ברוך הבא, ${playerName}`;
  document.getElementById("briefing-title").textContent = greeting;
  document.getElementById("briefing-intro").textContent =
    `${playerName}, אתה עומד להיבחר לראשות ממשלת ישראל.\nתפקידך הוא לנהל את המדינה בתקופת משבר — ולהבטיח את ביטחון ישראל מול האיום האיראני.`;
  document.getElementById("briefing-overlay").classList.remove("hidden");
});

document.getElementById("briefing-start-btn").addEventListener("click", () => {
  document.getElementById("briefing-overlay").classList.add("hidden");

  // Update header
  const gender = selectedGender;
  const greeting = gender === "female" ? `ברוכה הבאה, ${playerName}` : `ברוך הבא, ${playerName}`;
  document.querySelector("h1").textContent = greeting;
  document.getElementById("subtitle").textContent = "ראש הממשלה של ישראל";

  // Show resources bar, nuclear meter, and center column
  document.getElementById("resources-bar").classList.remove("hidden");
  document.getElementById("nuclear-meter").classList.remove("hidden");
  document.getElementById("center-column").classList.remove("hidden");
  updateResourcesUI();
  updateTurnUI();

  // Replace start button with action buttons
  const bar = document.getElementById("action-bar");
  bar.innerHTML = `<div id="game-actions"></div>`;
  const gameActions = document.getElementById("game-actions");

  Object.entries(ACTION_CATEGORIES).forEach(([name, cat]) => {
    const wrap = document.createElement("div");
    wrap.className = "action-wrap";

    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.textContent = cat.icon + " " + name;

    const popup = buildActionPopup(name, cat);
    wrap.appendChild(popup);
    wrap.appendChild(btn);
    gameActions.appendChild(wrap);

    let hideTimer = null;
    const show = () => { clearTimeout(hideTimer); popup.classList.add("visible"); };
    const hideDelayed = () => { hideTimer = setTimeout(() => popup.classList.remove("visible"), 120); };

    btn.addEventListener("mouseenter", show);
    btn.addEventListener("mouseleave", hideDelayed);
    popup.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    popup.addEventListener("mouseleave", hideDelayed);
  });

  // Show first event after 5 seconds
  setTimeout(() => showEvent(firstEvent(playerName)), 5000);
});

// ── Action categories ──
const ACTION_CATEGORIES = {
  "מודיעין": {
    icon: "📋",
    choices: [
      {
        title: "ריגול לוויני",
        effects: [
          { label: "☢️ גרעין: −5%",    key: "nuclear",     delta: -5,     lowerIsBetter: true },
          { label: "💰 עלות: $8,000",   key: "money",       delta: -8000  },
        ]
      },
      {
        title: "חדירת סוכן",
        effects: [
          { label: "☢️ גרעין: −12%",   key: "nuclear",     delta: -12,    lowerIsBetter: true },
          { label: "🛡️ ביטחון: +5%",   key: "security",    delta: +5     },
          { label: "💰 עלות: $18,000",  key: "money",       delta: -18000 },
        ]
      },
      {
        title: "חיסול ממוקד",
        effects: [
          { label: "☢️ גרעין: −8%",    key: "nuclear",     delta: -8,     lowerIsBetter: true },
          { label: "🌐 לגיטימציה: −15%", key: "legitimacy", delta: -15    },
          { label: "💰 עלות: $25,000",  key: "money",       delta: -25000 },
        ]
      },
    ]
  },
  "תקיפה": {
    icon: "⚔️",
    choices: [
      {
        title: "תקיפה אווירית",
        effects: [
          { label: "☢️ גרעין: −25%",   key: "nuclear",     delta: -25,    lowerIsBetter: true },
          { label: "📣 פופולאריות: +10%", key: "popularity", delta: +10   },
          { label: "🌐 לגיטימציה: −20%", key: "legitimacy", delta: -20   },
          { label: "💰 עלות: $35,000",  key: "money",       delta: -35000 },
        ]
      },
      {
        title: "מתקפת סייבר",
        effects: [
          { label: "☢️ גרעין: −12%",   key: "nuclear",     delta: -12,    lowerIsBetter: true },
          { label: "🌐 לגיטימציה: −5%", key: "legitimacy",  delta: -5    },
          { label: "💰 עלות: $12,000",  key: "money",       delta: -12000 },
        ]
      },
      {
        title: "פעולת קומנדו",
        effects: [
          { label: "☢️ גרעין: −18%",   key: "nuclear",     delta: -18,    lowerIsBetter: true },
          { label: "🛡️ ביטחון: +8%",   key: "security",    delta: +8     },
          { label: "🌐 לגיטימציה: −10%", key: "legitimacy", delta: -10   },
          { label: "💰 עלות: $22,000",  key: "money",       delta: -22000 },
        ]
      },
    ]
  },
  "כלכלה": {
    icon: "💹",
    choices: [
      {
        title: "גיוס תרומות",
        effects: [
          { label: "💰 כסף: +$25,000",  key: "money",       delta: +25000 },
          { label: "📣 פופולאריות: −5%", key: "popularity",  delta: -5    },
        ]
      },
      {
        title: "חיזוק תעשיית הביטחון",
        effects: [
          { label: "🛡️ ביטחון: +15%",  key: "security",    delta: +15   },
          { label: "💰 עלות: $20,000",  key: "money",       delta: -20000 },
        ]
      },
      {
        title: "סנקציות על איראן",
        effects: [
          { label: "☢️ גרעין: −8%",    key: "nuclear",     delta: -8,     lowerIsBetter: true },
          { label: "🌐 לגיטימציה: +10%", key: "legitimacy", delta: +10   },
          { label: "💰 עלות: $5,000",   key: "money",       delta: -5000  },
        ]
      },
    ]
  },
  "דיפלומטיה": {
    icon: "🤝",
    choices: [
      {
        title: "שיחות ישירות",
        effects: [
          { label: "🌐 לגיטימציה: +20%", key: "legitimacy", delta: +20   },
          { label: "☢️ גרעין: −5%",    key: "nuclear",     delta: -5,     lowerIsBetter: true },
        ]
      },
      {
        title: "בניית קואליציה",
        effects: [
          { label: "🌐 לגיטימציה: +15%", key: "legitimacy", delta: +15  },
          { label: "🛡️ ביטחון: +5%",   key: "security",    delta: +5    },
          { label: "💰 עלות: $10,000",  key: "money",       delta: -10000 },
        ]
      },
      {
        title: "לחץ בינלאומי",
        effects: [
          { label: "☢️ גרעין: −10%",   key: "nuclear",     delta: -10,    lowerIsBetter: true },
          { label: "🌐 לגיטימציה: −5%", key: "legitimacy",  delta: -5    },
        ]
      },
    ]
  },
};

function buildActionPopup(categoryName, cat) {
  const popup = document.createElement("div");
  popup.className = "action-popup";

  const header = document.createElement("div");
  header.className = "action-popup-header";
  header.textContent = cat.icon + " " + categoryName;
  popup.appendChild(header);

  cat.choices.forEach(choice => {
    const item = document.createElement("button");
    item.className = "action-popup-item";

    const effectsHtml = choice.effects.map(e => {
      let cls;
      if (e.delta === 0)        cls = "effect-neu";
      else if (e.lowerIsBetter) cls = e.delta < 0 ? "effect-pos" : "effect-neg";
      else                      cls = e.delta > 0 ? "effect-pos" : "effect-neg";
      return `<span class="${cls}">${e.label}</span>`;
    }).join("");

    item.innerHTML = `
      <span class="popup-choice-title">${choice.title}</span>
      <div class="popup-choice-effects">${effectsHtml}</div>
    `;

    item.addEventListener("click", () => {
      choice.effects.forEach(e => {
        state[e.key] = Math.max(0, Math.min(
          e.key === "money" ? Infinity : 100,
          state[e.key] + e.delta
        ));
      });
      showEffectFloats(choice.effects);
      updateResourcesUI();
      popup.classList.remove("visible");
      checkGameOver();
    });

    popup.appendChild(item);
  });

  return popup;
}

// ── Events ──
function firstEvent(playerName) {
  return {
    title: "דיווח מודיעיני דחוף",
    text:
`שלום ${playerName},
ברכות על מינויך לראש ממשלת ישראל.

אחרי שנים של מתיחות — האיום האיראני הגיע לשיא.
תוכנית הגרעין מתקדמת במהירות.
הזמן אוזל.

בחר את אופן הפעולה:`,
    choices: [
      {
        title: "⚔️ תקיפה רחבה",
        desc: "מכת פתיחה עוצמתית ברחבי איראן כנגד אתרי גרעין",
        effects: [
          { label: "💰 עלות: $40,000",        key: "money",       delta: -40000 },
          { label: "📣 פופולאריות: +15%",      key: "popularity",  delta: +15   },
          { label: "☢️ גרעין: −60%",           key: "nuclear",     delta: -60,  lowerIsBetter: true },
          { label: "🌐 לגיטימציה: −40%",       key: "legitimacy",  delta: -40   },
        ]
      },
      {
        title: "🎯 תקיפה ממוקדת",
        desc: "תקיפות ממוקדות בבסיסים איראניים",
        effects: [
          { label: "💰 עלות: $25,000",         key: "money",       delta: -25000 },
          { label: "📣 פופולאריות: +5%",        key: "popularity",  delta: +5    },
          { label: "☢️ גרעין: −30%",            key: "nuclear",     delta: -30,  lowerIsBetter: true },
          { label: "🌐 לגיטימציה: −20%",        key: "legitimacy",  delta: -20   },
        ]
      },
      {
        title: "💻 תקיפות סייבר",
        desc: "תקיפות חשאיות בניסיון לצמצם את היכולות האיראניות",
        effects: [
          { label: "💰 עלות: $10,000",          key: "money",       delta: -10000 },
          { label: "📣 פופולאריות: ללא שינוי",  key: "popularity",  delta: 0     },
          { label: "☢️ גרעין: −15%",             key: "nuclear",     delta: -15,  lowerIsBetter: true },
          { label: "🌐 לגיטימציה: −5%",          key: "legitimacy",  delta: -5    },
        ]
      },
    ]
  };
}

function showEvent(event) {
  const overlay = document.getElementById("event-overlay");
  document.getElementById("event-title").textContent = event.title;
  document.getElementById("event-text").textContent  = event.text;

  const choicesEl = document.getElementById("event-choices");
  choicesEl.innerHTML = "";

  event.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";

    const effectsHtml = choice.effects.map(e => {
      let cls;
      if (e.delta === 0)           cls = "effect-neu";
      else if (e.lowerIsBetter)    cls = e.delta < 0 ? "effect-pos" : "effect-neg";
      else                         cls = e.delta > 0 ? "effect-pos" : "effect-neg";
      return `<span class="${cls}">${e.label}</span>`;
    }).join("");

    btn.innerHTML = `
      <span class="choice-title">${choice.title}</span>
      <span class="choice-desc" style="font-size:0.82rem;color:#8899aa">${choice.desc}</span>
      <div class="choice-effects">${effectsHtml}</div>
    `;

    btn.addEventListener("click", () => {
      choice.effects.forEach(e => {
        state[e.key] = Math.max(0, Math.min(
          e.key === "money" ? Infinity : 100,
          state[e.key] + e.delta
        ));
      });
      showEffectFloats(choice.effects);
      updateResourcesUI();
      overlay.classList.add("hidden");
      checkGameOver();
    });

    choicesEl.appendChild(btn);
  });

  overlay.classList.remove("hidden");
}

// ── Missile system ──
const SVG_NS = "http://www.w3.org/2000/svg";

function bezierPoint(t, p0, p1, p2) {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

function launchMissile() {
  const iranRect  = document.getElementById("iran-map").getBoundingClientRect();
  const israelRect = document.getElementById("israel-map").getBoundingClientRect();

  // Start: random point inside Iran map
  const sx = iranRect.left  + iranRect.width  * (0.25 + Math.random() * 0.5);
  const sy = iranRect.top   + iranRect.height * (0.25 + Math.random() * 0.5);

  // End: random point inside Israel map
  const ex = israelRect.left + israelRect.width  * (0.2 + Math.random() * 0.6);
  const ey = israelRect.top  + israelRect.height * (0.2 + Math.random() * 0.6);

  // Arc control point: midpoint lifted above both maps
  const cpx = (sx + ex) / 2;
  const cpy = Math.min(sy, ey) - 160;

  const layer = document.getElementById("missile-layer");

  // Path
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`);
  path.setAttribute("class", "missile-path");
  layer.appendChild(path);

  // Impact ring
  const ring = document.createElementNS(SVG_NS, "circle");
  ring.setAttribute("cx", ex);
  ring.setAttribute("cy", ey);
  ring.setAttribute("r", "18");
  ring.setAttribute("class", "impact-ring");
  layer.appendChild(ring);

  // Missile shape (points right by default, rotated by travel angle)
  const missileG = document.createElementNS(SVG_NS, "g");

  const mBody = document.createElementNS(SVG_NS, "path");
  mBody.setAttribute("d", "M -11,2.5 L 7,2.5 L 13,0 L 7,-2.5 L -11,-2.5 Z");
  mBody.setAttribute("fill", "#c8c8c8");
  mBody.setAttribute("stroke", "#808080");
  mBody.setAttribute("stroke-width", "0.5");

  const mFinTop = document.createElementNS(SVG_NS, "polygon");
  mFinTop.setAttribute("points", "-11,-2.5 -11,-8 -5,-2.5");
  mFinTop.setAttribute("fill", "#999");

  const mFinBot = document.createElementNS(SVG_NS, "polygon");
  mFinBot.setAttribute("points", "-11,2.5 -11,8 -5,2.5");
  mFinBot.setAttribute("fill", "#999");

  const mExhaust = document.createElementNS(SVG_NS, "ellipse");
  mExhaust.setAttribute("cx", "-13"); mExhaust.setAttribute("cy", "0");
  mExhaust.setAttribute("rx", "4"); mExhaust.setAttribute("ry", "2.5");
  mExhaust.setAttribute("fill", "#ff6600");
  mExhaust.setAttribute("opacity", "0.85");

  missileG.appendChild(mFinTop);
  missileG.appendChild(mFinBot);
  missileG.appendChild(mBody);
  missileG.appendChild(mExhaust);
  layer.appendChild(missileG);

  // Intercept button
  const btn = document.createElement("button");
  btn.className = "intercept-btn";
  btn.textContent = "✈️ ירוט — $1,000";
  document.body.appendChild(btn);

  let intercepted = false;
  const DURATION = 10000;
  const startTime = performance.now();

  function cleanup() {
    path.remove();
    ring.remove();
    missileG.remove();
    btn.remove();
  }

  function showExplosion(x, y) {
    const canvas = document.createElement("canvas");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:402;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const COLORS = ["#ffffff","#fff8a0","#ffdd00","#ffaa00","#ff6600","#ff3300","#cc1100"];

    const particles = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 9;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 4,
        size: 1.5 + Math.random() * 4.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1.0,
        decay: 0.018 + Math.random() * 0.028,
      });
    }

    let flashAlpha = 1.0;
    let shockR = 4;

    const removeCanvas = () => { if (canvas.parentNode) canvas.remove(); };
    setTimeout(removeCanvas, 2500); // hard fallback

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;

      // Shockwave ring
      if (shockR < 80) {
        ctx.beginPath();
        ctx.arc(x, y, shockR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,200,80,${Math.max(0, 0.7 - shockR / 80)})`;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        ctx.stroke();
        shockR += 5;
      }

      // Flash
      if (flashAlpha > 0) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 36);
        grad.addColorStop(0, `rgba(255,255,220,${flashAlpha})`);
        grad.addColorStop(1, `rgba(255,120,0,0)`);
        ctx.beginPath();
        ctx.arc(x, y, 36, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 1;
        ctx.fill();
        flashAlpha -= 0.12;
      }

      // Particles
      let alive = flashAlpha > 0 || shockR < 80;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.18;
        p.vx *= 0.96;
        p.life -= p.decay;
        if (p.life <= 0) return;

        ctx.globalAlpha = Math.min(1, p.life * 0.6);
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.6;
        ctx.stroke();

        ctx.globalAlpha = Math.min(1, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size * p.life), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      if (alive) requestAnimationFrame(frame);
      else removeCanvas();
    }

    requestAnimationFrame(frame);
  }

  let missileX = sx, missileY = sy;

  btn.addEventListener("click", () => {
    if (intercepted) return;
    intercepted = true;
    showExplosion(missileX, missileY);
    state.money = Math.max(0, state.money - 1000);
    showFloat("-$1,000", false, "val-money");
    updateResourcesUI();
    cleanup();
    checkGameOver();
  });

  function bezierTangent(t, p0, p1, p2) {
    return 2*(1-t)*(p1-p0) + 2*t*(p2-p1);
  }

  function animate(now) {
    if (intercepted) return;
    const t = Math.min((now - startTime) / DURATION, 1);
    const x = bezierPoint(t, sx, cpx, ex);
    const y = bezierPoint(t, sy, cpy, ey);

    missileX = x; missileY = y;

    const dx = bezierTangent(t, sx, cpx, ex);
    const dy = bezierTangent(t, sy, cpy, ey);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    missileG.setAttribute("transform", `translate(${x},${y}) rotate(${angle})`);

    btn.style.left = x + "px";
    btn.style.top  = y + "px";

    if (t >= 1) {
      showExplosion(ex, ey);
      cleanup();
      if (isLandHit(ex, ey)) {
        const secDmg  = Math.floor(Math.random() * 11);   // 0–10
        const legGain = Math.floor(Math.random() * 6);    // 0–5
        state.security   = Math.max(0,   state.security   - secDmg);
        state.legitimacy = Math.min(100, state.legitimacy + legGain);
        showEffectFloats([
          { key: "security",   delta: -secDmg,  lowerIsBetter: false },
          { key: "legitimacy", delta: +legGain, lowerIsBetter: false },
        ]);
        updateResourcesUI();
        checkGameOver();
      }
      return;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function isLandHit(ex, ey) {
  const israelSvg = document.querySelector("#israel-map svg");
  if (!israelSvg) return false;
  const pt = israelSvg.createSVGPoint();
  pt.x = ex;
  pt.y = ey;
  const svgPt = pt.matrixTransform(israelSvg.getScreenCTM().inverse());
  return Array.from(israelSvg.querySelectorAll(".country-shape"))
    .some(p => p.isPointInFill(svgPt));
}

function scheduleRandomAttack() {
  const baseDelay = 3000 + Math.random() * 7000; // 3–10s
  const count = Math.floor(Math.random() * 6);   // 0–5
  for (let i = 0; i < count; i++) {
    const stagger = i * (200 + Math.random() * 400); // 200–600ms between each
    setTimeout(launchMissile, baseDelay + stagger);
  }
}

// ── Game Over ──
function checkGameOver() {
  let isWin = false;
  let status, reason;

  if (state.money <= 0) {
    status = "נכשלת";
    reason = "💸 פשיטת רגל — אזל התקציב הלאומי";
  } else if (state.popularity <= 0) {
    status = "נכשלת";
    reason = "📣 אמון הציבור קרס — הודחת מתפקידך";
  } else if (state.security <= 0) {
    status = "נכשלת";
    reason = "🛡️ הביטחון הלאומי קרס — ישראל נפלה";
  } else if (state.legitimacy <= 0) {
    status = "נכשלת";
    reason = "🌐 ישראל הוקעה לחלוטין מהקהילה הבינלאומית";
  } else if (state.nuclear >= 100) {
    status = "נכשלת";
    reason = "☢️ איראן השיגה פצצה גרעינית — כישלון קטסטרופלי";
  } else if (state.turn >= 30) {
    if (state.nuclear < 30) {
      isWin = true;
      status = "ניצחת!";
      reason = "כל הכבוד — עצרת את תוכנית הגרעין האיראנית והבטחת את עתיד ישראל";
    } else {
      status = "נכשלת";
      reason = "☢️ הקדנציה הסתיימה — הגרעין האיראני עדיין מאיים";
    }
  }

  if (status) showGameOver(status, reason, isWin);
}

function showGameOver(status, reason, isWin) {
  const modal = document.getElementById("gameover-modal");
  document.getElementById("gameover-status").textContent = status;
  document.getElementById("gameover-reason").textContent = reason;
  if (isWin) modal.classList.add("win");
  else modal.classList.remove("win");
  document.getElementById("gameover-overlay").classList.remove("hidden");
  document.getElementById("next-turn-btn").disabled = true;
}

document.getElementById("restart-btn").addEventListener("click", () => location.reload());

// ── Next Turn ──
const nextTurnBtn = document.getElementById("next-turn-btn");

function enableNextTurn() {
  nextTurnBtn.disabled = false;
  nextTurnBtn.textContent = "יום הבא ←";
}

function startNextTurnCooldown() {
  nextTurnBtn.disabled = true;
  let secs = 10;
  nextTurnBtn.textContent = `המתן ${secs}s`;
  const interval = setInterval(() => {
    secs -= 1;
    if (secs <= 0) {
      clearInterval(interval);
      enableNextTurn();
    } else {
      nextTurnBtn.textContent = `המתן ${secs}s`;
    }
  }, 1000);
}

nextTurnBtn.addEventListener("click", () => {
  if (state.turn >= 30) return;
  state.turn += 1;
  state.gameDate = new Date(state.gameDate.getTime() + 86400000);

  // Nuclear +5%
  state.nuclear = Math.min(100, state.nuclear + 5);

  // Money +5000 with float animation
  state.money += 5000;
  updateResourcesUI();
  showMoneyFloat("+$5,000");

  updateTurnUI();
  checkGameOver();
  if (state.turn < 30 && state.nuclear < 100) startNextTurnCooldown();
  scheduleRandomAttack();
});

const EFFECT_ANCHOR = {
  money:      "val-money",
  popularity: "val-popularity",
  security:   "val-security",
  legitimacy: "val-legitimacy",
  nuclear:    "val-nuclear",
};

function showFloat(text, isPositive, anchorId) {
  const ref = document.getElementById(anchorId);
  if (!ref) return;
  const rect = ref.getBoundingClientRect();
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    color: ${isPositive ? "#3ae870" : "#ff5555"};
    font-size: 0.9rem;
    font-weight: bold;
    font-family: inherit;
    pointer-events: none;
    z-index: 9999;
    transition: transform 1.2s ease-out, opacity 1.2s ease-out;
    white-space: nowrap;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = "translateY(-36px)";
      el.style.opacity = "0";
    });
  });
  setTimeout(() => el.remove(), 1300);
}

function showMoneyFloat(text) {
  showFloat(text, true, "val-money");
}

function showEffectFloats(effects) {
  effects.forEach(e => {
    if (e.delta === 0) return;
    const anchor = EFFECT_ANCHOR[e.key];
    if (!anchor) return;
    const isPositive = e.lowerIsBetter ? e.delta < 0 : e.delta > 0;
    const sign = e.delta > 0 ? "+" : "";
    const label = e.key === "money"
      ? `${e.delta > 0 ? "+" : ""}$${Math.abs(e.delta).toLocaleString("en-US")}`
      : `${sign}${e.delta}%`;
    showFloat(label, isPositive, anchor);
  });
}
