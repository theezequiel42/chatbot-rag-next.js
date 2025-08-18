# Anjo Amigo 🤖💜

**Apoio e conscientização contra a violência doméstica**

Um chatbot inteligente desenvolvido em React que oferece suporte, informações e recursos para pessoas em situação de violência doméstica.

## 🎯 Sobre o Projeto

Anjo Amigo é uma aplicação web que utiliza inteligência artificial (Google Gemini) para fornecer um espaço seguro de conversa, orientação e conscientização sobre violência doméstica. O sistema implementa RAG (Retrieval-Augmented Generation) para oferecer respostas precisas e contextualizadas.

## ✨ Funcionalidades

- 💬 Interface de chat intuitiva e responsiva
- 🧠 IA conversacional com Google Gemini
- 📚 Base de conhecimento especializada em violência doméstica
- 🔒 Ambiente seguro e confidencial
- 📱 Design responsivo para dispositivos móveis

## 🚀 Tecnologias

- **React 19** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e desenvolvimento
- **Google Gemini AI** - Modelo de linguagem
- **Tailwind CSS** - Estilização (inferido do código)

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Chave de API do Google Gemini

## ⚙️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd chatbot-rag-next.js
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Adicione sua chave da API do Google Gemini no arquivo `.env.local`:
   ```
   VITE_GEMINI_API_KEY=sua_chave_aqui
   ```

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   Abra [http://localhost:5173](http://localhost:5173) no seu navegador

## 🏗️ Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção

## 📁 Estrutura do Projeto

```
├── components/
│   ├── ChatInterface.tsx    # Interface principal do chat
│   └── MessageBubble.tsx    # Componente de mensagens
├── services/
│   └── geminiService.ts     # Integração com Google Gemini
├── App.tsx                  # Componente principal
├── constants.ts             # Constantes da aplicação
├── knowledgeBase.ts         # Base de conhecimento RAG
├── types.ts                 # Definições de tipos TypeScript
└── index.tsx               # Ponto de entrada da aplicação
```

## 🔧 Configuração da API

Para usar o Google Gemini:

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma nova chave de API
3. Adicione a chave no arquivo `.env.local`

## 🚨 Informações Importantes

- **Emergência**: Em caso de perigo imediato, ligue para **190**
- **Central de Atendimento à Mulher**: **180**
- Este é um projeto de apoio e não substitui ajuda profissional

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Recursos de Ajuda

- **Ligue 180** - Central de Atendimento à Mulher
- **Ligue 190** - Polícia Militar (emergências)
- **Ligue 197** - Polícia Civil
- **WhatsApp 61 99656-5008** - Ouvidoria da Mulher

---

💜 **Desenvolvido com carinho para ajudar quem precisa**