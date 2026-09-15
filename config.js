/*
 * CocillosTV – zentrale Konfiguration
 * Nur diese Datei muss für den normalen Betrieb angepasst werden.
 */
window.COCILLOS_CONFIG = {
  branding: {
    name: "COCILLOS",
    subtitle: "Vereins-TV",
    accent: "#e30613"
  },

  clock: {
    locale: "de-CH",
    timeZone: "Europe/Zurich"
  },

  rotation: {
    defaultSeconds: 22,
    slides: {
      overview: 18,
      weather: 34,
      webcam: 40,
      map: 24,
      club: 25,
      gallery: 30
    }
  },

  weather: {
    label: "Oberwallis",
    latitude: 46.316,
    longitude: 7.987,
    forecastDays: 5,
    refreshMinutes: 15,

    /*
     * Amtliche Gefahren werden durch GitHub Actions in data/hazards.json
     * aktualisiert. Für Brig/Naters sind Aletsch und Südrampe die
     * nächstliegenden BAFU-Waldbrandregionen. Weitere Namen sind möglich.
     */
    hazardDataUrl: "data/hazards.json",
    fireRegions: ["Aletsch", "Südrampe"],
    avalancheRegionPrefixes: ["CH-42"]
  },

  webcam: {
    title: "Aletschbord · Südblick",
    /*
     * Das direkte Panoramabild bleibt cookie-frei eingebunden.
     * view: "fixed" hält die gewünschte Himmelsrichtung dauerhaft fest.
     */
    type: "image",
    url: "https://belalp.roundshot.com/cams/1548",
    view: "fixed",
    heading: 180,
    panoramaNorth: 340,
    refreshSeconds: 300
  },

  map: {
    center: [46.316, 7.987],
    zoom: 11,
    pins: [
      {
        title: "Vereinslokal",
        coordinates: [46.316, 7.987],
        description: "Position in config.js anpassen"
      }
    ]
  },

  /*
   * Datum als YYYY-MM-DD oder YYYY-MM-DDTHH:MM eintragen.
   * Beispiel:
   * { title: "Probe", date: "2026-10-02T20:00", place: "Vereinslokal" }
   */
  events: [],

  todos: [
    { text: "Standort der Karte festlegen", done: false },
    { text: "Erste Vereinsfotos hochladen", done: false }
  ],

  /*
   * Bilder zuerst ins Repository laden, zum Beispiel nach assets/photos/.
   * Beispiel:
   * { src: "assets/photos/probe.jpg", caption: "Probe 2026" }
   */
  photos: [],

  ticker: [
    "Willkommen bei Cocillos TV",
    "Termine, Aufgaben und Bilder zentral in config.js pflegen",
    "Pfeiltasten wechseln die Seite · Leertaste pausiert · F aktiviert Vollbild"
  ]
};
