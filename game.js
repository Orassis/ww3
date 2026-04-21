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

let israelProjection = null;

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

  if (containerId === "israel-map") israelProjection = projection;

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
  money:         50000,
  popularity:    65,
  security:      70,
  nuclear:       95,
  legitimacy:    60,
  turn:          1,
  gameDate:      new Date(2026, 3, 21),
  arrowBattery:  false,
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
  document.getElementById("val-popularity").classList.toggle("critical-blink", state.popularity <= 10);

  document.getElementById("val-security").textContent = state.security + "%";
  document.getElementById("fill-security").style.width = state.security + "%";
  document.getElementById("val-security").classList.toggle("critical-blink", state.security <= 10);

  document.getElementById("val-legitimacy").textContent = state.legitimacy + "%";
  document.getElementById("fill-legitimacy").style.width = state.legitimacy + "%";
  document.getElementById("val-legitimacy").classList.toggle("critical-blink", state.legitimacy <= 10);

  const nucEl = document.getElementById("val-nuclear");
  nucEl.textContent = state.nuclear + "%";
  document.getElementById("fill-nuclear").style.width = state.nuclear + "%";
  nucEl.classList.toggle("critical-blink", state.nuclear >= 90);
  nucEl.classList.toggle("nuclear-safe",   state.nuclear <= 30 && state.nuclear < 90);
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

  // Show resources bar, nuclear meter, center column, arrow system
  document.getElementById("resources-bar").classList.remove("hidden");
  document.getElementById("nuclear-meter").classList.remove("hidden");
  document.getElementById("center-column").classList.remove("hidden");
  document.getElementById("arrow-system").classList.add("visible");
  document.getElementById("arrow-buy-btn").classList.remove("hidden");
  updateResourcesUI();
  updateTurnUI();
  initArrowSystem();

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

function showArrowBatteries() {
  if (!israelProjection) return;
  const svg = d3.select("#israel-map svg");
  const sites = [
    { coords: [35.08, 32.82], label: "צפון" },
    { coords: [34.90, 32.08], label: "מרכז" },
    { coords: [34.79, 31.25], label: "דרום"  },
  ];
  sites.forEach(({ coords, label }) => {
    const [cx, cy] = israelProjection(coords);
    const g = svg.append("g").attr("class", "arrow-battery-marker");
    // Radar dish base
    g.append("rect")
      .attr("x", cx - 5).attr("y", cy - 2)
      .attr("width", 10).attr("height", 5)
      .attr("rx", 1).attr("fill", "#2a4a7a");
    // Dish arc
    g.append("path")
      .attr("d", `M${cx-7},${cy-2} A7,7 0 0,1 ${cx+7},${cy-2}`)
      .attr("fill", "none")
      .attr("stroke", "#4a9ae8")
      .attr("stroke-width", 2);
    // Beam line
    g.append("line")
      .attr("x1", cx).attr("y1", cy - 9)
      .attr("x2", cx).attr("y2", cy - 2)
      .attr("stroke", "#4a9ae8").attr("stroke-width", 1.5);
    // Label
    g.append("text")
      .attr("x", cx).attr("y", cy + 12)
      .attr("text-anchor", "middle")
      .attr("font-size", "7px")
      .attr("fill", "#7ab8e8")
      .attr("font-family", "inherit")
      .text("🛡 " + label);
  });
}

// ── Arrow battery ──
function initArrowSystem() {
  const btn     = document.getElementById("arrow-buy-btn");
  const warning = document.getElementById("arrow-warning");
  const popup   = document.getElementById("arrow-popup");

  let hideTimer = null;
  const show = () => { clearTimeout(hideTimer); popup.classList.add("visible"); };
  const hide = () => { hideTimer = setTimeout(() => popup.classList.remove("visible"), 120); };
  btn.addEventListener("mouseenter", show);
  btn.addEventListener("mouseleave", hide);
  popup.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  popup.addEventListener("mouseleave", hide);

  btn.addEventListener("click", () => {
    if (state.money < 40000) return;
    state.money -= 40000;
    state.arrowBattery = true;
    btn.disabled = true;
    popup.classList.remove("visible");
    warning.classList.add("hidden");
    showFloat("-$40,000", false, "val-money");
    updateResourcesUI();
    showArrowBatteries();
  });
}

// ── Action categories ──
const ACTION_CATEGORIES = {
  "עורף הישראלי": {
    icon: "🏘️",
    choices: [
      {
        title: "קמפיין תקשורתי",
        effects: [
          { label: "📣 פופולאריות: +10%", key: "popularity",  delta: +10    },
          { label: "💰 עלות: $10,000",    key: "money",       delta: -10000 },
        ]
      },
      {
        title: "שיקום זירות נפילה",
        effects: [
          { label: "🛡️ ביטחון: +10%",    key: "security",    delta: +10    },
          { label: "💰 עלות: $7,000",     key: "money",       delta: -7000  },
        ]
      },
      {
        title: "מצב חירום בעורף",
        effects: [
          { label: "📣 פופולאריות: −30%", key: "popularity",  delta: -30    },
          { label: "🛡️ ביטחון: +20%",    key: "security",    delta: +20    },
        ]
      },
    ]
  },
  "תקיפה": {
    icon: "⚔️",
    choices: [
      {
        title: "תקיפה אווירית רחבה",
        animation: "wideStrike",
        successChance: 70,
        onSuccess: [
          { label: "☢️ גרעין: −25%",     key: "nuclear",    delta: -25,    lowerIsBetter: true },
          { label: "📣 פופולאריות: +10%", key: "popularity", delta: +10   },
          { label: "🌐 לגיטימציה: −20%", key: "legitimacy", delta: -20   },
          { label: "💰 עלות: $35,000",   key: "money",      delta: -35000 },
        ],
        onFail: [
          { label: "☢️ גרעין: ללא שינוי",  key: "nuclear",    delta: 0     },
          { label: "📣 פופולאריות: −10%",  key: "popularity", delta: -10   },
          { label: "🌐 לגיטימציה: −5%",   key: "legitimacy", delta: -5    },
          { label: "💰 עלות: $35,000",    key: "money",      delta: -35000 },
        ]
      },
      {
        title: "חיסול ממוקד",
        animation: "targetedStrike",
        successChance: 90,
        onSuccess: [
          { label: "💰 עלות: $12,000",   key: "money",      delta: -12000 },
          { label: "📣 פופולאריות: +5%", key: "popularity", delta: +5    },
          { label: "☢️ גרעין: −15%",    key: "nuclear",    delta: -15,   lowerIsBetter: true },
          { label: "🌐 לגיטימציה: −10%", key: "legitimacy", delta: -10   },
        ],
        onFail: [
          { label: "💰 עלות: $12,000",   key: "money",      delta: -12000 },
          { label: "📣 פופולאריות: −5%", key: "popularity", delta: -5    },
          { label: "☢️ גרעין: ללא שינוי", key: "nuclear",   delta: 0     },
          { label: "🌐 לגיטימציה: −5%",  key: "legitimacy", delta: -5    },
        ]
      },
      {
        title: "טיל יריחו",
        successChance: 100,
        onSuccess: [
          { label: "💰 עלות: $20,000",   key: "money",      delta: -20000 },
          { label: "☢️ גרעין: −10%",    key: "nuclear",    delta: -10,   lowerIsBetter: true },
          { label: "🌐 לגיטימציה: −10%", key: "legitimacy", delta: -10   },
        ],
        onFail: []
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

    const hasChance = choice.successChance != null;

    function effectsHtml(effects) {
      return effects.map(e => {
        let cls;
        if (e.delta === 0)        cls = "effect-neu";
        else if (e.lowerIsBetter) cls = e.delta < 0 ? "effect-pos" : "effect-neg";
        else                      cls = e.delta > 0 ? "effect-pos" : "effect-neg";
        return `<span class="${cls}">${e.label}</span>`;
      }).join("");
    }

    if (hasChance) {
      const chanceColor = choice.successChance === 100 ? "#4caf50" : choice.successChance >= 80 ? "#8bc34a" : "#ff9800";
      item.innerHTML = `
        <div class="popup-choice-header">
          <span class="popup-choice-title">${choice.title}</span>
          <span class="popup-chance" style="color:${chanceColor}">✦ ${choice.successChance}% הצלחה</span>
        </div>
        <div class="popup-chance-cols">
          <div class="popup-chance-col">
            <div class="popup-chance-label success-label">✅ הצלחה</div>
            <div class="popup-choice-effects">${effectsHtml(choice.onSuccess)}</div>
          </div>
          ${choice.onFail.length ? `<div class="popup-chance-col">
            <div class="popup-chance-label fail-label">❌ כישלון</div>
            <div class="popup-choice-effects">${effectsHtml(choice.onFail)}</div>
          </div>` : ""}
        </div>
      `;
    } else {
      item.innerHTML = `
        <span class="popup-choice-title">${choice.title}</span>
        <div class="popup-choice-effects">${effectsHtml(choice.effects)}</div>
      `;
    }

    item.addEventListener("click", () => {
      let effects;
      if (hasChance) {
        const success = Math.random() * 100 < choice.successChance;
        effects = success ? choice.onSuccess : choice.onFail;
      } else {
        effects = choice.effects;
      }
      effects.forEach(e => {
        if (e.delta === 0) return;
        state[e.key] = Math.max(0, Math.min(
          e.key === "money" ? Infinity : 100,
          state[e.key] + e.delta
        ));
      });
      if (choice.animation === "wideStrike")     launchAirStrike(5, 10, 15);
      if (choice.animation === "targetedStrike") launchAirStrike(1, 1, 3);
      showEffectFloats(effects);
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
        animation: "waveStrike",
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
        animation: "wideStrike",
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
      if (choice.animation === "waveStrike") launchWaveStrike(3, 5, 1, 3);
      if (choice.animation === "wideStrike") launchAirStrike(5, 5, 15);
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

function bezierTangentGlobal(t, p0, p1, p2) {
  return 2*(1-t)*(p1-p0) + 2*t*(p2-p1);
}

// ── Air strike animation ──
function createJetGroup() {
  const g = document.createElementNS(SVG_NS, "g");
  // Swept delta wings
  const wings = document.createElementNS(SVG_NS, "polygon");
  wings.setAttribute("points", "3,0 -1,-10 -8,-3 -8,3 -1,10");
  wings.setAttribute("fill", "#3a3f42");
  // Fuselage
  const body = document.createElementNS(SVG_NS, "polygon");
  body.setAttribute("points", "12,0 0,2.5 -2,0 0,-2.5");
  body.setAttribute("fill", "#525c62");
  // Tail fins
  const tail = document.createElementNS(SVG_NS, "polygon");
  tail.setAttribute("points", "-2,0 -7,-5 -9,-1 -9,1 -7,5");
  tail.setAttribute("fill", "#3a3f42");
  // Canopy highlight
  const canopy = document.createElementNS(SVG_NS, "ellipse");
  canopy.setAttribute("cx", "5"); canopy.setAttribute("cy", "0");
  canopy.setAttribute("rx", "3"); canopy.setAttribute("ry", "1.2");
  canopy.setAttribute("fill", "#7ab0cc");
  canopy.setAttribute("opacity", "0.7");
  // Engine afterburner
  const exhaust = document.createElementNS(SVG_NS, "ellipse");
  exhaust.setAttribute("cx", "-10"); exhaust.setAttribute("cy", "0");
  exhaust.setAttribute("rx", "3"); exhaust.setAttribute("ry", "1.5");
  exhaust.setAttribute("fill", "#ff6010");
  g.appendChild(wings); g.appendChild(body); g.appendChild(tail);
  g.appendChild(canopy); g.appendChild(exhaust);
  return g;
}

function showMushroomCloud(cx, cy) {
  const W = 90, H = 120;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = `position:fixed;left:${cx - W/2}px;top:${cy - H + 12}px;pointer-events:none;z-index:450`;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const t0 = performance.now(), DUR = 4000;
  let done = false;

  // Billowing cloud bubble helper
  function cloudBubble(x, y, r, inner, outer, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0,   `rgba(${inner},${alpha})`);
    g.addColorStop(0.5, `rgba(${outer},${alpha * 0.7})`);
    g.addColorStop(1,   `rgba(${outer},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function frame(now) {
    const t = Math.min((now - t0) / DUR, 1);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = t > 0.75 ? Math.max(0, 1 - (t - 0.75) / 0.25) : 1;
    const bx = W / 2, by = H - 6;

    // 1. Ground shockwave ring
    if (t < 0.25) {
      const rt = t / 0.25;
      ctx.strokeStyle = `rgba(255,180,60,${0.7 * (1 - rt)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(bx, by, rt * 30, rt * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Stem — widens at base, narrows then widens at cap
    const stemT = Math.min(t * 2.5, 1);
    const sH = stemT * H * 0.58;
    const sTopY = by - sH;
    const stemAlpha = Math.max(0, 0.75 - t * 0.35);
    for (let sy = by; sy > sTopY; sy -= 3) {
      const frac = (by - sy) / sH;
      // waist shape: wide at bottom, narrow in middle, wide at top
      const waist = 1 - Math.sin(frac * Math.PI) * 0.55;
      const sw = (4 + stemT * 6) * waist;
      const heat = 1 - frac;
      const r2 = Math.round(180 + heat * 60);
      const g2 = Math.round(90 + heat * 50);
      ctx.fillStyle = `rgba(${r2},${g2},50,${stemAlpha * (0.5 + heat * 0.5)})`;
      ctx.fillRect(bx - sw/2, sy - 3, sw, 4);
    }

    // 3. Base fireball
    const fbT = Math.max(0, 1 - t * 1.6);
    if (fbT > 0) {
      cloudBubble(bx, by - 4, 14 + stemT * 8, "255,240,100", "255,110,0", fbT * 0.9);
      cloudBubble(bx - 6, by - 2, 9, "255,200,60", "220,80,0", fbT * 0.7);
      cloudBubble(bx + 7, by - 3, 8, "255,220,80", "200,70,0", fbT * 0.65);
    }

    // 4. Mushroom cap — billowing bubbles
    const capT = Math.max(0, Math.min((t - 0.1) * 1.8, 1));
    const capY = sTopY;
    const capR = capT * W * 0.38;
    if (capR > 4) {
      const ca = Math.max(0, 0.82 - t * 0.38);
      // dark outer smoke ring
      cloudBubble(bx,      capY,       capR,       "90,65,50",  "60,45,40",  ca * 0.9);
      cloudBubble(bx - capR*0.55, capY + capR*0.1, capR*0.65, "100,70,50", "65,48,40", ca * 0.8);
      cloudBubble(bx + capR*0.55, capY + capR*0.1, capR*0.65, "100,70,50", "65,48,40", ca * 0.8);
      cloudBubble(bx - capR*0.3,  capY - capR*0.3, capR*0.6,  "150,90,50", "90,60,40", ca * 0.85);
      cloudBubble(bx + capR*0.3,  capY - capR*0.3, capR*0.6,  "150,90,50", "90,60,40", ca * 0.85);
      // inner fire core
      const fireT = Math.max(0, 1 - t * 1.3);
      if (fireT > 0) {
        cloudBubble(bx, capY + capR*0.15, capR*0.45, "255,160,40", "200,90,20", fireT * ca);
      }
      // top crown puffs
      cloudBubble(bx,           capY - capR*0.45, capR*0.5,  "75,58,48", "55,42,38", ca * 0.7);
      cloudBubble(bx - capR*0.4, capY - capR*0.2,  capR*0.42, "80,62,50", "58,45,40", ca * 0.65);
      cloudBubble(bx + capR*0.4, capY - capR*0.2,  capR*0.42, "80,62,50", "58,45,40", ca * 0.65);
    }

    ctx.globalAlpha = 1;
    if (t < 1) requestAnimationFrame(frame);
    else { done = true; canvas.remove(); }
  }

  requestAnimationFrame(frame);
  setTimeout(() => { if (!done) canvas.remove(); }, DUR + 1000);
}

function launchAirStrike(numJets, minTargets, maxTargets) {
  const israelEl = document.getElementById("israel-map");
  const iranEl   = document.getElementById("iran-map");
  if (!israelEl || !iranEl) return;

  const iRect = israelEl.getBoundingClientRect();
  const nRect = iranEl.getBoundingClientRect();
  const ox = iRect.left + iRect.width / 2, oy = iRect.top + iRect.height / 2;
  const iran_cx = nRect.left + nRect.width / 2, iran_cy = nRect.top + nRect.height / 2;
  const ddx = iran_cx - ox, ddy = iran_cy - oy;
  const mainLen = Math.hypot(ddx, ddy);
  const perpX = -ddy / mainLen, perpY = ddx / mainLen;

  const totalTargets = minTargets + Math.floor(Math.random() * (maxTargets - minTargets + 1));
  const allTargets = [];
  for (let i = 0; i < totalTargets; i++) {
    const pt = randomPointOnMap("iran-map");
    if (pt) allTargets.push(pt);
  }
  if (allTargets.length === 0) return;

  const jetTargets = Array.from({ length: numJets }, () => []);
  allTargets.forEach((pt, i) => jetTargets[i % numJets].push(pt));

  const SPREAD = numJets > 1 ? 14 : 0;
  const svg = document.getElementById("missile-layer");
  const jets = [];
  for (let i = 0; i < numJets; i++) { const j = createJetGroup(); svg.appendChild(j); jets.push(j); }

  const APPROACH = 3400, SEG = 600, RETURN = 3000;
  let cleaned = false, doneCnt = 0;
  function cleanup() { if (cleaned) return; cleaned = true; jets.forEach(j => j.remove()); }

  function posJet(jet, x, y, dx, dy) {
    jet.setAttribute("transform", `translate(${x},${y}) rotate(${Math.atan2(dy, dx) * 180 / Math.PI})`);
  }

  // Smooth bezier arc between two points with explicit control point
  function animBez(jet, sx, sy, cpx, cpy, ex, ey, dur, cb) {
    const s = performance.now();
    function frame(now) {
      const t = Math.min((now - s) / dur, 1);
      posJet(jet,
        bezierPoint(t, sx, cpx, ex), bezierPoint(t, sy, cpy, ey),
        bezierTangentGlobal(t, sx, cpx, ex), bezierTangentGlobal(t, sy, cpy, ey));
      if (t < 1) requestAnimationFrame(frame); else cb?.();
    }
    requestAnimationFrame(frame);
  }

  // Banking curve between targets (perpendicular control point)
  function animSeg(jet, fx, fy, tx, ty, dur, cb) {
    const dx2 = tx-fx, dy2 = ty-fy, len = Math.hypot(dx2,dy2)||1;
    const cpx = (fx+tx)/2 + (-dy2/len)*len*0.22;
    const cpy = (fy+ty)/2 + ( dx2/len)*len*0.22;
    function eio(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
    const s = performance.now();
    function frame(now) {
      const raw = Math.min((now - s) / dur, 1), t = eio(raw);
      posJet(jet,
        bezierPoint(t, fx, cpx, tx), bezierPoint(t, fy, cpy, ty),
        bezierTangentGlobal(t, fx, cpx, tx), bezierTangentGlobal(t, fy, cpy, ty));
      if (raw < 1) requestAnimationFrame(frame); else cb?.();
    }
    requestAnimationFrame(frame);
  }

  // Each jet: ONE continuous bezier Israel→(iran center as CP)→first target — zero stop
  jets.forEach((jet, i) => {
    const off = (i - (numJets-1)/2) * SPREAD;
    const sx = ox + perpX*off, sy = oy + perpY*off;
    const cpx = iran_cx + perpX*off, cpy = iran_cy + perpY*off;
    const tgts = jetTargets[i] || [];
    if (!tgts.length) { doneCnt++; return; }

    function doNext(ti, fx, fy) {
      if (ti >= tgts.length) {
        // Return: bezier through iran_center back to Israel origin — also zero stop
        animBez(jet, fx, fy, cpx, cpy, sx, sy, RETURN, () => {
          if (++doneCnt >= numJets) cleanup();
        });
        return;
      }
      const tgt = tgts[ti];
      animSeg(jet, fx, fy, tgt.x, tgt.y, SEG, () => {
        showMushroomCloud(tgt.x, tgt.y);
        doNext(ti+1, tgt.x, tgt.y);
      });
    }

    // Stagger jets slightly so they peel off in sequence, not in lockstep
    setTimeout(() => {
      animBez(jet, sx, sy, cpx, cpy, tgts[0].x, tgts[0].y, APPROACH, () => {
        showMushroomCloud(tgts[0].x, tgts[0].y);
        doNext(1, tgts[0].x, tgts[0].y);
      });
    }, i * 180);
  });

  const maxDur = APPROACH + (maxTargets+2)*SEG + numJets*180 + RETURN + 5000;
  setTimeout(cleanup, maxDur);
}

function launchWaveStrike(waves, jetsPerWave, minPerJet, maxPerJet, waveDelay = 2500) {
  for (let w = 0; w < waves; w++) {
    setTimeout(() => launchAirStrike(jetsPerWave, minPerJet * jetsPerWave, maxPerJet * jetsPerWave), w * waveDelay);
  }
}

function launchMissile() {
  const iranRect  = document.getElementById("iran-map").getBoundingClientRect();
  const israelRect = document.getElementById("israel-map").getBoundingClientRect();

  // Start: random point on Iran landmass
  const iranPt = randomPointOnMap("iran-map");
  const sx = iranPt.x, sy = iranPt.y;

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

  // Intercept button — only shown if Arrow battery is active
  const btn = document.createElement("button");
  btn.className = "intercept-btn";
  btn.textContent = "✈️ ירוט — $1,000";
  if (!state.arrowBattery) btn.style.display = "none";
  document.body.appendChild(btn);

  let intercepted = false;
  let cleaned = false;
  const DURATION = 10000;
  const startTime = performance.now();

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    path.remove();
    ring.remove();
    missileG.remove();
    btn.remove();
  }

  // Guaranteed cleanup even if rAF pauses (tab not focused)
  setTimeout(cleanup, DURATION + 2000);

  function showExplosion(x, y) {
    const canvas = document.createElement("canvas");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:402;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const COLORS = ["#ffffff","#fff8a0","#ffdd00","#ffaa00","#ff6600","#ff3300","#cc1100"];

    const particles = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        size: 1 + Math.random() * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1.0,
        decay: 0.03 + Math.random() * 0.04,
      });
    }

    let flashAlpha = 0.8;
    let shockR = 4;

    const removeCanvas = () => { if (canvas.parentNode) canvas.remove(); };
    setTimeout(removeCanvas, 2500); // hard fallback

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;

      // Shockwave ring
      if (shockR < 45) {
        ctx.beginPath();
        ctx.arc(x, y, shockR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,200,80,${Math.max(0, 0.7 - shockR / 45)})`;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.stroke();
        shockR += 4;
      }

      // Flash
      if (flashAlpha > 0) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 20);
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

function randomPointOnMap(mapId) {
  const mapEl = document.getElementById(mapId);
  const svg   = mapEl.querySelector("svg");
  if (!svg) return null;

  const paths = Array.from(svg.querySelectorAll(".country-shape"));
  if (!paths.length) return null;

  const ctm = svg.getScreenCTM();

  // Work entirely in SVG coordinate space — getBBox() is accurate here
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  paths.forEach(p => {
    const bb = p.getBBox();
    minX = Math.min(minX, bb.x);         minY = Math.min(minY, bb.y);
    maxX = Math.max(maxX, bb.x + bb.width); maxY = Math.max(maxY, bb.y + bb.height);
  });

  const pt = svg.createSVGPoint();
  for (let i = 0; i < 120; i++) {
    pt.x = minX + Math.random() * (maxX - minX);
    pt.y = minY + Math.random() * (maxY - minY);
    if (paths.some(p => p.isPointInFill(pt))) {
      const vp = pt.matrixTransform(ctm);
      return { x: vp.x, y: vp.y };
    }
  }
  // fallback: centroid of bounding box
  pt.x = (minX + maxX) / 2; pt.y = (minY + maxY) / 2;
  const vp = pt.matrixTransform(ctm);
  return { x: vp.x, y: vp.y };
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
