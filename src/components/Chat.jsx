import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatbot } from '../services/chatbot';
import { Send, Loader2, MessageCircle, Sparkles } from 'lucide-react';

export function Chat({ userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load suggestions
  useEffect(() => {
    if (userId) {
      chatbot.getSuggestions(userId).then(setSuggestions);
    }
  }, [userId]);

  // Load history
  useEffect(() => {
    if (userId) {
      setLoadingHistory(true);
      chatbot.getHistory(userId, 10).then(history => {
        const historyMessages = history.flatMap(h => [
          { role: 'user', content: h.message, timestamp: new Date(h.created_at) },
          { role: 'assistant', content: h.response, timestamp: new Date(h.created_at) }
        ]);
        setMessages(historyMessages);
        setLoadingHistory(false);
      }).catch(() => {
        setLoadingHistory(false);
      });
    }
  }, [userId]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    // Add user message
    const userMsg = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Get bot response
      const response = await chatbot.chat(input, userId);
      const botMsg = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] bg-white rounded-lg border border-gray-200/30 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[#111d29]" />
          <h3 className="text-lg font-semibold text-[#111d29]">PulseAI</h3>
          <Sparkles className="h-4 w-4 text-[#111d29]/70" />
        </div>
        <p className="text-xs text-[#111d29]/60 mt-1">Ask about your work activities and productivity</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#111d29] mx-auto mb-2" />
              <span className="text-sm text-gray-500">Loading chat history...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            {/* Welcome message and suggestions */}
            <div className="text-center mb-6">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-[#111d29] mb-2">Start a conversation</h4>
              <p className="text-sm text-[#111d29]/60">Ask me anything about your work activities</p>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="w-full max-w-md space-y-2">
                <h5 className="text-xs font-semibold text-[#111d29]/80 uppercase tracking-wide mb-3">Suggested questions:</h5>
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 bg-[#111d29]/5 hover:bg-[#111d29]/10 border border-[#111d29]/20 rounded-lg transition-all duration-200 text-sm text-[#111d29] hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-[#111d29] text-white'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className={`text-sm break-words prose prose-sm max-w-none ${
                    msg.role === 'user' ? 'prose-invert' : ''
                  }`}>
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />,
                          code: ({node, inline, ...props}) => 
                            inline ? (
                              <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props} />
                            ) : (
                              <code className="block bg-gray-200 p-2 rounded text-xs overflow-x-auto" {...props} />
                            ),
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  <div
                    className={`text-[10px] mt-1.5 ${
                      msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#111d29]" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#111d29] focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-[#111d29] hover:bg-[#1a2936] text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="text-sm">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

