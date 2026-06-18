import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import clsx from 'clsx'

interface AutocompleteProps {
  suggestions: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  icon?: boolean
  label?: string
}

export default function Autocomplete({
  suggestions,
  value,
  onChange,
  placeholder,
  className = '',
  icon = false,
  label,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 10) // Limit to 10 suggestions

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) {
      if (e.key === 'ArrowDown' && filtered.length > 0) {
        setIsOpen(true)
        setHighlightedIndex(0)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filtered.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filtered.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          handleSelect(filtered[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return text
    return (
      <>
        {text.slice(0, index)}
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <MapPin className="w-4 h-4" />
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(-1)
          }}
          onFocus={() => {
            if (filtered.length > 0) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={clsx(
            icon && 'pl-10',
            className
          )}
        />
      </div>
      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          className={clsx(
            'absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-xl shadow-lg',
            'bg-white dark:bg-slate-800',
            'border border-gray-200 dark:border-slate-700',
            'animate-fade-in'
          )}
        >
          {filtered.map((item, index) => (
            <li
              key={item}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={clsx(
                'px-3 py-2.5 cursor-pointer text-sm flex items-center gap-2 transition-colors',
                index === highlightedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              )}
            >
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <span>{highlightMatch(item, value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
