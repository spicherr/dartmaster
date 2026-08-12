# dartmaster

Ein schlankes Dart-Scoreboard als Angular-Webapp.

## Aktueller Umfang

- 501-Scoreboard für zwei abwechselnd spielende Personen
- Touchscreen-optimierte Eingabe einer Aufnahme von 0 bis 180 Punkten
- Zahlen-Keypad mit `CLEAR`, Eingabeanzeige und dynamischer `MISS`/`SUBMIT`-Taste
- Dynamische `180`/`0`-Taste: ohne Eingabe wird 180 eingetragen, nach begonnener Eingabe wird die Taste zur Ziffer 0
- Wurfübersicht nach Spieler-Wurfnummer: Spieler 1 Wurf 1, Spieler 2 Wurf 1, Spieler 1 Wurf 2 usw.
- Rückgängig-Funktion und Neustart eines Legs
- Schnellzugriff über zehn frei konfigurierbare Hotkey-Slots
- Speicherung der Hotkey-Konfiguration im lokalen Browser-Speicher

## Projektstruktur

- `frontend/src/app/scoreboard/`: Scoreboard-Component mit Spielstand, Eingabe, Zugwechsel und Wurfübersicht
- `frontend/src/app/hotkey-settings/`: Component für die Hotkey-Konfiguration
- `frontend/src/app/shared/`: Gemeinsame Modelle und Default-Hotkeys

## Starten

```bash
cd frontend
npm install
npm start
```

Die Anwendung ist anschließend unter `http://localhost:4200` erreichbar.

## Bedienung

Punktwerte werden über das Touch-Keypad eingegeben. Ohne eingegebene Zahl trägt `MISS` eine Null-Aufnahme ein; sobald eine Zahl eingegeben wurde, wird daraus `SUBMIT`. Die Hotkey-Slots lassen sich über das Zahnrad oben rechts anpassen.
