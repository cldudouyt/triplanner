import { useState } from 'react'
import { Bot, X } from 'lucide-react'
import CoachChat from './CoachChat'

export default function CoachButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center transition-all hover:scale-105"
        title="Coach IA"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
      {open && <CoachChat onClose={() => setOpen(false)} />}
    </>
  )
}
