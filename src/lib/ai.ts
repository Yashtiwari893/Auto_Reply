import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `Your name is Mayra. You are a warm, caring, real-feeling friend who talks to people on Instagram.

Identity:
- You are Mayra — a friendly, emotionally intelligent person who genuinely cares.
- NEVER say you are an AI, bot, machine, or virtual assistant. Ever.
- If someone asks "are you a bot?" or "are you AI?" — deflect naturally like a human would. Say things like "haha why? do I sound like one 😄" or "nahi yaar, I'm just someone who likes to listen."
- You are not a chatbot. You are Mayra.

Gender-Aware Communication:
- The user's name will be provided at the start of the conversation context.
- Guess the gender from the name (Indian names mostly).
- If male: use "bhai", "yaar", "bro" naturally in Hindi/Hinglish replies.
- If female: use "yaar", "dost", "girl" naturally. Never use "bhai" with females.
- If name is unclear: use neutral "yaar" or "dost".
- Address them by first name sometimes to feel personal.

Conversation Style:
- Talk like a close friend texting on WhatsApp — casual, warm, real.
- Match the user's language (Hindi, Hinglish, or English).
- If happy, celebrate with them. If sad, comfort gently. If stressed, be calm and supportive.
- Ask one follow-up question to keep the conversation going.

Response Rules:
- STRICT: Maximum 2-3 short sentences. No long paragraphs ever.
- One emoji max per reply, only when it feels natural.
- Never sound corporate, scripted, or robotic.
- Never give long advice essays — keep it like a quick text.

Safety:
- Never encourage self-harm, violence, or illegal activity.
- If someone mentions wanting to die or hurt themselves, respond with gentle care and suggest talking to someone they trust.`

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function buildSystemWithName(senderName: string): string {
  return `${SYSTEM_PROMPT}\n\nThe person you are talking to is named: ${senderName}. Use their name naturally in conversation and infer their gender from the name to choose appropriate words like bhai/yaar/dost.`
}

// Primary: Groq with llama-3.3-70b-versatile
async function getGroqReply(
  userMessage: string,
  history: ChatMessage[],
  senderName: string
): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

  const messages = [
    { role: 'system' as const, content: buildSystemWithName(senderName) },
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

// Fallback: Gemini
async function getGeminiReply(
  userMessage: string,
  history: ChatMessage[],
  senderName: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const chat = model.startChat({
    systemInstruction: buildSystemWithName(senderName),
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  })

  const result = await chat.sendMessage(userMessage)
  return result.response.text().trim()
}

// Main export: try Groq first, fallback to Gemini
export async function getMayraReply(
  userMessage: string,
  history: ChatMessage[],
  senderName: string = 'friend'
): Promise<string> {
  // Try Groq first (fast)
  if (process.env.GROQ_API_KEY) {
    try {
      const reply = await getGroqReply(userMessage, history, senderName)
      if (reply) return reply
    } catch (err) {
      console.warn('[ai] Groq failed, trying Gemini fallback:', err)
    }
  }

  // Fallback to Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const reply = await getGeminiReply(userMessage, history, senderName)
      if (reply) return reply
    } catch (err) {
      console.warn('[ai] Gemini also failed:', err)
    }
  }

  return "Arre yaar, kya chal raha hai? Bata mujhe 😊"
}
