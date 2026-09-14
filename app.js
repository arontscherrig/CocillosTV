(() => {
  "use strict";

  const config = window.COCILLOS_CONFIG || {};
  const slides = Array.from(document.querySelectorAll(".slide"));
  const progress = document.getElementById("slideProgress");
  const slideTitle = document.getElementById("slideTitle");
  const dotsContainer = document.getElementById("slideDots");

  let currentSlide = 0;
  let rotationTimer = null;
  let photoTimer = null;
  let isPaused = false;
  let mapInstance = null;

  const weatherCodes = {
    0: ["☀️", "Klar"],
    1: ["🌤️", "Überwiegend klar"],
    2: ["⛅", "Teilweise bewölkt"],
    3: ["☁️", "Bewölkt"],
    45: ["🌫️", "Nebel"],
    48: ["🌫️", "Reifnebel"],
    51: ["🌦️", "Leichter Nieselregen"],
    53: ["🌦️", "Nieselregen"],
    55: ["🌧️", "Starker Nieselregen"],
    56: ["🌧️", "Gefrierender Nieselregen"],
    57: ["🌧️", "Starker gefrierender Nieselregen"],
    61: ["🌦️", "Leichter Regen"],
    63: ["🌧️", "Regen"],
    65: ["🌧️", "Starker Regen"],
    66: ["🌧️", "Gefrierender Regen"],
    67: ["🌧️", "Starker gefrierender Regen"],
    71: ["🌨️", "Leichter Schneefall"],
    73: ["🌨️", "Schneefall"],
    75: ["❄️", "Starker Schneefall"],
    77: ["❄️", "Schneegriesel"],
    80: ["🌦️", "Leichte Schauer"],
    81: ["🌧️", "Regenschauer"],
    82: ["🌧️", "Starke Schauer"],
    85: ["🌨️", "Schneeschauer"],
    86: ["❄️", "Starke Schneeschauer"],
    95: ["⛈️", "Gewitter"],
    96: ["⛈️", "Gewitter mit Hagel"],
    99: ["⛈️", "Starkes Gewitter"]
  };

  const byId = (id) => document.getElementById(id);

  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = value;
  }

  function weatherInfo(code) {
    return weatherCodes[Number(code)] || ["◌", "Unbekannt"];
  }

  function parseEventDate(value) {
    if (!value) return null;
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value + "T12:00:00"
      : value;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function applyBranding() {
    const branding = config.branding || {};
    setText("brandName", branding.name || "COCILLOS");
    setText("brandSubtitle", branding.subtitle || "Vereins-TV");
    if (branding.accent) {
      document.documentElement.style.setProperty("--accent", branding.accent);
    }
  }

  function updateClock() {
    const clock = config.clock || {};
    const locale = clock.locale || "de-CH";
    const timeZone = clock.timeZone || "Europe/Zurich";
    const now = new Date();

    setText("clockTime", new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone
    }).format(now));

    setText("clockDate", new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "2-digit",
      month: "long",
      timeZone
    }).format(now));
  }

  function buildTicker() {
    const ticker = byId("ticker");
    const messages = Array.isArray(config.ticker) && config.ticker.length
      ? config.ticker
      : ["Willkommen bei Cocillos TV"];

    [...messages, ...messages].forEach((message) => {
      const item = document.createElement("span");
      item.textContent = message;
      ticker.appendChild(item);
    });
  }

  function slideDuration(slide) {
    const rotation = config.rotation || {};
    const timings = rotation.slides || {};
    const key = slide.dataset.slide;
    const seconds = Number(timings[key] || rotation.defaultSeconds || 22);
    return Math.max(5, seconds) * 1000;
  }

  function animateProgress(duration) {
    progress.style.transition = "none";
    progress.style.width = "0";
    void progress.offsetWidth;
    progress.style.transition = `width ${duration}ms linear`;
    progress.style.width = "100%";
  }

  function scheduleRotation() {
    window.clearTimeout(rotationTimer);
    if (isPaused || document.hidden || slides.length < 2) return;

    const duration = slideDuration(slides[currentSlide]);
    animateProgress(duration);
    rotationTimer = window.setTimeout(() => {
      showSlide((currentSlide + 1) % slides.length);
    }, duration);
  }

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === currentSlide);
    });

    const activeSlide = slides[currentSlide];
    slideTitle.textContent = activeSlide.dataset.title || "";
    Array.from(dotsContainer.children).forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === currentSlide);
      dot.setAttribute("aria-current", dotIndex === currentSlide ? "page" : "false");
    });

    if (activeSlide.dataset.slide === "map" && mapInstance) {
      window.setTimeout(() => mapInstance.invalidateSize(), 500);
    }

    scheduleRotation();
  }

  function buildNavigation() {
    slides.forEach((slide, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", slide.dataset.title || `Seite ${index + 1}`);
      dot.addEventListener("click", () => showSlide(index));
      dotsContainer.appendChild(dot);
    });

    byId("previousButton").addEventListener("click", () => showSlide(currentSlide - 1));
    byId("nextButton").addEventListener("click", () => showSlide(currentSlide + 1));

    byId("pauseButton").addEventListener("click", togglePause);
    byId("fullscreenButton").addEventListener("click", toggleFullscreen);

    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") showSlide(currentSlide + 1);
      if (event.key === "ArrowLeft") showSlide(currentSlide - 1);
      if (event.key === " ") {
        event.preventDefault();
        togglePause();
      }
      if (event.key.toLowerCase() === "f") toggleFullscreen();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        window.clearTimeout(rotationTimer);
      } else {
        scheduleRotation();
      }
    });
  }

  function togglePause() {
    isPaused = !isPaused;
    document.body.classList.toggle("paused", isPaused);
    byId("pauseButton").textContent = isPaused ? "▶" : "Ⅱ";
    byId("pauseButton").setAttribute(
      "aria-label",
      isPaused ? "Rotation fortsetzen" : "Rotation pausieren"
    );

    if (isPaused) {
      window.clearTimeout(rotationTimer);
      const frozenWidth = getComputedStyle(progress).width;
      progress.style.transition = "none";
      progress.style.width = frozenWidth;
    } else {
      scheduleRotation();
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function renderEvents() {
    const events = (Array.isArray(config.events) ? config.events : [])
      .map((event) => ({ ...event, parsedDate: parseEventDate(event.date) }))
      .filter((event) => event.parsedDate)
      .sort((a, b) => a.parsedDate - b.parsedDate);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const upcoming = events.filter((event) => event.parsedDate >= startOfToday);
    const next = upcoming[0];
    const nextContainer = byId("nextEvent");

    nextContainer.replaceChildren();
    const label = document.createElement("span");
    label.className = "muted";
    label.textContent = "Nächster Termin";
    nextContainer.appendChild(label);

    const title = document.createElement("strong");
    if (!next) {
      title.textContent = "Noch keine Termine eingetragen";
      nextContainer.appendChild(title);
    } else {
      title.textContent = next.title;
      nextContainer.appendChild(title);

      const meta = document.createElement("span");
      meta.className = "event-meta";
      const days = Math.max(0, Math.ceil((next.parsedDate - new Date()) / 86400000));
      const dateText = new Intl.DateTimeFormat("de-CH", {
        weekday: "long",
        day: "numeric",
        month: "long"
      }).format(next.parsedDate);
      const countdown = days === 0 ? "heute" : days === 1 ? "morgen" : `in ${days} Tagen`;
      meta.textContent = [dateText, countdown, next.place].filter(Boolean).join(" · ");
      nextContainer.appendChild(meta);
    }

    const list = byId("eventList");
    list.replaceChildren();

    if (!upcoming.length) {
      const empty = document.createElement("div");
      empty.className = "empty-list";
      empty.textContent = "Noch keine kommenden Termine in config.js eingetragen.";
      list.appendChild(empty);
      return;
    }

    upcoming.slice(0, 5).forEach((event) => {
      const row = document.createElement("div");
      row.className = "event-item";

      const date = document.createElement("div");
      date.className = "event-date";
      const day = document.createElement("strong");
      day.textContent = new Intl.DateTimeFormat("de-CH", { day: "2-digit" }).format(event.parsedDate);
      const month = document.createElement("span");
      month.textContent = new Intl.DateTimeFormat("de-CH", { month: "short" })
        .format(event.parsedDate)
        .replace(".", "");
      date.append(day, month);

      const copy = document.createElement("div");
      copy.className = "event-copy";
      const name = document.createElement("strong");
      name.textContent = event.title;
      const place = document.createElement("span");
      place.textContent = event.place || "Ort noch offen";
      copy.append(name, place);

      const time = document.createElement("span");
      time.className = "event-time";
      time.textContent = String(event.date).includes("T")
        ? new Intl.DateTimeFormat("de-CH", { hour: "2-digit", minute: "2-digit" }).format(event.parsedDate)
        : "ganztägig";

      row.append(date, copy, time);
      list.appendChild(row);
    });
  }

  function renderTodos() {
    const todos = Array.isArray(config.todos) ? config.todos : [];
    const openCount = todos.filter((todo) => !todo.done).length;
    setText("openTodoCount", openCount);
    setText("todoBadge", openCount);

    const list = byId("todoList");
    list.replaceChildren();

    if (!todos.length) {
      const empty = document.createElement("div");
      empty.className = "empty-list";
      empty.textContent = "Keine offenen Aufgaben.";
      list.appendChild(empty);
      return;
    }

    todos.slice(0, 7).forEach((todo) => {
      const row = document.createElement("div");
      row.className = `todo-item${todo.done ? " done" : ""}`;

      const check = document.createElement("span");
      check.className = "todo-check";
      check.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.textContent = todo.text;

      row.append(check, text);
      list.appendChild(row);
    });
  }

  async function loadWeather() {
    const weather = config.weather || {};
    const latitude = Number(weather.latitude);
    const longitude = Number(weather.longitude);
    const label = weather.label || "Wetter";

    setText("overviewWeatherPlace", label);
    setText("weatherHeading", label);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      showWeatherError("Koordinaten fehlen");
      return;
    }

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: [
        "temperature_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "wind_speed_10m"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max"
      ].join(","),
      timezone: "auto",
      forecast_days: String(Math.min(7, Math.max(3, Number(weather.forecastDays) || 5)))
    });

    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      renderWeather(data);
    } catch (error) {
      console.error("Wetter konnte nicht geladen werden:", error);
      showWeatherError("Wetter momentan nicht verfügbar");
    }
  }

  function renderWeather(data) {
    const current = data.current || {};
    const info = weatherInfo(current.weather_code);
    const roundedTemperature = Number.isFinite(current.temperature_2m)
      ? Math.round(current.temperature_2m)
      : "--";

    setText("overviewWeatherIcon", info[0]);
    setText("overviewTemperature", `${roundedTemperature}°`);
    setText(
      "overviewWeatherText",
      `${info[1]} · Wind ${Math.round(current.wind_speed_10m || 0)} km/h`
    );

    setText("currentWeatherIcon", info[0]);
    setText("currentTemperature", `${roundedTemperature}°`);
    setText("currentCondition", info[1]);
    setText("feelsLike", `${Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0)}°`);
    setText("windSpeed", `${Math.round(current.wind_speed_10m || 0)} km/h`);
    setText("precipitation", `${Number(current.precipitation || 0).toFixed(1)} mm`);
    setText(
      "weatherUpdated",
      `Aktualisiert ${new Intl.DateTimeFormat("de-CH", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date())}`
    );

    const daily = data.daily || {};
    const forecast = byId("forecast");
    forecast.replaceChildren();

    (daily.time || []).slice(0, 5).forEach((dateValue, index) => {
      const date = new Date(`${dateValue}T12:00:00`);
      const dayInfo = weatherInfo((daily.weather_code || [])[index]);
      const card = document.createElement("article");
      card.className = `forecast-day${index === 0 ? " today" : ""}`;

      const dayName = document.createElement("span");
      dayName.className = "day-name";
      dayName.textContent = index === 0
        ? "Heute"
        : new Intl.DateTimeFormat("de-CH", { weekday: "short" })
            .format(date)
            .replace(".", "");

      const icon = document.createElement("span");
      icon.className = "weather-icon";
      icon.textContent = dayInfo[0];
      icon.title = dayInfo[1];

      const range = document.createElement("span");
      range.className = "range";
      const maximum = Math.round((daily.temperature_2m_max || [])[index]);
      const minimum = Math.round((daily.temperature_2m_min || [])[index]);
      range.textContent = `${maximum}° `;
      const low = document.createElement("span");
      low.textContent = `/ ${minimum}°`;
      range.appendChild(low);

      const rain = document.createElement("span");
      rain.className = "rain";
      rain.textContent = `Regen ${Math.round((daily.precipitation_probability_max || [])[index] || 0)} %`;

      card.append(dayName, icon, range, rain);
      forecast.appendChild(card);
    });
  }

  function showWeatherError(message) {
    setText("overviewWeatherText", message);
    setText("currentCondition", message);
    setText("weatherUpdated", "keine Verbindung");
  }

  function initWebcam() {
    const webcam = config.webcam || {};
    setText("webcamTitle", webcam.title || "Roundshot Live");
    const container = byId("webcamContainer");

    if (!webcam.url) return;

    container.replaceChildren();

    if (webcam.type === "image") {
      const image = document.createElement("img");
      image.alt = webcam.title || "Aktuelles Webcam-Bild";

      const refresh = () => {
        const url = new URL(webcam.url, window.location.href);
        url.searchParams.set("_cocillos_refresh", Date.now());
        image.src = url.toString();
      };

      image.addEventListener("error", () => {
        image.alt = "Webcam-Bild konnte nicht geladen werden";
      });

      container.appendChild(image);
      refresh();
      window.setInterval(refresh, Math.max(30, Number(webcam.refreshSeconds) || 300) * 1000);
    } else {
      const frame = document.createElement("iframe");
      frame.src = webcam.url;
      frame.title = webcam.title || "Roundshot Live";
      frame.loading = "eager";
      frame.allow = "fullscreen; autoplay";
      frame.setAttribute("allowfullscreen", "");
      container.appendChild(frame);
    }
  }

  function initMap() {
    const mapElement = byId("map");
    const mapConfig = config.map || {};
    const center = Array.isArray(mapConfig.center) ? mapConfig.center : [46.316, 7.987];

    if (!window.L) {
      mapElement.innerHTML = '<div class="empty-list">Kartenbibliothek konnte nicht geladen werden.</div>';
      return;
    }

    mapInstance = window.L.map(mapElement, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true
    }).setView(center, Number(mapConfig.zoom) || 11);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstance);

    const markerIcon = window.L.divIcon({
      className: "marker-shell",
      html: '<span class="custom-marker"></span>',
      iconSize: [24, 34],
      iconAnchor: [12, 30],
      popupAnchor: [0, -28]
    });

    (Array.isArray(mapConfig.pins) ? mapConfig.pins : []).forEach((pin) => {
      if (!Array.isArray(pin.coordinates) || pin.coordinates.length !== 2) return;

      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = pin.title || "Vereinsort";
      popup.appendChild(title);

      if (pin.description) {
        const description = document.createElement("p");
        description.textContent = pin.description;
        description.style.margin = "6px 0 0";
        popup.appendChild(description);
      }

      window.L.marker(pin.coordinates, { icon: markerIcon })
        .addTo(mapInstance)
        .bindPopup(popup);
    });

    window.setTimeout(() => mapInstance.invalidateSize(), 500);
  }

  function initGallery() {
    const photos = Array.isArray(config.photos) ? config.photos : [];
    if (!photos.length) return;

    const stage = byId("photoStage");
    const fallback = byId("photoFallback");
    const caption = byId("photoCaption");
    let photoIndex = 0;

    fallback.hidden = true;
    stage.classList.add("has-photo");

    const showPhoto = () => {
      const photo = photos[photoIndex];
      stage.style.opacity = "0.72";

      const preload = new Image();
      preload.onload = () => {
        stage.style.backgroundImage = `url("${String(photo.src).replace(/"/g, "%22")}")`;
        caption.textContent = photo.caption || "";
        caption.hidden = !photo.caption;
        stage.style.opacity = "1";
      };
      preload.onerror = () => {
        caption.textContent = "Bild konnte nicht geladen werden";
        caption.hidden = false;
        stage.style.opacity = "1";
      };
      preload.src = photo.src;

      photoIndex = (photoIndex + 1) % photos.length;
    };

    showPhoto();
    if (photos.length > 1) {
      window.clearInterval(photoTimer);
      photoTimer = window.setInterval(showPhoto, 9000);
    }
  }

  function init() {
    applyBranding();
    updateClock();
    window.setInterval(updateClock, 1000);

    buildTicker();
    buildNavigation();
    renderEvents();
    renderTodos();
    initWebcam();
    initMap();
    initGallery();

    loadWeather();
    const refreshMinutes = Math.max(5, Number(config.weather?.refreshMinutes) || 15);
    window.setInterval(loadWeather, refreshMinutes * 60 * 1000);

    showSlide(0);
  }

  init();
})();
