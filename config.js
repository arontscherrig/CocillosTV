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
      maintenance: 30,
      hock: 34,
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

  calendar: {
    url: "data/konzertmeister.ical",
    sourceLabel: "Konzertmeister",
    refreshMinutes: 15
  },

  hock: {
    menuUrl: "data/weekly-menu.json",
    sourceUrl: "https://restaurant-simplon.ch/wochenmenue/",
    refreshMinutes: 60
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

  maintenance: {
    title: "Unterhalt Probesaison 26 / 27",
    weekly: [
      {
        area: "Proberaum",
        tasks: "Abfall entsorgen, Bar aufräumen und sauber machen, Boden saugen/wischen"
      },
      {
        area: "Küche",
        tasks: "Flächen abwischen, Geschirr wegräumen, Müll raus"
      },
      {
        area: "Lager",
        tasks: "Ordnung prüfen und bei Bedarf aufräumen, Boden kehren"
      },
      {
        area: "Aussen & WC",
        tasks: "Müll sammeln und entsorgen, Aschenbecher leeren, WC reinigen und Toilettenpapier auffüllen"
      }
    ],
    schedule: [
      { date: "2026-09-20", task: "Rasen mähen", board: "Andreas", helpers: ["Alina", "Michael A.", "Bettina"] },
      { date: "2026-09-27", task: "Küche putzen und aufräumen", board: "Alena", helpers: ["Mirco", "Gian", "Philipp"] },
      { date: "2026-10-04", task: "Rasen mähen", board: "Marvin", helpers: ["Jasmin", "Samuel", "Lara"] },
      { date: "2026-10-11", task: "Instrumente und Lager aufräumen", board: "Gabriela", helpers: ["Kai", "Fernando", "Melanie"] },
      { date: "2026-10-18", task: "Rasen mähen", board: "Aron", helpers: ["Michael E.", "Friedli", "Levi"] },
      { date: "2026-10-25", task: "Fenster reinigen", board: "Kevin S.", helpers: ["Nicolà", "Elias", "Tamara"] },
      { date: "2026-11-01", task: "Rasen mähen, Gartengeräte reinigen", board: "Andreas", helpers: ["Kerstin", "Romaine", "Noah"] },
      { date: "2026-11-08", task: "Umgebung Winterschlaf machen", board: "Gabriela", helpers: ["Roland", "Etienne", "Céline"] },
      { date: "2026-11-22", task: "Toilette gründlich reinigen", board: "Marvin", helpers: ["Carmen", "Robert", "Silvia"] },
      { date: "2026-11-29", task: "Bar aufräumen und reinigen", board: "Alena", helpers: ["Michèle", "Anna", "Lara Maria"] },
      { date: "2026-12-06", task: "Kühlschränke kontrollieren und reinigen", board: "Aron", helpers: ["Christina", "André", "Otto"] },
      { date: "2026-12-13", task: "Ablagen im Proberaum abstauben", board: "Kevin S.", helpers: ["Riccardo", "Michelle", "David"] },
      { date: "2026-12-20", task: "Küche putzen und aufräumen", board: "Andreas", helpers: ["Severin", "Svenja", "Sara Romina"] },
      { date: "2027-01-03", task: "Instrumente und Lager aufräumen", board: "Gabriela", helpers: ["Kevin Z."] },
      { date: "2027-01-10", task: "Toilette gründlich reinigen", board: "Marvin", helpers: [] },
      {
        date: "2027-02-13",
        task: "Endreinigung & Vorbereitung Sommersaison",
        board: "Alle",
        helpers: [],
        details: [
          "Instrumente verräumen und Lager aufräumen",
          "Bar ausräumen",
          "Kühlschränke leeren und ausschalten",
          "Küche aufräumen und reinigen",
          "Sicherung von Heizung und Küche ausschalten"
        ]
      }
    ]
  },

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
