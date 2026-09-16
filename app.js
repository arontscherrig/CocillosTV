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
  let calendarEvents = [];
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

  const dangerLabels = {
    1: "gering",
    2: "mässig",
    3: "erheblich",
    4: "gross",
    5: "sehr gross"
  };

  const avalancheValues = {
    low: 1,
    moderate: 2,
    considerable: 3,
    high: 4,
    very_high: 5
  };

  // Exaktes 37 × 37-Modulraster aus dem funktionierenden TWINT-JPG.
  // Nur die Darstellung wird verändert; die codierten Module bleiben gleich.
  const paymentQrMatrix = [
    "1111111000000101011110011011001111111",
    "1000001001010001110000111011001000001",
    "1011101000100111010010110000101011101",
    "1011101000110001100110010010101011101",
    "1011101001001010100010110111001011101",
    "1000001010010111110100001101001000001",
    "1111111010101010101010101010101111111",
    "0000000000101000011011110011100000000",
    "1001011010011000111001011111010100000",
    "0001000000011111110011001100011000001",
    "0111001110110011000110000000001100101",
    "0011110101001000101011110110110111001",
    "1000001101100101011001100100011001001",
    "1101010011010010100101000000111101001",
    "0101111110100010000001011100101010011",
    "0100110000101100100111001100000001001",
    "1101001111110000100111001010011001111",
    "1101010001001001000000111100101111011",
    "0111101000111000011010101010111110101",
    "1011100011001101111001110010100001110",
    "1110101100000100001011111100011011011",
    "0111110000000010011001101010001001001",
    "0000001110000010001100000110111111101",
    "0001000001010111001011000100000010011",
    "0111011001000000101001110110101100001",
    "0101100011101001011101000110001001101",
    "1001101111101111100011010000011000111",
    "0110000100001100111001010111010110000",
    "1110011110001101111101010000111110110",
    "0000000011011000011011110111100011001",
    "1111111001110110110011000101101010011",
    "1000001011000001000111011000100011100",
    "1011101001111010010011110100111111001",
    "1011101010011111010001100110000111010",
    "1011101000010110100111100010000011011",
    "1000001000011111001111101111110101000",
    "1111111010111000011001100111101011011"
  ];

  const byId = (id) => document.getElementById(id);

  function renderPaymentQr() {
    const svg = byId("paymentQr");
    if (!svg) return;

    const namespace = "http://www.w3.org/2000/svg";
    const quietZone = 4;
    const matrixSize = paymentQrMatrix.length;
    const viewBoxSize = matrixSize + quietZone * 2;
    const gradientId = "paymentQrGradient";

    const element = (name, attributes = {}) => {
      const node = document.createElementNS(namespace, name);
      Object.entries(attributes).forEach(([key, value]) => {
        node.setAttribute(key, String(value));
      });
      return node;
    };

    const isDark = (x, y) => (
      x >= 0 && y >= 0 && x < matrixSize && y < matrixSize
        ? paymentQrMatrix[y][x] === "1"
        : false
    );

    const isFinder = (x, y) => (
      (x <= 6 && y <= 6)
      || (x >= matrixSize - 7 && y <= 6)
      || (x <= 6 && y >= matrixSize - 7)
    );

    const isAlignment = (x, y) => x >= 28 && x <= 32 && y >= 28 && y <= 32;
    const isSpecial = (x, y) => isFinder(x, y) || isAlignment(x, y);

    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${viewBoxSize} ${viewBoxSize}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const title = element("title", { id: "paymentQrTitle" });
    title.textContent = "TWINT QR-Code für Getränke im Vereinslokal";
    svg.setAttribute("aria-labelledby", "paymentQrTitle");
    svg.appendChild(title);

    const definitions = element("defs");
    const gradient = element("linearGradient", {
      id: gradientId,
      gradientUnits: "userSpaceOnUse",
      x1: quietZone,
      y1: quietZone,
      x2: viewBoxSize - quietZone,
      y2: viewBoxSize - quietZone
    });

    [
      ["0%", "#27051f"],
      ["38%", "#72052f"],
      ["68%", "#b3082b"],
      ["100%", "#e30613"]
    ].forEach(([offset, color]) => {
      gradient.appendChild(element("stop", { offset, "stop-color": color }));
    });
    definitions.appendChild(gradient);
    svg.appendChild(definitions);

    svg.appendChild(element("rect", {
      x: 0,
      y: 0,
      width: viewBoxSize,
      height: viewBoxSize,
      rx: 2.2,
      fill: "#fff"
    }));

    const modules = element("g", { fill: `url(#${gradientId})` });
    const connectorThickness = 0.52;
    const connectorOffset = (1 - connectorThickness) / 2;

    for (let y = 0; y < matrixSize; y += 1) {
      for (let x = 0; x < matrixSize; x += 1) {
        if (!isDark(x, y) || isSpecial(x, y)) continue;

        if (isDark(x + 1, y) && !isSpecial(x + 1, y)) {
          modules.appendChild(element("rect", {
            x: quietZone + x + 0.5,
            y: quietZone + y + connectorOffset,
            width: 1,
            height: connectorThickness,
            rx: connectorThickness / 2
          }));
        }

        if (isDark(x, y + 1) && !isSpecial(x, y + 1)) {
          modules.appendChild(element("rect", {
            x: quietZone + x + connectorOffset,
            y: quietZone + y + 0.5,
            width: connectorThickness,
            height: 1,
            rx: connectorThickness / 2
          }));
        }
      }
    }

    for (let y = 0; y < matrixSize; y += 1) {
      for (let x = 0; x < matrixSize; x += 1) {
        if (!isDark(x, y) || isSpecial(x, y)) continue;
        modules.appendChild(element("circle", {
          cx: quietZone + x + 0.5,
          cy: quietZone + y + 0.5,
          r: 0.39
        }));
      }
    }

    svg.appendChild(modules);

    const drawFinder = (x, y) => {
      svg.appendChild(element("rect", {
        x: quietZone + x,
        y: quietZone + y,
        width: 7,
        height: 7,
        rx: 1.3,
        fill: `url(#${gradientId})`
      }));
      svg.appendChild(element("rect", {
        x: quietZone + x + 1,
        y: quietZone + y + 1,
        width: 5,
        height: 5,
        rx: 0.82,
        fill: "#fff"
      }));
      svg.appendChild(element("rect", {
        x: quietZone + x + 2,
        y: quietZone + y + 2,
        width: 3,
        height: 3,
        rx: 0.72,
        fill: `url(#${gradientId})`
      }));
    };

    drawFinder(0, 0);
    drawFinder(matrixSize - 7, 0);
    drawFinder(0, matrixSize - 7);

    svg.appendChild(element("rect", {
      x: quietZone + 28,
      y: quietZone + 28,
      width: 5,
      height: 5,
      rx: 0.9,
      fill: `url(#${gradientId})`
    }));
    svg.appendChild(element("rect", {
      x: quietZone + 29,
      y: quietZone + 29,
      width: 3,
      height: 3,
      rx: 0.5,
      fill: "#fff"
    }));
    svg.appendChild(element("rect", {
      x: quietZone + 30,
      y: quietZone + 30,
      width: 1,
      height: 1,
      rx: 0.32,
      fill: `url(#${gradientId})`
    }));
  }

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

    if (activeSlide.dataset.slide === "club") {
      scheduleEventRowFit();
      window.setTimeout(fitAllEventRows, 750);
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

  function calendarFormat(date, options) {
    const clock = config.clock || {};
    return new Intl.DateTimeFormat(clock.locale || "de-CH", {
      timeZone: clock.timeZone || "Europe/Zurich",
      ...options
    }).format(date);
  }

  function calendarDayKey(date) {
    return calendarFormat(date, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function decodeIcalText(value = "") {
    return value
      .replace(/\\[nN]/g, " ")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\")
      .trim();
  }

  function parseIcalDate(value) {
    if (!value) return null;

    const dateOnly = value.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (dateOnly) {
      return new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
        12
      );
    }

    const dateTime = value.match(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/
    );
    if (!dateTime) return null;

    const parts = dateTime.slice(1, 7).map(Number);
    return dateTime[7]
      ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]))
      : new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
  }

  function parseIcalEvents(text) {
    const unfolded = String(text).replace(/\r?\n[ \t]/g, "");
    const lines = unfolded.split(/\r?\n/);
    const entries = [];
    let event = null;

    lines.forEach((line) => {
      if (line === "BEGIN:VEVENT") {
        event = {};
        return;
      }

      if (line === "END:VEVENT") {
        if (!event) return;

        const startValue = event.DTSTART?.value;
        const endValue = event.DTEND?.value;
        const startDate = parseIcalDate(startValue);
        const endDate = parseIcalDate(endValue);
        const summary = decodeIcalText(event.SUMMARY?.value)
          .replace(/\s+\(Guggenmusik Cocillos\)$/i, "");
        const description = decodeIcalText(event.DESCRIPTION?.value);
        const categories = decodeIcalText(event.CATEGORIES?.value)
          .split(",")
          .map((category) => category.trim())
          .filter(Boolean)
          .join(", ");

        if (startDate && summary) {
          entries.push({
            title: summary,
            date: startDate.toISOString(),
            parsedDate: startDate,
            end: endDate?.toISOString() || "",
            parsedEndDate: endDate,
            allDay: /^\d{8}$/.test(startValue || ""),
            timeOpen: event["X-COCILLOS-TIME-OPEN"]?.value === "TRUE",
            category: categories,
            place: [...new Set([description, categories].filter(Boolean))].join(" · ")
          });
        }

        event = null;
        return;
      }

      if (!event) return;
      const separator = line.indexOf(":");
      if (separator < 0) return;

      const property = line.slice(0, separator);
      const name = property.split(";")[0].toUpperCase();
      event[name] = {
        value: line.slice(separator + 1),
        property
      };
    });

    return entries;
  }

  async function loadCalendar() {
    const calendar = config.calendar || {};
    if (!calendar.url) {
      calendarEvents = [];
      renderEvents();
      return;
    }

    try {
      const url = new URL(calendar.url, window.location.href);
      url.searchParams.set("_cocillos_refresh", Date.now());
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      calendarEvents = parseIcalEvents(await response.text());
      renderEvents();
    } catch (error) {
      console.error("Konzertmeister-Kalender konnte nicht geladen werden:", error);
      calendarEvents = [];
      renderEvents();
    }
  }

  function eventDateLabel(event) {
    const startLabel = calendarFormat(event.parsedDate, {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    if (
      event.parsedEndDate &&
      calendarDayKey(event.parsedEndDate) !== calendarDayKey(event.parsedDate)
    ) {
      const endLabel = calendarFormat(event.parsedEndDate, {
        weekday: "long",
        day: "numeric",
        month: "long"
      });
      return `${startLabel} – ${endLabel}`;
    }

    return startLabel;
  }

  function eventTimeLabel(event) {
    if (event.timeOpen) return "Zeit offen";
    if (event.allDay) return "ganztägig";

    const startTime = calendarFormat(event.parsedDate, {
      hour: "2-digit",
      minute: "2-digit"
    });

    if (!event.parsedEndDate) return startTime;

    const endTime = calendarFormat(event.parsedEndDate, {
      hour: "2-digit",
      minute: "2-digit"
    });

    if (calendarDayKey(event.parsedDate) === calendarDayKey(event.parsedEndDate)) {
      return `${startTime}–${endTime}`;
    }

    const startDate = calendarFormat(event.parsedDate, {
      day: "2-digit",
      month: "2-digit"
    });
    const endDate = calendarFormat(event.parsedEndDate, {
      day: "2-digit",
      month: "2-digit"
    });
    return `${startDate} ${startTime} – ${endDate} ${endTime}`;
  }

  function isSpecialCalendarEvent(event) {
    const text = [
      event.title,
      event.category,
      event.place
    ].filter(Boolean).join(" ").toLocaleLowerCase("de-CH");

    return [
      "auftritt",
      "ehemalige",
      "probetag",
      "probenachmittag",
      "rätschateuf",
      "caracas",
      "schratti",
      "drachenausbruch"
    ].some((keyword) => text.includes(keyword));
  }

  function renderEventRows(listId, events, emptyMessage, limit) {
    const list = byId(listId);
    if (!list) return;

    list.replaceChildren();

    if (!events.length) {
      const empty = document.createElement("div");
      empty.className = "empty-list";
      empty.textContent = emptyMessage;
      list.appendChild(empty);
      return;
    }

    events.slice(0, limit).forEach((event) => {
      const row = document.createElement("div");
      row.className = "event-item";

      const date = document.createElement("div");
      date.className = "event-date";
      const day = document.createElement("strong");
      day.textContent = calendarFormat(event.parsedDate, { day: "2-digit" });
      const month = document.createElement("span");
      month.textContent = calendarFormat(event.parsedDate, { month: "short" })
        .replace(".", "");
      date.append(day, month);

      const copy = document.createElement("div");
      copy.className = "event-copy";
      const name = document.createElement("strong");
      name.textContent = event.title;
      const place = document.createElement("span");
      place.textContent = event.place
        || event.category
        || config.calendar?.sourceLabel
        || "Ort noch offen";
      copy.append(name, place);

      const time = document.createElement("span");
      time.className = "event-time";
      time.textContent = eventTimeLabel(event);

      row.append(date, copy, time);
      list.appendChild(row);
    });
  }

  function fitEventRows(listId) {
    const list = byId(listId);
    const panel = list?.closest(".list-panel");
    if (!list || !panel) return;

    const rows = Array.from(list.querySelectorAll(".event-item"));
    rows.forEach((row) => {
      row.hidden = false;
      row.style.removeProperty("display");
    });

    const panelStyle = getComputedStyle(panel);
    const availableBottom = panel.getBoundingClientRect().bottom
      - (parseFloat(panelStyle.paddingBottom) || 0);
    const firstClippedRow = rows.findIndex(
      (row) => row.getBoundingClientRect().bottom > availableBottom + 0.5
    );

    if (firstClippedRow >= 0) {
      rows.slice(firstClippedRow).forEach((row) => {
        row.hidden = true;
        row.style.display = "none";
      });
    }
  }

  function fitAllEventRows() {
    fitEventRows("regularEventList");
    fitEventRows("specialEventList");
  }

  function scheduleEventRowFit() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(fitAllEventRows);
    });
  }

  function renderEvents() {
    const configuredEvents = Array.isArray(config.events) ? config.events : [];
    const normalized = [...configuredEvents, ...calendarEvents]
      .map((event) => ({
        ...event,
        parsedDate: event.parsedDate instanceof Date
          ? event.parsedDate
          : parseEventDate(event.date),
        parsedEndDate: event.parsedEndDate instanceof Date
          ? event.parsedEndDate
          : parseEventDate(event.end)
      }))
      .filter((event) => event.parsedDate)
      .sort((a, b) => a.parsedDate - b.parsedDate);

    const seen = new Set();
    const events = normalized.filter((event) => {
      const key = `${event.parsedDate.getTime()}|${event.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const upcoming = events.filter((event) => (
      event.parsedEndDate || event.parsedDate
    ) >= startOfToday);
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
      const countdown = days === 0 ? "heute" : days === 1 ? "morgen" : `in ${days} Tagen`;
      meta.textContent = [
        eventDateLabel(next),
        countdown,
        next.place
      ].filter(Boolean).join(" · ");
      nextContainer.appendChild(meta);
    }

    const regularEvents = upcoming.filter((event) => !isSpecialCalendarEvent(event));
    const specialEvents = upcoming.filter(isSpecialCalendarEvent);

    renderEventRows(
      "regularEventList",
      regularEvents,
      "Keine kommenden Gesamt- oder Registerproben.",
      5
    );
    renderEventRows(
      "specialEventList",
      specialEvents,
      "Keine besonderen Termine oder Auftritte.",
      10
    );
    scheduleEventRowFit();
  }

  function renderTodos() {
    const todos = Array.isArray(config.todos) ? config.todos : [];
    const openCount = todos.filter((todo) => !todo.done).length;
    setText("openTodoCount", openCount);
    setText("todoBadge", openCount);

    const list = byId("todoList");
    if (!list) return;
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

  function datePartsInTimeZone(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone
    }).formatToParts(date);

    return parts.reduce((result, part) => {
      if (part.type !== "literal") result[part.type] = Number(part.value);
      return result;
    }, {});
  }

  function firstFriday(year, monthIndex) {
    const first = new Date(Date.UTC(year, monthIndex, 1));
    const offset = (5 - first.getUTCDay() + 7) % 7;
    return new Date(Date.UTC(year, monthIndex, 1 + offset));
  }

  function nextHockDate() {
    const timeZone = config.clock?.timeZone || "Europe/Zurich";
    const today = datePartsInTimeZone(new Date(), timeZone);
    const todayValue = Date.UTC(today.year, today.month - 1, today.day);
    let monthIndex = today.month - 1;
    let year = today.year;
    let hock = firstFriday(year, monthIndex);

    if (hock.getTime() < todayValue) {
      monthIndex += 1;
      if (monthIndex > 11) {
        monthIndex = 0;
        year += 1;
      }
      hock = firstFriday(year, monthIndex);
    }

    return { hock, todayValue };
  }

  function renderNextHock() {
    const locale = config.clock?.locale || "de-CH";
    const { hock, todayValue } = nextHockDate();
    const dayDistance = Math.round((hock.getTime() - todayValue) / 86400000);
    const monthName = new Intl.DateTimeFormat(locale, {
      month: "long",
      timeZone: "UTC"
    }).format(hock);

    setText("hockDay", String(hock.getUTCDate()).padStart(2, "0"));
    setText("hockMonth", monthName.toUpperCase());
    setText("hockYear", hock.getUTCFullYear());
    setText(
      "hockWeekday",
      new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(hock)
    );
    setText(
      "hockCountdown",
      dayDistance === 0 ? "Heute" : `In ${dayDistance} Tagen`
    );
  }

  function renderWeeklyMenu(data) {
    const container = byId("weeklyMenu");
    if (!container) return;

    container.replaceChildren();
    setText("menuWeek", data.week || "Aktuelles Wochenmenü");

    const source = byId("menuSource");
    if (source) source.href = config.hock?.sourceUrl || data.source || source.href;

    const updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    if (updatedAt && !Number.isNaN(updatedAt.getTime())) {
      const locale = config.clock?.locale || "de-CH";
      const timeZone = config.clock?.timeZone || "Europe/Zurich";
      setText(
        "menuUpdated",
        `Stand ${new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone
        }).format(updatedAt)}`
      );
    }

    const days = Array.isArray(data.days) ? data.days.slice(0, 5) : [];
    if (!days.length) {
      const empty = document.createElement("div");
      empty.className = "empty-list";
      empty.textContent = "Momentan ist kein Wochenmenü veröffentlicht.";
      container.appendChild(empty);
      return;
    }

    days.forEach((day) => {
      const row = document.createElement("div");
      row.className = `weekly-menu-day${day.closed ? " is-closed" : ""}`;

      const dayName = document.createElement("strong");
      dayName.textContent = day.day || "Tag";

      const options = document.createElement("div");
      options.className = "weekly-menu-options";

      if (day.closed) {
        const closed = document.createElement("span");
        closed.className = "weekly-menu-closed";
        closed.textContent = day.closed;
        options.appendChild(closed);
      } else {
        (Array.isArray(day.menus) ? day.menus : []).slice(0, 2).forEach((menu) => {
          const item = document.createElement("div");
          item.className = "weekly-menu-item";

          const label = document.createElement("span");
          label.className = "weekly-menu-label";
          label.textContent = [menu.name, menu.price].filter(Boolean).join(" · ");

          const dish = document.createElement("span");
          dish.className = "weekly-menu-dish";
          dish.textContent = menu.dish || "Menü folgt";

          item.append(label, dish);
          options.appendChild(item);
        });
      }

      row.append(dayName, options);
      container.appendChild(row);
    });
  }

  async function loadWeeklyMenu() {
    const menuUrl = config.hock?.menuUrl || "data/weekly-menu.json";

    try {
      const url = new URL(menuUrl, window.location.href);
      url.searchParams.set("_cocillos_refresh", Date.now());
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      renderWeeklyMenu(await response.json());
    } catch (error) {
      const container = byId("weeklyMenu");
      if (!container) return;
      container.replaceChildren();
      const empty = document.createElement("div");
      empty.className = "empty-list";
      empty.textContent = "Wochenmenü momentan nicht verfügbar.";
      container.appendChild(empty);
      setText("menuUpdated", "Quelle direkt öffnen");
    }
  }

  function renderMaintenance() {
    const maintenance = config.maintenance || {};
    const schedule = (Array.isArray(maintenance.schedule) ? maintenance.schedule : [])
      .map((entry) => ({ ...entry, parsedDate: parseEventDate(entry.date) }))
      .filter((entry) => entry.parsedDate)
      .sort((a, b) => a.parsedDate - b.parsedDate);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const upcoming = schedule.filter((entry) => entry.parsedDate >= startOfToday);
    const next = upcoming[0];

    setText("maintenanceTitle", maintenance.title || "Unterhalt");
    setText(
      "maintenanceStatus",
      upcoming.length
        ? `${upcoming.length} Einsätze ausstehend`
        : "Saisonplan abgeschlossen"
    );

    const nextCard = byId("maintenanceNext");
    if (nextCard) nextCard.classList.toggle("is-empty", !next);

    setText(
      "maintenanceNextDay",
      next ? calendarFormat(next.parsedDate, { day: "2-digit" }) : "✓"
    );
    setText(
      "maintenanceNextMonth",
      next
        ? calendarFormat(next.parsedDate, { month: "short" }).replace(".", "")
        : "fertig"
    );
    setText(
      "maintenanceNextWeekday",
      next ? calendarFormat(next.parsedDate, { weekday: "long" }) : ""
    );
    setText("maintenanceNextTask", next?.task || "Alle Einsätze abgeschlossen");
    setText("maintenanceNextBoard", next?.board || "Noch offen");
    setText(
      "maintenanceNextHelpers",
      next?.helpers?.length ? next.helpers.join(", ") : next ? "Noch offen" : "–"
    );

    const details = byId("maintenanceNextDetails");
    if (details) {
      const detailItems = Array.isArray(next?.details) ? next.details : [];
      details.replaceChildren();
      details.hidden = !detailItems.length;

      detailItems.forEach((detail) => {
        const item = document.createElement("span");
        item.textContent = detail;
        details.appendChild(item);
      });
    }

    const upcomingList = byId("maintenanceUpcoming");
    if (upcomingList) {
      upcomingList.replaceChildren();
      const following = upcoming.slice(1, 6);

      if (!following.length) {
        const empty = document.createElement("div");
        empty.className = "empty-list";
        empty.textContent = "Keine weiteren Einsätze geplant.";
        upcomingList.appendChild(empty);
      } else {
        following.forEach((entry) => {
          const row = document.createElement("article");
          row.className = "maintenance-upcoming-item";

          const date = document.createElement("div");
          date.className = "maintenance-mini-date";
          const day = document.createElement("strong");
          day.textContent = calendarFormat(entry.parsedDate, { day: "2-digit" });
          const month = document.createElement("span");
          month.textContent = calendarFormat(entry.parsedDate, { month: "short" })
            .replace(".", "");
          date.append(day, month);

          const copy = document.createElement("div");
          copy.className = "maintenance-upcoming-copy";
          const task = document.createElement("strong");
          task.textContent = entry.task;
          const team = document.createElement("span");
          const helpers = Array.isArray(entry.helpers) && entry.helpers.length
            ? entry.helpers.join(", ")
            : "Helfer noch offen";
          team.textContent = `${entry.board || "Vorstand offen"} · ${helpers}`;
          copy.append(task, team);

          row.append(date, copy);
          upcomingList.appendChild(row);
        });
      }
    }

    const routine = byId("maintenanceRoutine");
    if (routine) {
      routine.replaceChildren();
      (Array.isArray(maintenance.weekly) ? maintenance.weekly : []).forEach((entry) => {
        const card = document.createElement("article");
        card.className = "maintenance-routine-item";
        const area = document.createElement("strong");
        area.textContent = entry.area;
        const tasks = document.createElement("span");
        tasks.textContent = entry.tasks;
        card.append(area, tasks);
        routine.appendChild(card);
      });
    }
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
        "relative_humidity_2m",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
        "wind_gusts_10m"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "precipitation_sum",
        "rain_sum",
        "snowfall_sum",
        "wind_gusts_10m_max"
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
    setText("windGusts", `${Math.round(current.wind_gusts_10m || 0)} km/h`);
    setText("humidity", `${Math.round(current.relative_humidity_2m || 0)} %`);
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

      const condition = document.createElement("span");
      condition.className = "condition";
      condition.textContent = dayInfo[1];

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
      const probability = Math.round((daily.precipitation_probability_max || [])[index] || 0);
      const amount = Number((daily.precipitation_sum || [])[index] || 0);
      const gust = Math.round((daily.wind_gusts_10m_max || [])[index] || 0);
      rain.textContent = `${amount.toFixed(1)} mm · ${probability} % · Böen ${gust}`;

      card.append(dayName, icon, condition, range, rain);
      forecast.appendChild(card);
    });

    renderForecastHazards(daily);
  }

  function updateHazardCard(cardId, statusId, detailId, status, detail, tone = "neutral") {
    const card = byId(cardId);
    if (card) {
      card.classList.remove("status-neutral", "status-ok", "status-watch", "status-danger");
      card.classList.add(`status-${tone}`);
    }
    setText(statusId, status);
    setText(detailId, detail);
  }

  function numericValues(values) {
    return (Array.isArray(values) ? values : [])
      .map(Number)
      .filter(Number.isFinite);
  }

  function renderForecastHazards(daily) {
    const codes = numericValues(daily.weather_code).slice(0, 5);
    const gusts = numericValues(daily.wind_gusts_10m_max).slice(0, 5);
    const precipitation = numericValues(daily.precipitation_sum).slice(0, 5);
    const snowfall = numericValues(daily.snowfall_sum).slice(0, 5);
    const temperatures = numericValues(daily.temperature_2m_max).slice(0, 5);
    const signals = [];

    const maximumGust = Math.max(0, ...gusts);
    const maximumRain = Math.max(0, ...precipitation);
    const maximumSnow = Math.max(0, ...snowfall);
    const maximumTemperature = Math.max(-99, ...temperatures);

    if (codes.some((code) => code >= 95)) {
      signals.push({ severity: 2, status: "Gewitter möglich", detail: "Lokale Böen, Blitz und Starkregen beachten" });
    }
    if (maximumGust >= 90) {
      signals.push({ severity: 2, status: "Sturmböen möglich", detail: `Bis ${Math.round(maximumGust)} km/h prognostiziert` });
    } else if (maximumGust >= 60) {
      signals.push({ severity: 1, status: "Starke Böen möglich", detail: `Bis ${Math.round(maximumGust)} km/h prognostiziert` });
    }
    if (maximumSnow >= 25) {
      signals.push({ severity: 2, status: "Kräftiger Schneefall möglich", detail: `Bis ${Math.round(maximumSnow)} cm pro Tag im Modell` });
    } else if (maximumSnow >= 10) {
      signals.push({ severity: 1, status: "Schneefall beachten", detail: `Bis ${Math.round(maximumSnow)} cm pro Tag im Modell` });
    }
    if (maximumTemperature >= 34) {
      signals.push({ severity: 2, status: "Starke Hitze möglich", detail: `Bis ${Math.round(maximumTemperature)} °C prognostiziert` });
    } else if (maximumTemperature >= 30) {
      signals.push({ severity: 1, status: "Hitze beachten", detail: `Bis ${Math.round(maximumTemperature)} °C prognostiziert` });
    }

    signals.sort((a, b) => b.severity - a.severity);
    const primary = signals[0];
    updateHazardCard(
      "forecastHazardCard",
      "forecastHazardStatus",
      "forecastHazardDetail",
      primary?.status || "Keine markanten Wettersignale",
      primary?.detail || "5-Tage-Prognose ohne auffällige Schwellenwerte",
      primary ? (primary.severity >= 2 ? "danger" : "watch") : "ok"
    );

    const totalRain = precipitation.reduce((sum, value) => sum + value, 0);
    const floodDanger = maximumRain >= 50 || totalRain >= 90;
    const floodWatch = maximumRain >= 30 || totalRain >= 55;
    updateHazardCard(
      "floodHazardCard",
      "floodHazardStatus",
      "floodHazardDetail",
      `${totalRain.toFixed(1)} mm in 5 Tagen`,
      floodDanger
        ? `Bis ${maximumRain.toFixed(1)} mm/Tag · amtliche Lage prüfen`
        : floodWatch
          ? `Erhöhte Regenmenge · amtliche Lage prüfen`
          : `Maximal ${maximumRain.toFixed(1)} mm/Tag · amtliche Lage öffnen`,
      floodDanger ? "danger" : floodWatch ? "watch" : "ok"
    );
  }

  async function loadHazards() {
    const weather = config.weather || {};
    const dataPath = weather.hazardDataUrl || "data/hazards.json";

    try {
      const url = new URL(dataPath, window.location.href);
      url.searchParams.set("_cocillos_refresh", Date.now());
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      renderOfficialHazards(await response.json());
    } catch (error) {
      console.error("Gefahrendaten konnten nicht geladen werden:", error);
      updateHazardCard(
        "fireHazardCard",
        "fireHazardStatus",
        "fireHazardDetail",
        "Amtliche Daten nicht verfügbar",
        "BAFU-Lage mit Klick öffnen",
        "neutral"
      );
      updateHazardCard(
        "avalancheHazardCard",
        "avalancheHazardStatus",
        "avalancheHazardDetail",
        "Amtliche Daten nicht verfügbar",
        "SLF-Bulletin mit Klick öffnen",
        "neutral"
      );
    }
  }

  function renderOfficialHazards(data) {
    const weather = config.weather || {};
    const requestedFireRegions = (Array.isArray(weather.fireRegions) ? weather.fireRegions : [])
      .map((name) => String(name).trim().toLowerCase())
      .filter(Boolean);
    const fireRegions = Array.isArray(data.fire?.regions) ? data.fire.regions : [];
    const selectedFireRegions = fireRegions.filter((region) => {
      const name = String(region.name || "").toLowerCase();
      return requestedFireRegions.some((requested) => name.includes(requested));
    });

    if (data.fire?.status === "ok" && selectedFireRegions.length) {
      const fireLevel = Math.max(...selectedFireRegions.map((region) => Number(region.level) || 0));
      const measureCategory = Math.max(...selectedFireRegions.map((region) => Number(region.measureCategory) || 0));
      const measureTitles = {
        1: "Besondere Vorsicht mit Feuer",
        2: "Bedingtes Feuerverbot",
        3: "Feuerverbot im Wald",
        4: "Absolutes Feuerverbot"
      };
      const fireStatus = measureTitles[measureCategory]
        || `Gefahr ${dangerLabels[fireLevel] || "nicht eingestuft"}`;
      const regionNames = selectedFireRegions.map((region) => region.name).join(" + ");
      const tone = measureCategory >= 2 || fireLevel >= 4
        ? "danger"
        : measureCategory >= 1 || fireLevel >= 3
          ? "watch"
          : "ok";

      updateHazardCard(
        "fireHazardCard",
        "fireHazardStatus",
        "fireHazardDetail",
        fireStatus,
        `${regionNames} · Gefahrenstufe ${fireLevel}/5`,
        tone
      );
    } else {
      updateHazardCard(
        "fireHazardCard",
        "fireHazardStatus",
        "fireHazardDetail",
        data.fire?.status === "ok" ? "Region nicht gefunden" : "BAFU-Daten nicht verfügbar",
        "Amtliche Lage mit Klick öffnen",
        "neutral"
      );
    }

    const prefixes = (Array.isArray(weather.avalancheRegionPrefixes)
      ? weather.avalancheRegionPrefixes
      : ["CH-42"]
    ).map(String);
    const bulletins = Array.isArray(data.avalanche?.bulletins) ? data.avalanche.bulletins : [];
    const selectedBulletins = bulletins.filter((bulletin) =>
      (Array.isArray(bulletin.regions) ? bulletin.regions : [])
        .some((region) => prefixes.some((prefix) => String(region.id || "").startsWith(prefix)))
    );

    if (data.avalanche?.status === "ok" && selectedBulletins.length) {
      const level = Math.max(...selectedBulletins.map((bulletin) =>
        Number(bulletin.level) || avalancheValues[bulletin.mainValue] || 0
      ));
      const endTimes = selectedBulletins
        .map((bulletin) => bulletin.validUntil ? new Date(bulletin.validUntil).getTime() : Number.NaN)
        .filter(Number.isFinite);
      const validUntil = endTimes.length
        ? new Intl.DateTimeFormat("de-CH", { weekday: "short", hour: "2-digit", minute: "2-digit" })
            .format(new Date(Math.max(...endTimes)))
        : null;

      updateHazardCard(
        "avalancheHazardCard",
        "avalancheHazardStatus",
        "avalancheHazardDetail",
        `Stufe ${level} – ${dangerLabels[level] || "nicht eingestuft"}`,
        validUntil ? `Oberwallis · gültig bis ${validUntil}` : "Oberwallis · SLF-Bulletin",
        level >= 4 ? "danger" : level >= 3 ? "watch" : "ok"
      );
    } else {
      updateHazardCard(
        "avalancheHazardCard",
        "avalancheHazardStatus",
        "avalancheHazardDetail",
        data.avalanche?.status === "ok" ? "Kein Bulletin aktiv" : "SLF-Daten nicht verfügbar",
        "Aktuelle Lage mit Klick beim SLF prüfen",
        data.avalanche?.status === "ok" ? "ok" : "neutral"
      );
    }
  }

  function showWeatherError(message) {
    setText("overviewWeatherText", message);
    setText("currentCondition", message);
    setText("weatherUpdated", "keine Verbindung");
    updateHazardCard(
      "forecastHazardCard",
      "forecastHazardStatus",
      "forecastHazardDetail",
      "Prognose nicht verfügbar",
      "Open-Meteo konnte nicht erreicht werden",
      "neutral"
    );
    updateHazardCard(
      "floodHazardCard",
      "floodHazardStatus",
      "floodHazardDetail",
      "Regenprognose nicht verfügbar",
      "Amtliche Lage mit Klick öffnen",
      "neutral"
    );
  }

  function initWebcam() {
    const webcam = config.webcam || {};
    setText("webcamTitle", webcam.title || "Roundshot Live");
    const container = byId("webcamContainer");

    if (!webcam.url) return;

    container.replaceChildren();

    if (webcam.type === "image") {
      if (webcam.view === "fixed") {
        const image = document.createElement("img");
        const heading = Number(webcam.heading);
        const panoramaNorth = Number(webcam.panoramaNorth);
        const normalizedHeading = Number.isFinite(heading)
          ? ((heading % 360) + 360) % 360
          : 180;
        const normalizedNorth = Number.isFinite(panoramaNorth)
          ? ((panoramaNorth % 360) + 360) % 360
          : 0;
        const focalPoint = ((normalizedNorth + normalizedHeading) % 360) / 360 * 100;

        image.className = "webcam-fixed-image";
        image.alt = webcam.title || "Aktuelles Webcam-Bild";
        image.draggable = false;
        image.style.setProperty("--webcam-offset-x", `${-focalPoint}%`);

        const refresh = () => {
          const url = new URL(webcam.url, window.location.href);
          url.searchParams.set("_cocillos_refresh", Date.now());
          image.src = url.toString();
        };

        image.addEventListener("load", () => image.classList.add("is-ready"));
        image.addEventListener("error", () => {
          image.alt = "Webcam-Bild konnte nicht geladen werden";
        });

        container.appendChild(image);
        refresh();
        window.setInterval(refresh, Math.max(30, Number(webcam.refreshSeconds) || 300) * 1000);
        return;
      }

      const track = document.createElement("div");
      const primaryImage = document.createElement("img");
      const duplicateImage = document.createElement("img");
      const slideDurations = config.rotation && config.rotation.slides;
      const panoramaSeconds = Math.max(1, Number(slideDurations && slideDurations.webcam) || 40);

      track.className = "roundshot-panorama-track";
      track.setAttribute("role", "img");
      track.setAttribute("aria-label", webcam.title || "Aktuelles Webcam-Panorama");
      track.style.setProperty("--panorama-duration", `${panoramaSeconds}s`);

      primaryImage.alt = "";
      duplicateImage.alt = "";
      duplicateImage.setAttribute("aria-hidden", "true");

      const updatePanoramaGeometry = () => {
        if (!primaryImage.naturalWidth || !primaryImage.naturalHeight || !container.clientHeight) return;

        const panoramaWidth = (primaryImage.naturalWidth / primaryImage.naturalHeight) * container.clientHeight;
        const startPosition = Math.min(0, container.clientWidth - panoramaWidth);

        track.style.setProperty("--panorama-start", `${startPosition}px`);
        track.style.setProperty("--panorama-end", `${startPosition - panoramaWidth}px`);
      };

      const refresh = () => {
        const url = new URL(webcam.url, window.location.href);
        url.searchParams.set("_cocillos_refresh", Date.now());
        primaryImage.src = url.toString();
      };

      primaryImage.addEventListener("load", () => {
        duplicateImage.src = primaryImage.currentSrc || primaryImage.src;
        updatePanoramaGeometry();
        track.classList.add("is-ready");
      });

      primaryImage.addEventListener("error", () => {
        track.setAttribute("aria-label", "Webcam-Bild konnte nicht geladen werden");
      });

      track.append(primaryImage, duplicateImage);
      container.appendChild(track);
      window.addEventListener("resize", updatePanoramaGeometry);
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
    renderPaymentQr();
    updateClock();
    window.setInterval(updateClock, 1000);

    buildTicker();
    buildNavigation();
    window.addEventListener("resize", scheduleEventRowFit);
    loadCalendar();
    renderTodos();
    renderMaintenance();
    renderNextHock();
    loadWeeklyMenu();
    window.setInterval(renderMaintenance, 15 * 60 * 1000);
    window.setInterval(renderNextHock, 60 * 60 * 1000);
    initWebcam();
    initMap();
    initGallery();

    loadWeather();
    loadHazards();
    const refreshMinutes = Math.max(5, Number(config.weather?.refreshMinutes) || 15);
    window.setInterval(loadWeather, refreshMinutes * 60 * 1000);
    window.setInterval(loadHazards, refreshMinutes * 60 * 1000);

    const calendarRefreshMinutes = Math.max(
      5,
      Number(config.calendar?.refreshMinutes) || 15
    );
    window.setInterval(loadCalendar, calendarRefreshMinutes * 60 * 1000);

    const menuRefreshMinutes = Math.max(
      15,
      Number(config.hock?.refreshMinutes) || 60
    );
    window.setInterval(loadWeeklyMenu, menuRefreshMinutes * 60 * 1000);

    showSlide(0);
  }

  init();
})();
