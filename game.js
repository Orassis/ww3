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

document.getElementById("start-btn").addEventListener("click", () => {
  alert("המשחק יתחיל בקרוב!");
});
