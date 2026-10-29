import type { ReactNode } from 'react'

export const GUIDE_PROGRAM = `; Guide: zwei Zahlen addieren
\tinm zahl1\t; erste Zahl einlesen
\tinm zahl2\t; zweite Zahl einlesen
\tlda zahl1\t; AC := zahl1
\tadd zahl2\t; AC := AC + zahl2
\tsta summe\t; summe := AC
\toutm summe\t; summe ausgeben
\tstop

zahl1\tdef 0
zahl2\tdef 0
summe\tdef 0
`

export interface GuideContext {
  load: (source: string) => void
  microStep: () => void
  step: () => void
  provideInput: (value: number) => void
  showStack: (show: boolean) => void
}

export interface GuideStep {
  title: string
  /** `data-guide` value of the element to highlight. */
  target?: string
  body: ReactNode
  /** Applied when the step is entered; all previous steps are replayed first. */
  apply?: (ctx: GuideContext) => void
}

const k = (s: string) => <code className="rounded bg-code px-1 font-mono">{s}</code>

export const GUIDE_STEPS: GuideStep[] = [
  {
    title: 'Willkommen bei MNemo',
    body: (
      <>
        <p>MNemo ist ein Modellrechner nach dem von-Neumann-Prinzip: Programm und Daten liegen gemeinsam im Speicher, ein Steuerwerk holt Befehl für Befehl und das Rechenwerk rechnet.</p>
        <p>Der Guide lädt ein kleines Beispielprogramm und führt es Schritt für Schritt aus. Dein eigenes Programm wird danach wiederhergestellt.</p>
      </>
    ),
  },
  {
    title: 'Der Editor',
    target: 'editor',
    apply: (c) => c.load(GUIDE_PROGRAM),
    body: (
      <>
        <p>Hier schreibst du das Programm in Mnemonics (z. B. {k('lda')}, {k('add')}). Alles nach {k(';')} ist Kommentar.</p>
        <p>{k('zahl1 def 0')} reserviert eine Speicherzelle (Variable) mit Startwert 0. Mit {k('EQUAL')} definiert man Konstanten, ein allein stehender Name ist eine Sprungmarke.</p>
      </>
    ),
  },
  {
    title: 'Übersetzen',
    target: 'compile',
    body: (
      <>
        <p>„Übersetzen“ (oder Strg+Enter) wandelt den Quelltext in Maschinenwörter um und lädt sie in den Speicher. Fehler und Hinweise erscheinen darunter mit Zeilennummer – ein Klick springt zur Zeile.</p>
        <p>Der Guide hat das Programm bereits übersetzt.</p>
      </>
    ),
  },
  {
    title: 'Das Speicherwerk',
    target: 'memory',
    body: (
      <>
        <p>256 Zellen (000–255) à 16 Bit. Zuerst stehen die Befehle, danach die Variablen: {k('zahl1')} liegt in Zelle 007, {k('zahl2')} in 008, {k('summe')} in 009.</p>
        <p>Ein Befehl ist ein Wort aus Opcode und Adresse: {k('inm 7')} = 25·256 + 7 = 6407. Die Liste lässt sich scrollen; „Gehe zu“ springt zu einer Adresse, die blaue Zeile ist der PC.</p>
      </>
    ),
  },
  {
    title: '1. Holphase (fetch)',
    target: 'steuerwerk',
    apply: (c) => c.microStep(),
    body: (
      <p>Der Befehl an der Adresse im PC wird geholt: PC → AR, Speicherinhalt → DR → IR. Danach wird der PC um 1 erhöht und zeigt auf den nächsten Befehl.</p>
    ),
  },
  {
    title: '2. Dekodierphase (decode)',
    target: 'steuerwerk',
    apply: (c) => c.microStep(),
    body: <p>Das Steuerwerk zerlegt das IR in Opcode ({k('inm')}) und Adresse (7) und bereitet die Ausführung vor.</p>,
  },
  {
    title: '3. Ausführungsphase (execute)',
    target: 'eingabe',
    apply: (c) => c.microStep(),
    body: (
      <p>{k('inm 7')} liest eine Zahl in Zelle 007. Das Programm hält an, das Eingabefeld wird gelb und wartet. Im normalen Betrieb tippst du hier eine Zahl und drückst Enter.</p>
    ),
  },
  {
    title: 'Eingabe',
    target: 'memory',
    apply: (c) => {
      c.provideInput(12)
      c.step()
      c.provideInput(30)
    },
    body: <p>Der Guide hat 12 und 30 eingegeben. Sie stehen jetzt in den Zellen 007 und 008.</p>,
  },
  {
    title: 'Das Rechenwerk',
    target: 'rechenwerk',
    apply: (c) => {
      c.step()
      c.step()
    },
    body: (
      <p>{k('lda zahl1')} lädt 12 in den Akkumulator (AC), {k('add zahl2')} addiert 30. Alle Rechnungen laufen über den AC – Ergebnis 42. Werte ≥ 32768 werden zusätzlich als negative Zahl angezeigt.</p>
    ),
  },
  {
    title: 'Ausgabe',
    target: 'ausgabe',
    apply: (c) => {
      c.step()
      c.step()
      c.step()
    },
    body: <p>{k('sta summe')} speichert den AC in Zelle 009, {k('outm summe')} gibt sie aus, {k('stop')} beendet das Programm.</p>,
  },
  {
    title: 'Steuerung',
    target: 'steuerung',
    body: (
      <ul className="list-disc pl-5">
        <li>Einzelschritt: einen ganzen Befehl ausführen</li>
        <li>Phase: nur Hol-, Dekodier- oder Ausführungsphase</li>
        <li>Start / Pause / Zurücksetzen (setzt Register und Speicher auf das übersetzte Programm zurück)</li>
        <li>„Pause nach jedem Befehl“ regelt das Tempo beim Start</li>
      </ul>
    ),
  },
  {
    title: 'Der Stack',
    target: 'stack',
    apply: (c) => c.showStack(true),
    body: (
      <p>Über „Stack → anzeigen“ siehst du den Stapel ab Zelle 255 abwärts. SP zeigt auf den nächsten freien Platz, BP dient als Basis für {k('ldab')}/{k('stab')}. {k('psh')}/{k('pop')} legen den AC ab bzw. holen ihn, {k('jsr')}/{k('rtn')} speichern die Rücksprungadresse.</p>
    ),
  },
  {
    title: 'Hilfe und Ansicht',
    target: 'menu',
    body: <p>Unter „Hilfe“ findest du die Einführung und den kompletten Befehlssatz, unter „Ansicht“ verschiedene Skins inklusive Darkmode. Viel Spaß beim Programmieren!</p>,
  },
]

