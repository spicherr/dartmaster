# dartmaster

Ein schlankes Dart-Scoreboard als Angular-Webapp.

## Aktueller Umfang

- 501-Scoreboard für zwei abwechselnd spielende Personen
- Touchscreen-optimierte Eingabe einer Aufnahme von 0 bis 180 Punkten
- Zahlen-Keypad mit gleich hohen Zahlen-, Eingabe- und Aktionstasten; darunter stehen `CLEAR` links und die dynamische `NO SCORE`/`SUBMIT`-Taste rechts jeweils in doppelter Tastenbreite
- Dynamische `180`/`0`-Taste: ohne Eingabe wird 180 eingetragen, nach begonnener Eingabe wird die Taste zur Ziffer 0
- Double-out-Regel: Eine Aufnahme darf keinen Restwert von 1 hinterlassen; das Leg endet frühestens bei Restwert 2
- Jede normale Aufnahme zählt als drei Pfeile; beim Checkout werden verwendete Pfeile und Pfeile aufs Doppel abgefragt, damit Pfeilzahl und 3-Dart-AVG stimmen
- Eingabefehler erscheinen direkt oberhalb der Tastatur, ohne deren Position zu verschieben
- Drei kompakte, nicht scrollbare Aufnahmerunden in der Gegenüberstellung beider Spieler; Wurfwerte erscheinen fett und weiß, eine durchgehende graue Mittelspalte mit der Pfeilzahl trennt die Spieler
- Antippbare Aufnahmewerte mit Dialog zur nachträglichen Korrektur und automatischer Neuberechnung der Restwerte
- Zehn vorkonfigurierte Hotkeys: 26, 40, 41, 43, 45, 60, 81, 85, 100 und 140
- Best-of-3-Match mit automatischem Leg-Wechsel; nach zwei Leg-Siegen steht der Matchgewinner fest
- Nach Matchende: Statistikseite mit Resultat, Gesamt- und Leg-AVG, Doppelquote sowie Restscore und Checkout pro Leg für beide Spieler
- Oben zeigen die Spielerblöcke den Spielernamen und die gewonnenen Legs; der Matchgewinner erhält einen goldenen Rahmen und eine Krone
- Darunter deutlich abgesetzte Registerkarten mit hervorgehobenem aktivem Tab für „Spiel“ und alle gespielten Legs, per Klick oder Pfeiltasten auswählbar
- Kompakte Ergebnisboxen und flache Tabs lassen Platz für alle Kennzahlen ohne Scrollen. Der Wertebereich nutzt die volle Breite der Spielerboxen; die Kategorie erhält die Hälfte, jeder Spielerwert ein Viertel. Gleich hohe Zeilen und Schriftgrößen passen sich der verfügbaren Höhe an. Spiel und Legs zeigen dieselben Zeilen: 3-Dart AVG, First 9-Darts AVG, CHECKOUT in %, CHECKOUTS, Höchstes Finish, Höchste Aufnahme, Anzahl Darts, 180, 160+, 140+, 120+, 100+, 80+, 60+ und 40+
- First 9-Darts AVG berücksichtigt die ersten drei Aufnahmen je Spieler und Leg (bei frühem Checkout die tatsächlich geworfenen Darts); im Spiel werden Punkte und Darts dieser Aufnahmen über alle Legs zusammengezählt
- Aufnahme-Kategorien sind getrennte Bereiche: 180, 160–179, 140–159 usw. bis 40–59; jede Aufnahme zählt höchstens einmal
- CHECKOUTS zeigt erfolgreiche Checkouts / Doppelversuche; je Kennzahl wird nur der bessere Wert goldfarben dargestellt, unabhängig vom Matchgewinner. Gleichstände und nicht vergleichbare Werte bleiben neutral. Bei CHECKOUTS zählen zuerst mehr Treffer, dann weniger Versuche. Keine Sieger- oder Restscore-Zeile
- App-Titel und grüner Button „Neues Spiel beginnen“ sind auf Scoreboard und Statistik an den äußeren Rändern der Spielerboxen ausgerichtet; der Button bleibt oberhalb der scrollbaren Statistik sichtbar
- Beide Ansichten zeigen „BEST OF 3 Single In / Double Out“ mittig auf derselben Höhe wie App-Titel und Button, das Scoreboard zusätzlich den aktuellen Leg-Stand, z. B. „(1 / 3)“
- Ein größerer Abstand zwischen „Anzahl Darts“ und „180“ trennt die allgemeinen Kennzahlen von den Aufnahme-Kategorien; Treffer / Doppelversuche erscheinen in derselben Schriftgröße und Stärke wie die übrigen Werte
- „CHECKOUTS“ zeigt erfolgreiche Checkouts / erfasste Doppelversuche, „CHECKOUT in %“ den Prozentwert für das gesamte Spiel und jedes Leg (z. B. 12.5 % und 1 / 8); ohne Versuche werden „–“ und „0 / 0“ angezeigt
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
