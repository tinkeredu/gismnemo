import { useEffect, useRef, type ReactNode } from 'react'
import { formatInstruction, formatMemoryCell, formatStackCell, formatValue } from '../core/format'
import { MEMORY_SIZE, STACK_START } from '../core/isa'

export function GroupBox({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`group-box ${className}`} aria-label={title}>
      <span className="legend">{title}</span>
      {children}
    </section>
  )
}

export function Register({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs">{label}</span>
      <output
        className={`sunken block min-w-28 px-1 font-mono whitespace-pre ${highlight ? 'bg-yellow-100!' : ''}`}
        aria-label={label}
      >
        {value}
      </output>
    </label>
  )
}

export function Accumulator({ value }: { value: number }) {
  return (
    <label className="block">
      <span className="block text-xs">AC (Accumulator)</span>
      <output aria-label="AC" className="block border-2 border-[#808080] bg-black px-1 font-mono text-lg text-lime-400">
        {formatValue(value)}
      </output>
    </label>
  )
}

export function InstructionRegister({ value }: { value: number }) {
  return <Register label="IR (Instruction-Register)" value={formatInstruction(value)} />
}

export function MemoryList({ memory, pc, ar, onSelect }: { memory: number[]; pc: number; ar: number; onSelect?: (addr: number) => void }) {
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const list = listRef.current
    const row = list?.children[pc] as HTMLElement | undefined
    if (!list || !row) return
    if (row.offsetTop < list.scrollTop || row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = row.offsetTop - list.clientHeight / 3
    }
  }, [pc])
  return (
    <div ref={listRef} role="listbox" aria-label="Speicher" className="sunken relative h-full min-h-48 overflow-y-auto font-mono text-[13px] leading-[18px]">
      {Array.from({ length: MEMORY_SIZE }, (_, addr) => (
        <div
          key={addr}
          role="option"
          aria-selected={addr === pc}
          onClick={() => onSelect?.(addr)}
          className={`px-1 whitespace-pre ${addr === pc ? 'bg-[#0a246a] text-white' : addr === ar ? 'bg-yellow-100' : ''}`}
        >
          {formatMemoryCell(addr, memory[addr])}
        </div>
      ))}
    </div>
  )
}

export function StackList({ memory, sp, bp }: { memory: number[]; sp: number; bp: number }) {
  const rows = []
  for (let addr = STACK_START; addr >= sp; addr--) {
    const marks = [addr === sp ? 'SP' : '', addr === bp ? 'BP' : ''].filter(Boolean).join(',')
    rows.push(
      <div key={addr} className={`flex gap-2 px-1 whitespace-pre ${addr === sp ? 'text-gray-500' : ''}`}>
        <span>{formatStackCell(addr, memory[addr])}</span>
        <span className="text-xs leading-[18px] text-blue-800">{marks}</span>
      </div>,
    )
  }
  return (
    <div aria-label="Stack" className="sunken h-full min-h-32 overflow-y-auto font-mono text-[13px] leading-[18px]">
      {rows}
    </div>
  )
}

export function OutputList({ values }: { values: number[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [values.length])
  return (
    <div ref={ref} aria-label="Ausgabe" className="sunken h-full min-h-24 overflow-y-auto font-mono text-[13px] leading-[18px]">
      {values.map((v, i) => (
        <div key={i} className="px-1">
          {formatValue(v)}
        </div>
      ))}
    </div>
  )
}
