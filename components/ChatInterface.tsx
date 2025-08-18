import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { ChatMessage, Sender } from '../types';
import { createChatSession, sendMessageToBot } from '../services/geminiService';
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
    initializeChat();
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

    let botResponses: string[] = [];

    try {
      botResponses = await sendMessageToBot(chat, messageText);

      botResponses.forEach((text, index) => {
        setTimeout(() => {
          const botMessage: ChatMessage = {
            id: `bot-${Date.now()}-${index}`,
            text,
            sender: Sender.Bot,
          };
          setMessages((prev) => [...prev, botMessage]);
        }, (index + 1) * 600);
      });
    } catch (error) {
      console.error('Failed to get response from bot:', error);
      const errorMessage: ChatMessage = {
        id: `bot-error-${Date.now()}`,
        text: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        sender: Sender.Bot,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      const totalWaitTime = (botResponses.length > 0 ? botResponses.length : 1) * 600;
      setTimeout(() => {
        setIsLoading(false);
      }, totalWaitTime);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(input);
  }

  return (
    <div className="flex flex-col flex-grow h-0">
      <div className="flex-grow p-6 overflow-y-auto bg-gray-50">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
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
          <input
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
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;