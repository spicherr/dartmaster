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
- Kompakte, scrollbare Wurfübersicht mit Aufnahme und Restwert je Spieler sowie kumulierter Pfeilzahl in der Mitte
- Antippbare Aufnahmewerte mit Dialog zur nachträglichen Korrektur und automatischer Neuberechnung der Restwerte
- Zehn vorkonfigurierte Hotkeys: 26, 40, 41, 43, 45, 60, 81, 85, 100 und 140
- Best-of-3-Match mit automatischem Leg-Wechsel; nach zwei Leg-Siegen steht der Matchgewinner fest
- Getrennte Anzeige von Leg-AVG und übergreifendem Game-AVG

## Projektstruktur

- `src/app/scoreboard/`: Scoreboard-Component mit Spielstand, Eingabe, Zugwechsel und Wurfübersicht
- `src/app/config/scoreboard.config.ts`: Zentrale Konfiguration der Hotkey-Werte
- `src/app/shared/`: Gemeinsame Modelle und Default-Hotkeys

## Starten

```bash
npm install
npm start
```

Die Anwendung ist anschließend unter `http://localhost:4200` erreichbar.

## GitHub Pages

Das Projekt verwendet `angular-cli-ghpages`. Nach dem Push auf GitHub kann die Seite mit folgendem Befehl auf den Branch `gh-pages` veröffentlicht werden:

```bash
npm run deploy
```

Die Anwendung ist danach unter `https://spicherr.github.io/dartmaster/` erreichbar. In den Repository-Einstellungen unter **Pages** den Branch `gh-pages` als Quelle auswählen.

## Bedienung

Punktwerte werden über das Touch-Keypad eingegeben. Ohne eingegebene Zahl trägt `NO SCORE` eine Null-Aufnahme ein; sobald eine Zahl eingegeben wurde, wird daraus `SUBMIT`. Ohne Eingabe setzt `BACK` die letzte Aufnahme zurück und bringt den entsprechenden Spieler wieder an den Zug; bei einer laufenden Eingabe wird die Taste zu `CLEAR`. Die Restwerte werden für beide Spieler mit AVG, letztem Wurf und S/L angezeigt. Ein Tipp auf einen Wert in der Wurfübersicht öffnet die Korrektur.
