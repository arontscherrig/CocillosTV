# CocillosTV

Ein eigenständiger, browserbasierter Vereinsbildschirm für die Guggumüsig Cocillos.

## Funktionen

- automatische, einstellbare Seitenrotation
- Live-Uhr und Wetter
- eigene Karte mit Markierungen
- Roundshot-Webcam als Bild oder eingebettete Seite
- Termine und Countdown
- Vereinsfotos
- To-do-Liste und Mitteilungen
- Vollbild- und Pausensteuerung

## Konfiguration

Die Vereinsdaten werden zentral in `config.js` gepflegt. Dort lassen sich Ort, Koordinaten, Webcam-Link, Karteneinträge, Termine, Fotos, Aufgaben und Anzeigedauer ändern.

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
