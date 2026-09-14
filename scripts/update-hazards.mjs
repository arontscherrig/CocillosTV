import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../data/hazards.json");
const fireHomeUrl = "https://www.waldbrandgefahr.ch/";
const avalancheApiUrl = "https://aws.slf.ch/api/bulletin/caaml/de/json";

const avalancheLevels = {
  low: 1,
  moderate: 2,
  considerable: 3,
  high: 4,
  very_high: 5
};

const measureTitles = {
  0: "Keine Massnahmen",
  1: "Besondere Vorsicht mit Feuer",
  2: "Bedingtes Feuerverbot",
  3: "Feuerverbot im Wald",
  4: "Absolutes Feuerverbot"
};

async function request(url, type = "json") {
  const response = await fetch(url, {
    headers: {
      accept: type === "json" ? "application/json" : "text/html",
      "user-agent": "CocillosTV hazard updater (GitHub Actions)"
    },
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return type === "json" ? response.json() : response.text();
}

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

async function loadExisting() {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return null;
  }
}

async function fetchFireData() {
  const home = await request(fireHomeUrl, "text");
  const match = home.match(/id="fire_map_tabs"\s+data-react-props="([^"]+)"/);
  if (!match) throw new Error("BAFU data paths were not found");

  const props = JSON.parse(decodeHtml(match[1]));
  const warningUrl = new URL(props.warnMapJsonPath, fireHomeUrl);
  const measureUrl = new URL(props.measuresMapRegionsJsonPath, fireHomeUrl);
  const [warnings, measures] = await Promise.all([
    request(warningUrl),
    request(measureUrl)
  ]);

  const measuresByRegion = new Map(measures.map((measure) => [Number(measure.region_id), measure]));
  const regions = warnings
    .filter((warning) => Number(warning.canton_id) === 24)
    .map((warning) => {
      const measure = measuresByRegion.get(Number(warning.region_id));
      const measureCategory = Number(measure?.category) || 0;
      return {
        id: Number(warning.region_id),
        name: warning.region_name_de,
        level: Number(warning.level) || 0,
        warningValidFrom: warning.valid_from || null,
        measureCategory,
        measureTitle: measureTitles[measureCategory],
        measureValidFrom: measure?.valid_from || null
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "de-CH"));

  if (!regions.length) throw new Error("BAFU returned no regions for Valais");

  return {
    status: "ok",
    source: "BAFU und Kantone",
    sourceUrl: "https://www.waldbrandgefahr.ch/de/aktuelle-gefahrenlage",
    regions
  };
}

async function fetchAvalancheData() {
  const response = await request(avalancheApiUrl);
  const bulletins = (Array.isArray(response.bulletins) ? response.bulletins : []).map((bulletin) => {
    const ratings = Array.isArray(bulletin.dangerRatings) ? bulletin.dangerRatings : [];
    const mainValue = ratings
      .map((rating) => rating.mainValue)
      .sort((a, b) => (avalancheLevels[b] || 0) - (avalancheLevels[a] || 0))[0] || null;

    return {
      id: bulletin.bulletinID,
      mainValue,
      level: avalancheLevels[mainValue] || 0,
      validFrom: bulletin.validTime?.startTime || null,
      validUntil: bulletin.validTime?.endTime || null,
      regions: (Array.isArray(bulletin.regions) ? bulletin.regions : []).map((region) => ({
        id: region.regionID,
        name: region.name
      }))
    };
  });

  return {
    status: "ok",
    source: "WSL-Institut für Schnee- und Lawinenforschung SLF",
    sourceUrl: "https://www.slf.ch/de/lawinenbulletin-und-schneesituation/",
    bulletins
  };
}

async function main() {
  const existing = await loadExisting();
  const next = {
    version: 1,
    generatedAt: existing?.generatedAt || null,
    fire: existing?.fire || { status: "unavailable", regions: [] },
    avalanche: existing?.avalanche || { status: "unavailable", bulletins: [] }
  };

  const results = await Promise.allSettled([fetchFireData(), fetchAvalancheData()]);
  if (results[0].status === "fulfilled") {
    next.fire = results[0].value;
  } else {
    console.error(`Waldbranddaten: ${results[0].reason}`);
  }
  if (results[1].status === "fulfilled") {
    next.avalanche = results[1].value;
  } else {
    console.error(`Lawinendaten: ${results[1].reason}`);
  }

  if (results.every((result) => result.status === "rejected") && !existing) {
    throw new Error("No official hazard source could be loaded");
  }

  const comparableExisting = existing ? { ...existing, generatedAt: null } : null;
  const comparableNext = { ...next, generatedAt: null };
  if (comparableExisting && JSON.stringify(comparableExisting) === JSON.stringify(comparableNext)) {
    console.log("Official hazard data is unchanged");
    return;
  }

  next.generatedAt = new Date().toISOString();
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`Updated ${outputPath}`);
}

await main();
