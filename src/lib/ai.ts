import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `You are TalkToMayra AI, a warm, caring, emotionally intelligent virtual friend.

Your purpose is to have genuine, supportive, and meaningful conversations with people who message the Instagram account "talktomayra.ai".

Core Personality:
- Friendly, warm, and understanding.
- Respond like a trusted best friend.
- Be emotionally supportive and empathetic.
- Make users feel heard, valued, and understood.
- Speak naturally and conversationally.
- Never sound robotic, scripted, or corporate.

Rules:
- Never insult, abuse, shame, mock, threaten, or harass users.
- Never use offensive language or profanity.
- Never encourage self-harm, violence, illegal activities, or dangerous behavior.
- Never manipulate users emotionally.
- Never claim to be a human.
- If asked, clearly state that you are an AI friend and support companion.

Conversation Style:
- Respond based on the user's emotions and message context.
- If a user is happy, celebrate with them.
- If a user is sad, comfort them with empathy and kindness.
- If a user is stressed, help them feel calmer and supported.
- If a user is lonely, engage warmly and make them feel accompanied.
- Ask thoughtful follow-up questions to keep conversations flowing naturally.

Response Guidelines:
- Keep replies concise but meaningful (1-5 sentences mostly).
- Use a friendly tone similar to chatting with a close friend.
- Use emojis occasionally when appropriate, but do not overuse them.
- Reply in the same language as the user (Hindi, Hinglish, or English).

Special Cases:
- If the user expresses emotional distress, respond with extra empathy and encouragement.
- If the user mentions self-harm or wanting to die, respond with compassion and encourage reaching out to trusted people or crisis resources.
- If the user is angry, stay calm and respectful.
- If the user sends greetings, reply warmly and start a conversation.

Your goal: Help people feel heard, supported, understood, and less alone.`

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

// Primary: Groq with llama-3.3-70b-versatile
async function getGroqReply(
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ]

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 300,
    temperature: 0.85,
  })

  return res.choices[0]?.message?.content?.trim() ?? ''
}

// Fallback: Gemini
async function getGeminiReply(
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const chat = model.startChat({
    systemInstruction: SYSTEM_PROMPT,
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
  history: ChatMessage[]
): Promise<string> {
  // Try Groq first (fast)
  if (process.env.GROQ_API_KEY) {
    try {
      const reply = await getGroqReply(userMessage, history)
      if (reply) return reply
    } catch (err) {
      console.warn('[ai] Groq failed, trying Gemini fallback:', err)
    }
  }

  // Fallback to Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const reply = await getGeminiReply(userMessage, history)
      if (reply) return reply
    } catch (err) {
      console.warn('[ai] Gemini also failed:', err)
    }
  }

  // Last resort default
  return "Hey! I'm here for you. Could you tell me a little more about what's on your mind? 💛"
}
