'use client'

import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'

const EMOJIS = [
  '😊','😂','🥰','😍','🤩','😎','🥺','😢','😭','😤',
  '😅','🤣','😆','😋','😜','🤪','😏','🙄','😑','🤔',
  '🥳','🎉','🔥','💯','✨','💫','⭐','🌟','💥','🎊',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💖',
  '💗','💓','💞','💝','❣️','💔','😻','🫶','👍','👎',
  '👏','🙌','🤝','🫂','💪','🙏','👋','✌️','🤞','🫰',
  '😘','🥹','🫠','😇','🤗','🫡','🤫','😶','😌','😒',
  '😞','😔','😟','😣','😖','😫','😩','🤯','😳','🥴',
  '😵','🤒','😷','🤧','🥵','🥶','😴','💤','🤤','😪',
  '👀','🫣','🙈','🙉','🙊','💀','☠️','👻','😈','🤡',
]

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500 hover:text-purple-600"
      >
        <Smile className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 w-72 z-50">
          <div className="grid grid-cols-10 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onSelect(emoji); setOpen(false) }}
                className="text-xl hover:bg-gray-100 rounded-lg p-1 transition leading-none"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
