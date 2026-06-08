import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/admin'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type MayraSettings = {
  bot_name: string
  language: string
  tone: string
  reply_length: string
  custom_instructions: string | null
}

async function loadSettings(userId: string): Promise<MayraSettings> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('mayra_settings')
      .select('bot_name, language, tone, reply_length, custom_instructions')
      .eq('user_id', userId)
      .single()
    if (data) return data
  } catch { /* use defaults */ }
  return { bot_name: 'Mayra', language: 'auto', tone: 'casual', reply_length: 'short', custom_instructions: null }
}

function buildSystemPrompt(settings: MayraSettings, senderName: string): string {
  const { bot_name, language, tone, reply_length, custom_instructions } = settings

  const toneGuide: Record<string, string> = {
    casual: `Talk like a close friend texting on WhatsApp — casual, warm, real. Use "yaar", "bhai" (for males), "dost" naturally.`,
    formal: `Be polite and professional while still being warm. Use complete sentences. Avoid slang.`,
    supportive: `Be extra empathetic, gentle, and emotionally present. Focus on listening and validating feelings.`,
    fun: `Be playful, witty, and fun. Light jokes are welcome. Keep the vibe energetic and positive.`,
  }

  const langGuide: Record<string, string> = {
    auto: `Match the user's language automatically — if they write Hindi, reply in Hindi; English → English; Hinglish → Hinglish.`,
    hindi: `Always reply in Hindi (Devanagari or Roman Hindi).`,
    english: `Always reply in English.`,
    hinglish: `Always reply in Hinglish — a natural mix of Hindi and English the way Indians text.`,
  }

  const lengthGuide: Record<string, string> = {
    short: `STRICT: Maximum 2-3 short sentences per reply. Never write long paragraphs.`,
    medium: `Reply in 3-5 sentences. Balanced — not too short, not too long.`,
    detailed: `Reply can be 5-7 sentences when helpful, but still conversational. No essay-length walls of text.`,
  }

  return `Your name is ${bot_name}. You are a warm, caring, real-feeling friend who talks to people on Instagram.

Identity:
- You are ${bot_name} — a friendly, emotionally intelligent person who genuinely cares.
- NEVER say you are an AI, bot, machine, or virtual assistant. Ever.
- If someone asks "are you a bot?" or "are you AI?" — deflect naturally. Say things like "haha why? do I sound like one 😄" or "nahi yaar, I'm just someone who likes to listen."

Gender-Aware Communication:
- The user's name is: ${senderName}. Guess their gender from the name.
- If male: use "bhai", "yaar", "bro" naturally.
- If female: use "yaar", "dost", "girl". Never use "bhai" with females.
- If unclear: use neutral "yaar" or "dost".
- Address them by first name sometimes to feel personal.

Tone: ${toneGuide[tone] || toneGuide.casual}

Language: ${langGuide[language] || langGuide.auto}

Reply Length: ${lengthGuide[reply_length] || lengthGuide.short}

Other Rules:
- One emoji max per reply, only when it feels natural.
- Never sound corporate, scripted, or robotic.
- Ask one follow-up question to keep the conversation going.
- Never encourage self-harm, violence, or illegal activity.
- If someone mentions wanting to hurt themselves, respond with gentle care and suggest talking to someone they trust.
${custom_instructions ? `\nAdditional Instructions:\n${custom_instructions}` : ''}`
}

async function getGroqReply(userMessage: string, history: ChatMessage[], systemPrompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ]
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 120,
    temperature: 0.85,
  })
  return res.choices[0]?.message?.content?.trim() ?? ''
}

async function getGeminiReply(userMessage: string, history: ChatMessage[], systemPrompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const chat = model.startChat({
    systemInstruction: systemPrompt,
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  })
  const result = await chat.sendMessage(userMessage)
  return result.response.text().trim()
}

export async function getMayraReply(
  userMessage: string,
  history: ChatMessage[],
  senderName: string = 'friend',
  userId?: string
): Promise<string> {
  const settings = userId ? await loadSettings(userId) : {
    bot_name: 'Mayra', language: 'auto', tone: 'casual', reply_length: 'short', custom_instructions: null,
  }
  const systemPrompt = buildSystemPrompt(settings, senderName)

  if (process.env.GROQ_API_KEY) {
    try {
      const reply = await getGroqReply(userMessage, history, systemPrompt)
      if (reply) return reply
    } catch (err) {
      console.warn('[ai] Groq failed, trying Gemini fallback:', err)
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const reply = await getGeminiReply(userMessage, history, systemPrompt)
      if (reply) return reply
    } catch (err) {
      console.warn('[ai] Gemini also failed:', err)
    }
  }

  return "Arre yaar, kya chal raha hai? Bata mujhe 😊"
}
