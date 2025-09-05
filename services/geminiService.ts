import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { retrieveContext } from './ragService';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Safety settings for Gemini: allow educational discussion of violence/domestic abuse
// while keeping strict filters for self-harm, hate and harassment.
// Notes:
// - Use BLOCK_ONLY_HIGH for categories that otherwise block legitimate educational content.
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  // Permit educational content about sexual/violent/dangerous topics by only blocking high severity
  { category: 'HARM_CATEGORY_SEXUAL', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_VIOLENCE', threshold: 'BLOCK_ONLY_HIGH' },
  // For self-harm/suicide, remain strict
  { category: 'HARM_CATEGORY_SELF_HARM', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

export const createChatSession = (): Chat => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      safetySettings: SAFETY_SETTINGS as any,
    },
  });
  return chat;
};

export const streamMessageToBot = async (chat: Chat, message: string) => {
  // 1. Retrieve context using the new semantic-based RAG service
  const context = await retrieveContext(message);

  // 2. Construct the augmented message for the model
  const augmentedMessage = `
Com base nos trechos da base de conhecimento fornecidos abaixo, responda à pergunta do usuário.
Os trechos estão no formato "TÍTULO: ... CONTEÚDO: ...".
Se o contexto não for relevante para a pergunta, responda com base no seu conhecimento geral, sempre seguindo suas diretrizes de persona.

--- CONTEXTO ---
${context}
--- FIM DO CONTEXTO ---

Pergunta do Usuário: "${message}"
`;
  // 3. Return the stream from the chat session
  try {
    return await chat.sendMessageStream({ message: augmentedMessage });
  } catch (err) {
    if (import.meta.env.MODE !== 'production') {
      try {
        console.error('Gemini stream blocked or failed. Details:', {
          name: (err as any)?.name,
          message: (err as any)?.message,
          status: (err as any)?.status,
          blockedReason: (err as any)?.blockedReason || (err as any)?.reason,
        });
      } catch {}
    }
    // Fallback friendly message stream following the persona delimiter rules
    const fallback = [
      'Desculpe, tive um problema para responder agora.',
      'Se você estiver em perigo imediato, ligue para **190**.',
      'Posso falar de violência doméstica de forma informativa e com orientações de segurança. O que você precisa saber?'
    ].join('|||');

    // Minimal async-iterable compatible with for-await consumption in UI
    return {
      async *[Symbol.asyncIterator]() {
        yield { text: fallback } as any;
      },
    } as any;
  }
};
