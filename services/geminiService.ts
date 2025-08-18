import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { KNOWLEDGE_BASE_CONTENT } from '../knowledgeBase';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Retrieves relevant context from the knowledge base based on the user's query.
 * This is a simple implementation of a retrieval mechanism for RAG.
 * @param query The user's message.
 * @returns A string containing the most relevant chunks of information.
 */
const retrieveContext = (query: string): string => {
  // Split the knowledge base into chunks (paragraphs in this case)
  const chunks = KNOWLEDGE_BASE_CONTENT.split('\n\n').filter(chunk => chunk.trim() !== '');
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);

  if (queryWords.length === 0) {
    return "Nenhum contexto específico encontrado.";
  }

  // Score each chunk based on how many query words it contains
  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const chunkLower = chunk.toLowerCase();
    queryWords.forEach(word => {
      if (chunkLower.includes(word)) {
        score++;
      }
    });
    return { chunk, score };
  });

  // Sort chunks by score in descending order
  const sortedChunks = scoredChunks.sort((a, b) => b.score - a.score);
  
  // Get the top 2 most relevant chunks that have a score greater than 0
  const relevantChunks = sortedChunks.filter(c => c.score > 0).slice(0, 2);

  if (relevantChunks.length === 0) {
    return "Nenhum contexto específico encontrado.";
  }

  return relevantChunks.map(c => c.chunk).join('\n\n');
};


export const createChatSession = (): Chat => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
  return chat;
};

export const sendMessageToBot = async (chat: Chat, message: string): Promise<string[]> => {
  let responseText = '';
  try {
    // 1. Retrieve context using RAG
    const context = retrieveContext(message);

    // 2. Construct the augmented message for the model
    const augmentedMessage = `
Com base no contexto fornecido abaixo, responda à pergunta do usuário.
Se o contexto não for relevante para a pergunta, responda com base no seu conhecimento geral, sempre seguindo suas diretrizes de persona.

--- CONTEXTO ---
${context}
--- FIM DO CONTEXTO ---

Pergunta do Usuário: "${message}"
`;

    const response = await chat.sendMessage({ message: augmentedMessage });
    responseText = response.text.trim();
    
    // The response should be a JSON array of strings
    const parsedResponse = JSON.parse(responseText);

    if (Array.isArray(parsedResponse) && parsedResponse.every(item => typeof item === 'string')) {
      return parsedResponse;
    } else {
      console.error("Gemini response is not a valid JSON array of strings:", responseText);
      return ["Desculpe, não consegui processar a resposta corretamente. Por favor, tente reformular sua pergunta."];
    }
  } catch (error) {
    console.error("Error sending message to Gemini or parsing JSON:", error);

    // If JSON.parse failed, responseText likely has content. Let's try to salvage it.
    if (responseText) {
        const startIndex = responseText.indexOf('[');
        const endIndex = responseText.lastIndexOf(']');

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            const jsonString = responseText.substring(startIndex, endIndex + 1);
            try {
                const parsedFallback = JSON.parse(jsonString);
                if (Array.isArray(parsedFallback) && parsedFallback.every(item => typeof item === 'string')) {
                    console.warn("Successfully parsed JSON using fallback logic.");
                    return parsedFallback;
                }
            } catch (e) {
                console.error("Fallback JSON parsing also failed.", e);
            }
        }
    }
    
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return ["Ocorreu um erro de comunicação. Tente novamente."];
    }
    return ["Desculpe, estou com dificuldades para me conectar. Por favor, tente novamente mais tarde."];
  }
};
