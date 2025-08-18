
import React from 'react';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex flex-col items-center justify-center font-sans p-4">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <header className="bg-white p-4 border-b border-gray-200 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Anjo Amigo</h1>
          <p className="text-sm text-gray-500">Apoio e conscientização contra a violência doméstica</p>
        </header>
        <ChatInterface />
      </div>
       <footer className="text-center mt-4 text-xs text-gray-500">
        <p>Este é um espaço seguro. Se você estiver em perigo imediato, ligue para 190.</p>
      </footer>
    </div>
  );
};

export default App;
