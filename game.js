const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const ISRAEL_ID = 376;
const IRAN_ID = 364;

const CAPITALS = {
  [ISRAEL_ID]: { coords: [35.2163, 31.7683], name: "ירושלים" },
  [IRAN_ID]:   { coords: [51.3890, 35.6892], name: "טהרן"    },
};

function drawMap(containerId, feature, capital) {
  const container = document.getElementById(containerId);
  const w = container.clientWidth  || 400;
  const h = container.clientHeight || 400;

  const svg = d3.select(`#${containerId}`)
    .append("svg")
    .attr("viewBox", `0 0 ${w} ${h}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Water background
  svg.append("rect")
    .attr("width", w).attr("height", h)
    .attr("fill", "#b0c8d8");

  const projection = d3.geoMercator()
    .fitExtent([[24, 24], [w - 24, h - 24]], feature);

  const path = d3.geoPath().projection(projection);

  svg.append("path")
    .datum(feature)
    .attr("class", "country-shape")
    .attr("d", path);

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
    const features = topojson.feature(world, world.objects.countries).features;

    const israel = features.find(d => +d.id === ISRAEL_ID);
    const iran   = features.find(d => +d.id === IRAN_ID);

    if (israel) drawMap("israel-map", israel, CAPITALS[ISRAEL_ID]);
    if (iran)   drawMap("iran-map",   iran,   CAPITALS[IRAN_ID]);
  } catch (e) {
    console.error("Failed to load map data:", e);
  }
}

init();

document.getElementById("start-btn").addEventListener("click", () => {
  alert("המשחק יתחיל בקרוב!");
});
