'use client'

import { useState } from 'react'
import { Zap, Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { AutoReply } from '@/types'
import { formatDate } from '@/lib/utils'

interface RuleFormData {
  trigger_type: 'keyword' | 'default'
  keyword: string
  reply_message: string
  is_active: boolean
}

const emptyForm: RuleFormData = {
  trigger_type: 'keyword',
  keyword: '',
  reply_message: '',
  is_active: true,
}

export default function AutoRepliesClient({ initialRules }: { initialRules: AutoReply[] }) {
  const [rules, setRules] = useState<AutoReply[]>(initialRules)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RuleFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(rule: AutoReply) {
    setEditingId(rule.id)
    setForm({
      trigger_type: rule.trigger_type,
      keyword: rule.keyword ?? '',
      reply_message: rule.reply_message,
      is_active: rule.is_active,
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setError('')
    if (!form.reply_message.trim()) {
      setError('Reply message is required.')
      return
    }
    if (form.trigger_type === 'keyword' && !form.keyword.trim()) {
      setError('Keyword is required for keyword triggers.')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/auto-replies/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: form.trigger_type === 'keyword' ? form.keyword : null,
            reply_message: form.reply_message,
            is_active: form.is_active,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to update')
        setRules((prev) => prev.map((r) => (r.id === editingId ? json.data : r)))
      } else {
        const res = await fetch('/api/auto-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trigger_type: form.trigger_type,
            keyword: form.trigger_type === 'keyword' ? form.keyword : null,
            reply_message: form.reply_message,
            is_active: form.is_active,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to create')
        setRules((prev) => [json.data, ...prev])
      }
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this auto-reply rule?')) return
    setDeletingId(id)
    const res = await fetch(`/api/auto-replies/${id}`, { method: 'DELETE' })
    if (res.ok) setRules((prev) => prev.filter((r) => r.id !== id))
    setDeletingId(null)
  }

  async function handleToggle(rule: AutoReply) {
    const res = await fetch(`/api/auto-replies/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
    })
    if (res.ok) {
      const json = await res.json()
      setRules((prev) => prev.map((r) => (r.id === rule.id ? json.data : r)))
    }
  }

  const keywordRules = rules.filter((r) => r.trigger_type === 'keyword')
  const defaultRule = rules.find((r) => r.trigger_type === 'default')

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auto Replies</h1>
          <p className="text-gray-500 text-sm mt-1">Configure automatic responses to Instagram DMs.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Rule' : 'New Rule'}
          </h2>

          {!editingId && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
              <div className="flex gap-3">
                {(['keyword', 'default'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={t}
                      checked={form.trigger_type === t}
                      onChange={() => setForm((f) => ({ ...f, trigger_type: t }))}
                      className="accent-purple-600"
                    />
                    <span className="text-sm capitalize text-gray-700">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.trigger_type === 'keyword' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keyword <span className="text-gray-400 font-normal">(case-insensitive match)</span>
              </label>
              <input
                type="text"
                value={form.keyword}
                onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                placeholder="e.g. pricing, hello, order"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reply Message</label>
            <textarea
              value={form.reply_message}
              onChange={(e) => setForm((f) => ({ ...f, reply_message: e.target.value }))}
              placeholder="Type your auto-reply message..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{form.reply_message.length} / 2000</p>
          </div>

          <div className="mb-5 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="accent-purple-600"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Enable this rule immediately
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Rule'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Default reply */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Default Reply
        </h2>
        {defaultRule ? (
          <RuleCard rule={defaultRule} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} deletingId={deletingId} />
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-400">
            No default reply set. Create one to catch all unmatched messages.
          </div>
        )}
      </div>

      {/* Keyword rules */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Keyword Rules ({keywordRules.length})
        </h2>
        {keywordRules.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-400">
            No keyword rules yet. Click &ldquo;New Rule&rdquo; to add one.
          </div>
        ) : (
          <div className="space-y-3">
            {keywordRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RuleCard({
  rule,
  onEdit,
  onDelete,
  onToggle,
  deletingId,
}: {
  rule: AutoReply
  onEdit: (r: AutoReply) => void
  onDelete: (id: string) => void
  onToggle: (r: AutoReply) => void
  deletingId: string | null
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {rule.trigger_type === 'keyword' ? (
              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
                Keyword: {rule.keyword}
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {rule.is_active ? 'Active' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">{rule.reply_message}</p>
          <p className="text-xs text-gray-400 mt-2">{formatDate(rule.created_at)}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggle(rule)}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition"
            title={rule.is_active ? 'Disable' : 'Enable'}
          >
            {rule.is_active ? (
              <ToggleRight className="w-4 h-4 text-green-600" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(rule)}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            disabled={deletingId === rule.id}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition disabled:opacity-60"
          >
            {deletingId === rule.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
