import { useCallback, useEffect, useState } from 'react'
import type { AssembleResult } from '../core/assembler'
import { Dialog } from './Dialog'
import { Editor } from './Editor'
import { PauseIcon, PhaseIcon, PlayIcon, StepIcon, StopIcon } from './Icons'
import { InputField } from './InputField'
import { MenuBar } from './Menu'
import { Accumulator, GroupBox, InstructionRegister, MemoryList, OutputList, Register, StackList } from './Panels'
import { useMachine } from './useMachine'

const DEFAULT_SOURCE = `; Addition zweier Zahlen
\tinm zahl1\t; erste Zahl einlesen
\tinm zahl2\t; zweite Zahl einlesen
\tlda zahl1
\tadd zahl2
\tsta summe
\toutm summe\t; Ergebnis ausgeben
\tstop

zahl1\tdef 0
zahl2\tdef 0
summe\tdef 0
`

const SOURCE_KEY = 'mnemo.source'
const NAME_KEY = 'mnemo.filename'

type Doc = { title: string; src: string }
const DOCS: Record<string, Doc> = {
  einfuehrung: { title: 'Einführung', src: './docs/einfuehrung.htm' },
  befehlssatz: { title: 'Befehlssatz', src: './docs/befehlssatz.htm' },
  blatt1: { title: 'Aufgaben – Blatt 1', src: './docs/aufgaben01.htm' },
}

const PHASE_LABEL = { fetch: 'Holphase', decode: 'Dekodierphase', execute: 'Ausführungsphase' } as const

export default function App() {
  const m = useMachine()
  const { cpu } = m
  const [source, setSource] = useState(() => localStorage.getItem(SOURCE_KEY) ?? DEFAULT_SOURCE)
  const [fileName, setFileName] = useState(() => localStorage.getItem(NAME_KEY) ?? 'programm.mno')
  const [lineOfAddress, setLineOfAddress] = useState<(number | null)[]>([])
  const [showEditor, setShowEditor] = useState(true)
  const [showStack, setShowStack] = useState(false)
  const [doc, setDoc] = useState<Doc | null>(null)
  const [about, setAbout] = useState(false)

  useEffect(() => localStorage.setItem(SOURCE_KEY, source), [source])
  useEffect(() => localStorage.setItem(NAME_KEY, fileName), [fileName])

  const onAssembled = useCallback(
    (r: AssembleResult) => {
      if (!r.ok) return
      setLineOfAddress(r.lineOfAddress)
      m.reset(r.memory)
    },
    [m],
  )

  const halted = cpu.state === 'halted' || cpu.state === 'error'
  const currentLine = lineOfAddress[cpu.phase === 'fetch' ? cpu.pc : (cpu.pc + 255) % 256] ?? null
  const status =
    cpu.state === 'input'
      ? 'Warte auf Eingabe …'
      : cpu.state === 'halted'
        ? 'Programm beendet (stop).'
        : cpu.state === 'error'
          ? `Fehler: ${cpu.error}`
          : m.running
            ? 'Programm läuft …'
            : `Bereit – nächste Phase: ${PHASE_LABEL[cpu.phase]}`

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 text-white">
        <img src="./favicon.ico" alt="" className="h-5 w-5" />
        <h1 className="font-bold">Modellrechner Mnemo</h1>
      </header>
      <MenuBar
        menus={[
          { label: 'Stack', items: [{ label: 'anzeigen', checked: showStack, onSelect: () => setShowStack((s) => !s) }] },
          { label: 'Aufgaben', items: [{ label: 'Blatt 1', onSelect: () => setDoc(DOCS.blatt1) }] },
          {
            label: 'Hilfe',
            items: [
              { label: 'Einführung', onSelect: () => setDoc(DOCS.einfuehrung) },
              { label: 'Befehlssatz', onSelect: () => setDoc(DOCS.befehlssatz) },
              { label: 'about', onSelect: () => setAbout(true) },
            ],
          },
        ]}
      />

      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3 lg:flex-row">
        <div className="grid min-h-0 shrink-0 gap-3 lg:h-full lg:w-[min(760px,60%)]" style={{ gridTemplateRows: 'minmax(0,1fr) auto' }}>
          <div className={`grid min-h-[360px] gap-3 ${showStack ? 'grid-cols-[170px_1fr_170px]' : 'grid-cols-[170px_1fr]'}`}>
            <div className="flex flex-col gap-3">
              <GroupBox title="Rechenwerk">
                <Accumulator value={cpu.ac} />
              </GroupBox>
              <GroupBox title="Steuerwerk" className="flex-1">
                <div className="flex flex-col gap-2">
                  <Register label="PC (Program Counter)" value={String(cpu.pc).padStart(3, '0')} />
                  <InstructionRegister value={cpu.ir} />
                  <p className="text-xs text-gray-700">{PHASE_LABEL[cpu.phase]} als Nächstes</p>
                </div>
              </GroupBox>
            </div>
            <GroupBox title="Speicherwerk" className="flex min-h-0 flex-col">
              <div className="mb-2 flex gap-2">
                <Register label="AR (Address-Register)" value={String(cpu.ar).padStart(3, '0')} />
                <Register label="DR (Data-Register)" value={formatDr(cpu.dr)} />
              </div>
              <div className="min-h-0 flex-1">
                <MemoryList memory={cpu.mem} pc={cpu.pc} ar={cpu.ar} />
              </div>
            </GroupBox>
            {showStack && (
              <GroupBox title="Stack" className="flex min-h-0 flex-col">
                <div className="mb-2 flex gap-2">
                  <Register label="SP" value={String(cpu.sp).padStart(3, '0')} />
                  <Register label="BP" value={String(cpu.bp).padStart(3, '0')} />
                </div>
                <div className="min-h-0 flex-1">
                  <StackList memory={cpu.mem} sp={cpu.sp} bp={cpu.bp} />
                </div>
              </GroupBox>
            )}
          </div>

          <div className="grid grid-cols-[170px_1fr_1fr] gap-3">
            <GroupBox title="Steuerung">
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <button type="button" className="btn px-2! py-1.5!" title="Einzelschritt (ein Befehl)" aria-label="Einzelschritt" onClick={m.step} disabled={m.running || cpu.state !== 'ready'}>
                    <StepIcon />
                  </button>
                  <button type="button" className="btn px-2! py-1.5!" title="Eine Phase (Holen/Dekodieren/Ausführen)" aria-label="Phase" onClick={m.microStep} disabled={m.running || cpu.state !== 'ready'}>
                    <PhaseIcon />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button type="button" className="btn px-2! py-1.5! text-green-800" title="Start" aria-label="Start" onClick={m.run} disabled={m.running || halted}>
                    <PlayIcon />
                  </button>
                  <button type="button" className="btn px-2! py-1.5!" title="Pause" aria-label="Pause" onClick={m.pause} disabled={!m.running}>
                    <PauseIcon />
                  </button>
                  <button type="button" className="btn px-2! py-1.5! text-red-800" title="Zurücksetzen" aria-label="Zurücksetzen" onClick={() => m.reset()}>
                    <StopIcon />
                  </button>
                </div>
                <label className="w-full text-xs">
                  Pause nach jedem Befehl
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={50}
                    value={m.delay}
                    onChange={(e) => m.setDelay(Number(e.target.value))}
                    className="w-full"
                    aria-label="Pause nach jedem Befehl"
                  />
                  <span className="flex justify-between">
                    <span>klein</span>
                    <span>{m.delay} ms</span>
                    <span>groß</span>
                  </span>
                </label>
              </div>
            </GroupBox>
            <GroupBox title="Eingabe">
              <div className="flex h-full flex-col gap-3">
                <InputField active={cpu.state === 'input'} onSubmit={m.provideInput} />
                <p className={`text-xs ${cpu.state === 'error' ? 'text-red-700' : 'text-gray-700'}`} role="status">
                  {status}
                </p>
                <button type="button" className="btn mt-auto self-center px-8!" onClick={() => setShowEditor((s) => !s)} aria-pressed={showEditor}>
                  Editor
                </button>
              </div>
            </GroupBox>
            <GroupBox title="Ausgabe" className="flex flex-col">
              <div className="h-32">
                <OutputList values={cpu.output} />
              </div>
            </GroupBox>
          </div>
        </div>

        {showEditor && (
          <GroupBox title={`Editor – ${fileName}`} className="flex min-h-[480px] min-w-0 flex-1 flex-col lg:min-h-0">
            <Editor
              source={source}
              onChange={setSource}
              onAssembled={onAssembled}
              currentLine={currentLine}
              fileName={fileName}
              onFileNameChange={setFileName}
            />
          </GroupBox>
        )}
      </main>

      {m.alert && (
        <Dialog title="Mnemo" onClose={m.dismissAlert}>
          <p className="mb-4">{m.alert}</p>
          <button type="button" className="btn self-center px-8!" onClick={m.dismissAlert} autoFocus>
            OK
          </button>
        </Dialog>
      )}
      {doc && (
        <Dialog title={doc.title} onClose={() => setDoc(null)} wide>
          <iframe title={doc.title} src={doc.src} className="sunken min-h-0 w-full flex-1" />
        </Dialog>
      )}
      {about && (
        <Dialog title="about" onClose={() => setAbout(false)}>
          <p className="mb-2 font-bold">Modellrechner MNemo – Web-Version</p>
          <p className="mb-2">Nachbau des Unterrichtsprogramms MNemo 3.2 als Webapp: 256 Speicherzellen à 16 Bit, Akkumulator, Stack und 56 Befehle.</p>
          <button type="button" className="btn self-center px-8!" onClick={() => setAbout(false)} autoFocus>
            OK
          </button>
        </Dialog>
      )}
    </div>
  )
}

function formatDr(word: number) {
  return word < 0x8000 ? String(word) : `${word} (${word - 0x10000})`
}
