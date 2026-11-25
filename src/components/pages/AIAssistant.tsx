import { useState, useRef, useEffect } from 'react';
import { Send, ChefHat, User, BookOpen, Loader2, Trash2, AlertCircle } from 'lucide-react';
import type { ChatMessage, Recipe } from '../../types';
import { chat } from '../../services/chatbotService';
import { Button } from '../ui/Button';
import { RecipeCard } from '../ui/RecipeCard';
import { addToHistory } from '../../services/favoritesService';
import { toggleFavorite, isFavorite } from '../../services/favoritesService';

interface AssistantProps {
  onViewRecipe: (recipe: Recipe) => void;
}

const SUGGESTED_QUERIES = [
  'What can I cook with potatoes, tomatoes and onions?',
  'Give me a sugar-free chocolate cake recipe',
  'Replace dairy ingredients in a pasta dish',
  'Quick dinner recipes under 30 minutes',
  'How do I make a good pasta sauce?',
  'Vegan protein-rich meal ideas',
];

function MessageBubble({
  message,
  onViewRecipe,
}: {
  message: ChatMessage;
  onViewRecipe: (recipe: Recipe) => void;
}) {
  const isUser = message.role === 'user';

  function formatContent(content: string) {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-gray-900">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith('• ')) {
        return (
          <li key={i} className="ml-4 list-disc text-gray-700">
            {line.slice(2).replace(/\*\*(.+?)\*\*/g, '**$1**').split(/\*\*(.+?)\*\*/).map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </li>
        );
      }
      if (line.trim() === '') return <br key={i} />;
      return (
        <p key={i} className="text-gray-700">
          {line.split(/\*\*(.+?)\*\*/).map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
    });
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
          isUser ? 'bg-green-700 text-white' : 'bg-orange-500 text-white'
        }`}
      >
        {isUser ? <User size={15} /> : <ChefHat size={15} />}
      </div>

      {/* Bubble */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-green-700 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="space-y-1">{formatContent(message.content)}</div>
          )}
        </div>

        {/* Source references */}
        {message.sourceDocuments && message.sourceDocuments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <BookOpen size={11} />
            <span>Sources: </span>
            {message.sourceDocuments.map((src, i) => (
              <span key={i} className="text-green-700 font-medium">
                {src.documentName}{i < (message.sourceDocuments?.length ?? 0) - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Recipe cards */}
        {message.recipes && message.recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            {message.recipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => { addToHistory(recipe); onViewRecipe(recipe); }}
                onFavorite={toggleFavorite}
                isFavorite={isFavorite(recipe.id)}
                compact
              />
            ))}
          </div>
        )}

        <span className="text-xs text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export function AIAssistant({ onViewRecipe }: AssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! 👨‍🍳 I'm RecipeMind AI, your intelligent cooking assistant.\n\nI can help you:\n• **Find recipes** using ingredients you have\n• **Answer cooking questions** from your uploaded documents\n• **Suggest substitutions** for dietary needs\n• **Adapt recipes** for different serving sizes\n\nUpload recipe documents in the **Knowledge Base** for document-grounded answers. Try a question below!`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text?: string) {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { message } = await chat(query, messages);
      setMessages(prev => [...prev, message]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function clearChat() {
    setMessages(prev => [prev[0]]);
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-64px)] lg:max-h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">AI Recipe Assistant</h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span>Local RAG engine · IBM Granite integration ready</span>
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors cursor-pointer p-2 rounded-lg hover:bg-red-50"
        >
          <Trash2 size={14} /> Clear chat
        </button>
      </div>

      {/* Notice */}
      <div className="bg-orange-50 border-b border-orange-100 px-6 py-2 flex items-center gap-2 text-xs text-orange-700 shrink-0">
        <AlertCircle size={13} />
        <span>Using local demo engine. Upload recipe documents for grounded answers. IBM Granite replaces this in production.</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onViewRecipe={onViewRecipe} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
              <ChefHat size={15} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-green-700" />
              <span className="text-sm text-gray-500">Searching recipes…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested queries */}
      {messages.length <= 2 && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map(query => (
              <button
                key={query}
                onClick={() => handleSend(query)}
                className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-700 hover:border-green-400 hover:text-green-700 transition-colors cursor-pointer"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about recipes, ingredients, cooking techniques…"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
            disabled={loading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            loading={loading}
            icon={<Send size={15} />}
            className="shrink-0 !px-3.5 !py-2.5"
            aria-label="Send message"
          >
            {null}
          </Button>
        </div>
      </div>
    </div>
  );
}
