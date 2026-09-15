#!/usr/bin/env python3
"""Fetch the Restaurant Simplon weekly menu and update the local JSON snapshot."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen


SOURCE_URL = "https://restaurant-simplon.ch/wochenmenue/"
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "data" / "weekly-menu.json"
WEEKDAYS = {"Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"}


class MainTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_main = False
        self.capture_tag: str | None = None
        self.buffer: list[str] = []
        self.tokens: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "main":
            self.in_main = True
            return
        if self.in_main and self.capture_tag is None and tag in {"h1", "h3", "p", "ul"}:
            self.capture_tag = tag
            self.buffer = []

    def handle_endtag(self, tag: str) -> None:
        if self.capture_tag == tag:
            text = " ".join(" ".join(self.buffer).split())
            if text:
                self.tokens.append((tag, text))
            self.capture_tag = None
            self.buffer = []
        if tag == "main":
            self.in_main = False

    def handle_data(self, data: str) -> None:
        if self.in_main and self.capture_tag is not None:
            self.buffer.append(data)


def parse_menu(html: str) -> dict[str, object]:
    parser = MainTextParser()
    parser.feed(html)

    week = next(
        (
            text
            for tag, text in parser.tokens
            if tag == "p"
            and re.search(r"\d{1,2}\.\s+\S+\s+\d{4}\s+[–-]\s+\d{1,2}\.", text)
        ),
        "",
    )

    days: list[dict[str, object]] = []
    current_day: dict[str, object] | None = None
    pending_menu: dict[str, str] | None = None

    for tag, text in parser.tokens:
        if tag == "h3" and text in WEEKDAYS:
            current_day = {"day": text, "menus": []}
            days.append(current_day)
            pending_menu = None
            continue

        if current_day is None:
            continue

        if tag == "ul" and "GESCHLOSSEN" in text.upper():
            current_day["closed"] = "Geschlossen"
            pending_menu = None
            continue

        if tag == "ul":
            match = re.search(r"(Menü\s*\d+)\s+(\d+(?:[.,]\d+)?\s*CHF)", text, re.IGNORECASE)
            if match:
                pending_menu = {"name": match.group(1), "price": match.group(2)}
            continue

        if tag == "p" and pending_menu is not None:
            starter = ""
            dish = text
            if dish.lower().startswith("tagesvorspeise"):
                starter = "Tagesvorspeise"
                dish = dish[len("Tagesvorspeise") :].strip(" :-")

            menu = {**pending_menu, "starter": starter, "dish": dish}
            menus = current_day.get("menus")
            if isinstance(menus, list):
                menus.append(menu)
            pending_menu = None

    days = [day for day in days if day.get("closed") or day.get("menus")]
    menu_count = sum(len(day.get("menus", [])) for day in days)
    if not week or menu_count == 0:
        raise RuntimeError("Die Menüseite enthielt kein plausibles Wochenmenü.")

    return {"source": SOURCE_URL, "week": week, "days": days}


def main() -> None:
    request = Request(
        SOURCE_URL,
        headers={
            "User-Agent": "CocillosTV weekly-menu updater (+https://github.com/arontscherrig/CocillosTV)",
            "Accept-Language": "de-CH,de;q=0.9",
        },
    )
    with urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8", errors="replace")

    fresh = parse_menu(html)
    existing: dict[str, object] = {}
    if OUTPUT_PATH.exists():
        existing = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))

    existing_comparable = {key: value for key, value in existing.items() if key != "updatedAt"}
    if existing_comparable == fresh:
        print("Wochenmenü ist unverändert.")
        return

    payload = {
        "source": fresh["source"],
        "week": fresh["week"],
        "updatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "days": fresh["days"],
    }
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wochenmenü aktualisiert: {payload['week']}")


if __name__ == "__main__":
    main()
