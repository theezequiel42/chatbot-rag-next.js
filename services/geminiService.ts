import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { retrieveContext } from './ragService';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Safety settings for Gemini to reduce harmful outputs
// Categories aligned with Gemini safety features.
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUAL', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  // For self-harm/suicide, be stricter
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
    console.error('Gemini stream blocked or failed, using fallback:', err);
    // Fallback friendly message stream following the persona delimiter rules
    const fallback = [
      'Desculpe, n\u00E3o posso responder esse tipo de conte\u00FAdo.',
      'Se voc\u00EA estiver em perigo imediato, ligue para **190**.',
      'Posso te passar informa\u00E7\u00F5es seguras e contatos de apoio em Fraiburgo. O que voc\u00EA precisa saber?'
    ].join('|||');

    // Minimal async-iterable compatible with for-await consumption in UI
    return {
      async *[Symbol.asyncIterator]() {
        yield { text: fallback } as any;
      },
    } as any;
  }
};
