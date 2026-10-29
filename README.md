# Modellrechner MNemo – Web-Version

Nachbau des Unterrichtsprogramms **MNemo 3.2** (Modellrechner mit Assembler) als Webapp.

- 256 Speicherzellen à 16 Bit, Register AC, PC, IR, AR, DR sowie Stack mit SP/BP
- alle 56 Befehle des Originals (`lda` … `divb`), Assembler mit `DEF`, `EQUAL`, Sprungmarken und `;`-Kommentaren
- Fehlermeldungen und Hinweise wie im Original (Zeilennummern ab 0)
- Einzelschritt, Phasen-Schritt (Holen/Dekodieren/Ausführen), Start/Pause/Reset, einstellbare Pause nach jedem Befehl
- Editor mit Öffnen/Speichern von `.mno`-Dateien, Quelltext wird im Browser gespeichert
- Einführung, Befehlssatz und interaktiver Guide im Menü „Hilfe“
- Skins unter „Ansicht“: Automatisch (System hell/dunkel), Hell, Dunkel, Klassisch (Windows), Terminal

## Entwicklung

Benötigt Node ≥ 22.12.

```sh
npm install
npm run dev      # Entwicklungsserver
npm test         # Assembler-/CPU-Tests (Vitest)
npm run lint     # oxlint
npm run build    # Typecheck + Produktionsbuild nach dist/ (relative Pfade, statisch hostbar)
```

Assembler und Rechner (`src/core`) sind UI-unabhängig; das Verhalten wurde am Original-Programm (unter Wine) nachgemessen.
