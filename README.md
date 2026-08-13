# dartmaster

Ein schlankes Dart-Scoreboard als Angular-Webapp.

## Aktueller Umfang

- 501-Scoreboard für zwei abwechselnd spielende Personen
- Touchscreen-optimierte Eingabe einer Aufnahme von 0 bis 180 Punkten
- Zahlen-Keypad mit kontextabhängigem `BACK`/`CLEAR`, Eingabeanzeige und dynamischer `NO SCORE`/`SUBMIT`-Taste
- Dynamische `180`/`0`-Taste: ohne Eingabe wird 180 eingetragen, nach begonnener Eingabe wird die Taste zur Ziffer 0
- Double-out-Regel: Eine Aufnahme darf keinen Restwert von 1 hinterlassen; das Leg endet frühestens bei Restwert 2
- Jede normale Aufnahme zählt als drei Pfeile; beim Checkout werden verwendete Pfeile und Pfeile aufs Doppel abgefragt, damit Pfeilzahl und 3-Dart-AVG stimmen
- Eingabefehler erscheinen direkt oberhalb der Tastatur, ohne deren Position zu verschieben
- Wurfübersicht nach Spieler-Wurfnummer: Spieler 1 Wurf 1, Spieler 2 Wurf 1, Spieler 1 Wurf 2 usw.
- Antippbare Aufnahmewerte mit Dialog zur nachträglichen Korrektur und automatischer Neuberechnung der Restwerte
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

Punktwerte werden über das Touch-Keypad eingegeben. Ohne eingegebene Zahl trägt `NO SCORE` eine Null-Aufnahme ein; sobald eine Zahl eingegeben wurde, wird daraus `SUBMIT`. Ohne Eingabe setzt `BACK` die letzte Aufnahme zurück und bringt den entsprechenden Spieler wieder an den Zug; bei einer laufenden Eingabe wird die Taste zu `CLEAR`. Die Restwerte werden für beide Spieler gleichwertig mit Anzahl Würfen, 3-Dart-AVG und letztem Wurf angezeigt. Ein Tipp auf einen Wert in der Wurfübersicht öffnet die Korrektur. Die Hotkey-Slots lassen sich über das Zahnrad oben rechts anpassen.
