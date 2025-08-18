import React from 'react';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto h-[95vh] bg-white rounded-2xl shadow-xl flex flex-col">
      <header className="bg-gradient-to-r from-pink-600 to-purple-500 text-white p-4 rounded-t-2xl flex-shrink-0 flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
          {/* Simple Angel Heart Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold">Anjo Amigo</h1>
          <p className="text-sm opacity-90">Apoio e conscientização contra a violência doméstica</p>
        </div>
      </header>
      <ChatInterface />
      <footer className="text-center p-3 text-xs text-gray-600 border-t flex-shrink-0 flex items-center justify-center space-x-2">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        <p>Este é um espaço seguro. Se você estiver em perigo imediato, **ligue para 190**.</p>
      </footer>
    </div>
  );
};

export default App;