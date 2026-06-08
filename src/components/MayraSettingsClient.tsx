'use client'

import { useState } from 'react'
import { Bot, Globe, MessageSquare, Sliders, Save, Loader2, CheckCircle2, Sparkles } from 'lucide-react'

type Settings = {
  bot_name: string
  language: string
  tone: string
  reply_length: string
  custom_instructions: string
}

const TONES = [
  { value: 'casual', label: 'Casual Friend', desc: 'Warm, yaar/bhai, WhatsApp-style texting', emoji: '😊' },
  { value: 'formal', label: 'Formal', desc: 'Polite and professional but still warm', emoji: '🤝' },
  { value: 'supportive', label: 'Supportive', desc: 'Extra empathetic, gentle, emotionally present', emoji: '🫂' },
  { value: 'fun', label: 'Fun & Playful', desc: 'Witty, energetic, light jokes welcome', emoji: '🎉' },
]

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect', desc: 'Matches user\'s language automatically' },
  { value: 'hinglish', label: 'Hinglish', desc: 'Hindi + English mix (most natural)' },
  { value: 'hindi', label: 'Hindi', desc: 'Always replies in Hindi' },
  { value: 'english', label: 'English', desc: 'Always replies in English' },
]

const LENGTHS = [
  { value: 'short', label: 'Short', desc: '2–3 sentences max', example: '"Arre yaar! Sab theek hai? Bata mujhe kya chal raha hai 😊"' },
  { value: 'medium', label: 'Medium', desc: '3–5 sentences', example: '"Arre yaar kya baat hai! Bohot mazaa aaya padh ke. Seriously aaj ka din kaisa gaya tere liye? Kuch exciting hua?"' },
  { value: 'detailed', label: 'Detailed', desc: '5–7 sentences', example: '"Yaar, sach mein bahut achha laga sun ke! Tu toh actually mast insaan hai. Seriously, itni tension ke beech bhi itna sochta/sochti hai — respect! Bata mujhe, ye sab kab se chal raha hai? Aur ghar pe koi support kar raha hai?"' },
]

export default function MayraSettingsClient({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState<Settings>({
    ...initial,
    custom_instructions: initial.custom_instructions ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function update(key: keyof Settings, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/mayra-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const previewTone = TONES.find(t => t.value === settings.tone)
  const previewLength = LENGTHS.find(l => l.value === settings.reply_length)

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#e6f7f1' }}>
            <Bot className="w-5 h-5" style={{ color: '#09AF72' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mayra AI Settings</h1>
            <p className="text-gray-500 text-sm">Customize how {settings.bot_name} talks to your Instagram followers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Settings column */}
        <div className="col-span-2 space-y-5">

          {/* Bot Name */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" style={{ color: '#09AF72' }} />
              <h2 className="font-semibold text-gray-900 text-sm">Bot Identity</h2>
            </div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Bot Name</label>
            <input
              type="text"
              value={settings.bot_name}
              onChange={e => update('bot_name', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#09AF72' } as React.CSSProperties}
              placeholder="Mayra"
              maxLength={30}
            />
            <p className="text-xs text-gray-400 mt-1.5">This name will be used in the AI's identity — it will say "I'm {settings.bot_name || 'Mayra'}" if asked.</p>
          </div>

          {/* Language */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4" style={{ color: '#09AF72' }} />
              <h2 className="font-semibold text-gray-900 text-sm">Language</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => update('language', lang.value)}
                  className={`text-left p-3 rounded-lg border-2 transition ${
                    settings.language === lang.value
                      ? 'border-transparent text-white'
                      : 'border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                  style={settings.language === lang.value ? { backgroundColor: '#09AF72', borderColor: '#09AF72' } : {}}
                >
                  <p className="text-sm font-semibold">{lang.label}</p>
                  <p className={`text-xs mt-0.5 ${settings.language === lang.value ? 'text-white/70' : 'text-gray-400'}`}>{lang.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4" style={{ color: '#09AF72' }} />
              <h2 className="font-semibold text-gray-900 text-sm">Personality Tone</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(tone => (
                <button
                  key={tone.value}
                  onClick={() => update('tone', tone.value)}
                  className={`text-left p-3 rounded-lg border-2 transition ${
                    settings.tone === tone.value
                      ? 'border-transparent text-white'
                      : 'border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                  style={settings.tone === tone.value ? { backgroundColor: '#09AF72', borderColor: '#09AF72' } : {}}
                >
                  <p className="text-sm font-semibold">{tone.emoji} {tone.label}</p>
                  <p className={`text-xs mt-0.5 ${settings.tone === tone.value ? 'text-white/70' : 'text-gray-400'}`}>{tone.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reply Length */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4" style={{ color: '#09AF72' }} />
              <h2 className="font-semibold text-gray-900 text-sm">Reply Length</h2>
            </div>
            <div className="space-y-2">
              {LENGTHS.map(length => (
                <button
                  key={length.value}
                  onClick={() => update('reply_length', length.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition flex items-center gap-3 ${
                    settings.reply_length === length.value
                      ? 'border-transparent text-white'
                      : 'border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                  style={settings.reply_length === length.value ? { backgroundColor: '#09AF72', borderColor: '#09AF72' } : {}}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    settings.reply_length === length.value ? 'border-white' : 'border-gray-300'
                  }`}>
                    {settings.reply_length === length.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{length.label} <span className={`font-normal text-xs ${settings.reply_length === length.value ? 'text-white/70' : 'text-gray-400'}`}>— {length.desc}</span></p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-1">Custom Instructions <span className="font-normal text-gray-400">(optional)</span></h2>
            <p className="text-xs text-gray-400 mb-3">Add any specific rules — e.g. "Always mention our Instagram handle @xyz if asked about pricing"</p>
            <textarea
              value={settings.custom_instructions}
              onChange={e => update('custom_instructions', e.target.value)}
              rows={4}
              placeholder="e.g. If someone asks about pricing, say 'DM us for a custom quote!'"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">{settings.custom_instructions.length}/500</p>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
            style={{ backgroundColor: '#09AF72' }}
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : saved
              ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              : <><Save className="w-4 h-4" /> Save Settings</>
            }
          </button>
        </div>

        {/* Preview column */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-6">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Live Preview</h2>

            {/* Bot identity card */}
            <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ backgroundColor: '#e6f7f1' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#09AF72' }}>
                {(settings.bot_name || 'M').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#0D163F' }}>{settings.bot_name || 'Mayra'}</p>
                <p className="text-xs text-gray-500">{previewTone?.emoji} {previewTone?.label}</p>
              </div>
            </div>

            {/* Sample chat bubble */}
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">U</div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-700 max-w-[80%]">
                  Hey, kya chal raha hai?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-br-sm px-3 py-2 text-sm text-white max-w-[85%]" style={{ backgroundColor: '#09AF72' }}>
                  {previewLength?.example || '"Arre yaar! Sab theek hai? Bata mujhe 😊"'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Language</span>
                <span className="font-medium text-gray-700">{LANGUAGES.find(l => l.value === settings.language)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Tone</span>
                <span className="font-medium text-gray-700">{previewTone?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Reply length</span>
                <span className="font-medium text-gray-700">{previewLength?.label}</span>
              </div>
              {settings.custom_instructions && (
                <div className="flex justify-between">
                  <span>Custom rules</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
