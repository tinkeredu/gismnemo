import { useEffect, useRef, useState } from 'react'

export interface MenuItem {
  label: string
  onSelect: () => void
  checked?: boolean
}

export function MenuBar({ menus }: { menus: { label: string; items: MenuItem[] }[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(null)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <nav ref={ref} data-guide="menu" className="relative flex border-b border-[#808080] bg-[#d4d0c8] select-none" role="menubar">
      {menus.map((m, i) => (
        <div key={m.label} className="relative">
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open === i}
            className={`px-2 py-0.5 ${open === i ? 'bg-[#0a246a] text-white' : ''}`}
            onClick={() => setOpen(open === i ? null : i)}
            onMouseEnter={() => open !== null && setOpen(i)}
          >
            {m.label}
          </button>
          {open === i && (
            <div role="menu" className="absolute top-full left-0 z-40 min-w-44 border-2 border-[#fff_#404040_#404040_#fff] bg-[#d4d0c8] py-0.5 shadow">
              {m.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className="flex w-full gap-2 px-2 py-0.5 text-left hover:bg-[#0a246a] hover:text-white"
                  onClick={() => {
                    setOpen(null)
                    item.onSelect()
                  }}
                >
                  <span className="w-3">{item.checked ? '✓' : ''}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
