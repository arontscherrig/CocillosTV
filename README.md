# CocillosTV

Ein eigenständiger, browserbasierter Vereinsbildschirm für die Guggumüsig Cocillos.

## Funktionen

- automatische, einstellbare Seitenrotation
- Live-Uhr, detailliertes Wetter und 5-Tage-Prognose
- Niederschlagsmengen und modellbasierte Hinweise auf markantes Wetter
- amtliche Waldbrand-/Feuerverbotsdaten für das Wallis und SLF-Lawinenstufen
- eigene Karte mit Markierungen
- Roundshot-Webcam als automatisch aktualisiertes Livebild
- Konzertmeister-Termine aus iCalendar mit Countdown
- eigener Unterhalts- und To-do-Plan mit nächstem Einsatz, Team und Wochenarbeiten
- monatlicher Hock mit automatisch berechnetem ersten Freitag und aktuellem Wochenmenü
- eigener TWINT-Slide für die Getränkekasse im Vereinslokal
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

## Konzertmeister-Termine

Die Datei `data/konzertmeister.ical` wird beim Laden des TVs eingelesen und alle 15 Minuten erneut abgerufen. Die Übersicht zeigt den nächsten Termin. Auf der Terminseite stehen normale Gesamt- und Registerproben getrennt von Probetagen, Proben für Ehemalige und Auftritten. Alle Zeiten werden in `Europe/Zurich` dargestellt; Mehrtagestermine zeigen Start und Ende, Termine ohne bekannte Uhrzeit erscheinen als „Zeit offen“.

Der veröffentlichte Export ist bereinigt: Direkte Konzertmeister-Links, Termin-IDs und Export-Zeitstempel wurden entfernt. Da die hochgeladene Datei keine abonnierbare Kalenderadresse enthält, muss sie bei Änderungen durch einen neuen bereinigten Export ersetzt werden.

## Unterhalt und To-do

Die eigene Unterhaltsseite basiert auf `maintenance` in `config.js`. Sie zeigt den nächsten anstehenden Einsatz gross, danach die folgenden fünf Einteilungen sowie die vier wöchentlichen Reinigungsbereiche. Einsätze bleiben am jeweiligen Datum den ganzen Tag sichtbar und verschwinden ab dem Folgetag. Die Endreinigung am 13. Februar 2027 ist Teil des Plans.

## Nächster Hock und Wochenmenü

Die Hock-Seite zeigt automatisch den nächsten ersten Freitag eines Monats. Ist der erste Freitag des laufenden Monats bereits vorbei, wird der erste Freitag des Folgemonats angezeigt.

Das als **Werbung** gekennzeichnete Wochenmenü stammt vom [Restaurant Simplon](https://restaurant-simplon.ch/wochenmenue/). Der Workflow `.github/workflows/update-weekly-menu.yml` prüft die Quelle von Montag bis Freitag am Morgen. `data/weekly-menu.json` wird nur dann neu committed, wenn sich das veröffentlichte Menü tatsächlich verändert hat. Bei einem vorübergehenden Abruffehler bleibt der letzte erfolgreiche Stand sichtbar.

## Getränkekasse mit TWINT

Der Getränkekassen-Slide zeigt den offiziellen Zahlungs-QR-Code aus `assets/payment/twint-getraenkekasse.jpeg`. Der Code wird unverändert angezeigt und mit einer kurzen Zahlungsanleitung ergänzt. Beim Ersetzen muss wieder der vollständige Original-QR-Code inklusive weissem Rand verwendet werden, damit er zuverlässig scanbar bleibt.

## Aletschbord-Webcam

Die Webcam-Seite lädt das aktuelle Panorama der Aletschbord-Kamera direkt über den Roundshot-Bildendpunkt und aktualisiert es alle fünf Minuten. Der Ausschnitt ist anhand der Kameraausrichtung fest auf 180° (Süden) zentriert und zeigt ins Tal; eine Rundumfahrt findet nicht statt. Die interaktive Roundshot-App samt Cookie-Dialog wird nicht geladen. Beim Abruf des Bildes wird dennoch eine direkte Verbindung zu Roundshot und dessen Speicher-CDN aufgebaut; dabei wird die öffentliche IP-Adresse des Fernsehers technisch an diese Anbieter übermittelt.

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
