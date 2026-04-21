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
      updateResourcesUI();
      overlay.classList.add("hidden");
      checkGameOver();
    });

    choicesEl.appendChild(btn);
  });

  overlay.classList.remove("hidden");
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
});

function showMoneyFloat(text) {
  const ref = document.getElementById("val-money");
  const rect = ref.getBoundingClientRect();
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    color: #3ae870;
    font-size: 0.95rem;
    font-weight: bold;
    font-family: inherit;
    pointer-events: none;
    z-index: 9999;
    transition: transform 1.2s ease-out, opacity 1.2s ease-out;
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
