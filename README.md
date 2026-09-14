# CocillosTV

Ein eigenständiger, browserbasierter Vereinsbildschirm für die Guggumüsig Cocillos.

## Funktionen

- automatische, einstellbare Seitenrotation
- Live-Uhr, detailliertes Wetter und 5-Tage-Prognose
- Niederschlagsmengen und modellbasierte Hinweise auf markantes Wetter
- amtliche Waldbrand-/Feuerverbotsdaten für das Wallis und SLF-Lawinenstufen
- eigene Karte mit Markierungen
- Roundshot-Webcam als Bild oder eingebettete Seite
- Termine und Countdown
- Vereinsfotos
- To-do-Liste und Mitteilungen
- Vollbild- und Pausensteuerung

## Konfiguration

Die Vereinsdaten werden zentral in `config.js` gepflegt. Dort lassen sich Ort, Koordinaten, Webcam-Link, Karteneinträge, Termine, Fotos, Aufgaben und Anzeigedauer ändern.

Unter `weather.fireRegions` werden die gewünschten BAFU-Waldbrandregionen gewählt. `weather.avalancheRegionPrefixes` begrenzt das SLF-Bulletin auf die gewünschten Lawinenwarnregionen. Standardmässig ist das Oberwallis eingestellt.

## Wetter- und Gefahrendaten

- Prognose: Open-Meteo (ohne API-Schlüssel)
- Waldbrandgefahr und Feuerverbote: BAFU und Kantone
- Lawinengefahr: WSL-Institut für Schnee- und Lawinenforschung SLF
- Hochwasser und weitere amtliche Warnungen: Verlinkung auf das Naturgefahrenportal des Bundes

Die Wetterseite trennt modellbasierte Prognosehinweise ausdrücklich von amtlichen Warnungen. Massgebend bleiben immer die verlinkten Behördeninformationen. Es werden keine Cookies gesetzt und keine personenbezogenen Daten gespeichert.

Der Workflow `.github/workflows/update-hazards.yml` prüft die amtlichen BAFU- und SLF-Daten alle 30 Minuten. Er schreibt nur dann einen neuen Commit, wenn sich die Gefahrenlage tatsächlich geändert hat. GitHub Actions muss für das Repository aktiviert sein.

## Roundshot Naters

Die 360°-Livecam `https://naters.roundshot.com/#/` ist als iframe auf der Webcam-Seite eingebunden. Roundshot erlaubt die technische Einbettung; die Antwort enthält weder `X-Frame-Options` noch eine blockierende `frame-ancestors`-Richtlinie. Beim Anzeigen wird eine direkte Verbindung zu Roundshot und dessen statischem CDN aufgebaut, wodurch die öffentliche IP-Adresse des Fernsehers technisch an diese Anbieter übermittelt wird.

## Lokal testen

`index.html` kann direkt im Browser geöffnet werden. Wegen Browser-Sicherheitsregeln funktionieren externe Inhalte zuverlässiger über einen kleinen lokalen Webserver:

```bash
python -m http.server 8080
```

Danach `http://localhost:8080` öffnen.

## GitHub Pages

Unter **Settings → Pages** die Quelle **Deploy from a branch**, Branch **main** und Ordner **/(root)** auswählen. Anschliessend ist der Bildschirm unter `https://arontscherrig.github.io/CocillosTV/` erreichbar.

## Bedienung

- Pfeiltasten: vorherige/nächste Seite
- Leertaste: Rotation pausieren/fortsetzen
- `F`: Vollbild
- Maus auf den Bildschirm bewegen: Steuerung einblenden

Dieses Repository ist vollständig unabhängig von `CocillosShop`.
