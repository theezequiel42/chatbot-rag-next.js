import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { ChatMessage, Sender } from '../types';
import { createChatSession, streamMessageToBot } from '../services/geminiService';
import { initializeRag } from '../services/ragService';
import MessageBubble from './MessageBubble';

const QUICK_REPLIES = [
  'O que é violência doméstica?',
  'Lei Maria da Penha',
  'Rede de Apoio de Fraiburgo',
  'Quero apenas conversar.'
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = useCallback(() => {
    const newChat = createChatSession();
    setChat(newChat);
    setMessages([]);

    const welcomeTexts = [
      'Olá! Eu sou o Anjo Amigo.',
      'Estou aqui para conversar e te ajudar a entender mais sobre relacionamentos e violência doméstica.',
      'Como posso te ajudar hoje?'
    ];

    let cumulativeDelay = 0;
    welcomeTexts.forEach((text, index) => {
      cumulativeDelay += 600;
      setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: `bot-welcome-${Date.now()}-${index}`,
          text,
          sender: Sender.Bot,
        };
        setMessages((prev) => [...prev, welcomeMessage]);
      }, cumulativeDelay);
    });
    
    setTimeout(() => {
      setShowQuickReplies(true);
    }, cumulativeDelay + 500);

  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeRag();
        initializeChat();
      } catch (error) {
        console.error("Initialization failed:", error);
        setInitError('Não foi possível iniciar o assistente. Verifique sua conexão e tente recarregar a página.');
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [initializeChat]);
  
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || !chat) return;

    setShowQuickReplies(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: Sender.User,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await streamMessageToBot(chat, messageText);
      let responseBuffer = '';
      
      for await (const chunk of stream) {
        responseBuffer += chunk.text;
        const potentialMessages = responseBuffer.split('|||');

        if (potentialMessages.length > 1) {
          const completeMessages = potentialMessages.slice(0, -1);
          responseBuffer = potentialMessages.slice(-1)[0]; // The last part is the new buffer

          completeMessages.forEach((text) => {
            if (text.trim()) {
              const botMessage: ChatMessage = {
                id: `bot-${Date.now()}-${Math.random()}`, // Use random to help ensure unique key
                text: text.trim(),
                sender: Sender.Bot,
              };
              setMessages((prev) => [...prev, botMessage]);
            }
          });
        }
      }

      // After the stream is done, process any remaining text in the buffer
      if (responseBuffer.trim()) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}-${Math.random()}`,
          text: responseBuffer.trim(),
          sender: Sender.Bot,
        };
        setMessages((prev) => [...prev, botMessage]);
      }

    } catch (error) {
      console.error('Failed to get response from bot:', error);
      const errorMessage: ChatMessage = {
        id: `bot-error-${Date.now()}`,
        text: 'Desculpe, ocorreu um erro de comunicação. Por favor, tente novamente.',
        sender: Sender.Bot,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(input);
  }

  if (isInitializing || initError) {
    return (
      <div className="flex flex-col flex-grow h-0 items-center justify-center text-center p-4">
        <div className="w-12 h-12 mb-4 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        </div>
        <p className="font-semibold text-lg text-gray-700">
          {initError ? 'Ocorreu um Erro' : 'Preparando assistente...'}
        </p>
        <p className="text-gray-500 mt-1">
          {initError || 'Isso pode levar alguns segundos. Por favor, aguarde.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow h-0">
      <div className="flex-grow p-6 overflow-y-auto bg-gray-50">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.sender === Sender.User && (
             <MessageBubble 
              message={{id: 'loading', sender: Sender.Bot, text: ''}} 
              isLoading={true} 
            />
          )}
          {showQuickReplies && (
             <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2 animate-fade-in-up">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSendMessage(reply)}
                  className="bg-white border border-pink-500 text-pink-600 font-semibold py-2 px-4 rounded-full hover:bg-pink-50 transition-colors text-sm"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleFormSubmit} className="flex items-center space-x-3">
          <label htmlFor="chat-input" className="sr-only">
            Digite sua mensagem
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading || showQuickReplies}
            className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 transition-shadow disabled:bg-gray-100"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || showQuickReplies}
            className="bg-pink-600 text-white font-semibold w-12 h-12 rounded-full hover:bg-pink-700 disabled:bg-pink-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 flex items-center justify-center flex-shrink-0"
            aria-label="Enviar mensagem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;