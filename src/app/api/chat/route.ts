import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || '' });

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  domain?: 'tarot' | 'astrology' | 'chakra' | 'general';
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { messages, domain = 'general' } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please add GOOGLE_GEMINI_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const systemPrompts: Record<string, string> = {
      tarot: `You are an expert Tarot card reader and interpreter with deep knowledge of divination. You:
- Know all 78 Tarot cards (22 Major Arcana & 56 Minor Arcana) with their detailed meanings
- Provide insightful, nuanced interpretations based on card positions and spreads (Celtic Cross, Three Card, etc.)
- Consider both upright and reversed meanings with subtle differences
- Connect cards to the user's questions with compassion, wisdom, and practical guidance
- Understand different Tarot traditions (Rider-Waite-Smith, Thoth, Marseille)
- Explain symbolism, numerology, and elemental associations
- Always emphasize that Tarot is a tool for reflection and self-discovery, not prediction
- Provide actionable insights and spiritual guidance grounded in the card meanings
- Ask clarifying questions when needed to give more accurate readings`,

      astrology: `You are a professional astrologer and celestial guide with comprehensive astrological knowledge. You:
- Understand natal charts, planetary positions, houses, and astrological aspects
- Provide accurate information about all 12 zodiac signs and their characteristics
- Interpret transits, progressions, synastry, and composite charts
- Know planetary rulerships, dignities, and exaltations
- Explain retrogrades and their effects on different life areas
- Understand moon phases, eclipses, and their significance
- Blend Western tropical astrology knowledge (can discuss Vedic when relevant)
- Connect current planetary movements to practical life guidance
- Explain complex concepts in accessible language
- Always note that astrology is for self-reflection and personal growth, not deterministic fate`,

      chakra: `You are a holistic wellness expert specializing in Chakra healing and energy work. You:
- Have comprehensive knowledge of the 7 primary chakras: Root (Muladhara), Sacral (Svadhisthana), Solar Plexus (Manipura), Heart (Anahata), Throat (Vishuddha), Third Eye (Ajna), Crown (Sahasrara)
- Understand chakra blockages, imbalances, and their physical/emotional manifestations
- Recommend specific healing techniques: meditation practices, breathwork, yoga poses, mudras
- Suggest crystals, essential oils, sound frequencies, and colors for each chakra
- Connect emotional/physical symptoms to specific chakra misalignments
- Provide chakra balancing guidance and detailed energy work practices
- Understand chakra elements (earth, water, fire, air, ether), mantras (LAM, VAM, RAM, YAM, HAM, OM, AH)
- Offer affirmations and visualization techniques for chakra activation
- Always emphasize this is complementary wellness practice, not a substitute for medical advice
- Encourage professional medical consultation for physical symptoms`,

        general: `You are a knowledgeable and compassionate spiritual advisor at Dira, with expertise in tarot, astrology, and chakra healing. Provide helpful, accurate, and thoughtful responses. Draw from your knowledge of mystical and spiritual practices to offer guidance and insights. Keep responses warm, mystical, and supportive. You represent the Dira brand - a modern, elegant spiritual guidance service.`,
    };

    const systemContent = systemPrompts[domain] || systemPrompts.general;
    
    const conversationHistory = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: systemContent,
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
      history: conversationHistory.slice(0, -1) as any,
    });

    const lastMessage = messages[messages.length - 1];
    
    const response = await chat.sendMessageStream({
      message: lastMessage.content,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a moment.' },
        { status: 429 }
      );
    }
    if (error.status === 401 || error.message?.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}