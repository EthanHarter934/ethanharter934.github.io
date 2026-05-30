import { useEffect, useRef, useState } from 'react';
import styles from './ChatWidget.module.css';

const STORAGE_KEY = 'portfolio-chat-messages';
const GREETING =
  "Hi! I'm Ethan's portfolio assistant. Ask me anything — what he's worked on, his tech stack, experience, you name it.";
const MAX_MESSAGE_PAIRS = 10;
const ERROR_MESSAGE =
  "Sorry, I'm having trouble connecting right now. Please try again in a moment.";

function loadStoredMessages() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function trimForApi(messages) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-MAX_MESSAGE_PAIRS * 2);
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(loadStoredMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const greetedRef = useRef(false);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!isOpen || greetedRef.current || messages.length > 0) return;

    greetedRef.current = true;
    setMessages([{ role: 'assistant', content: GREETING }]);
  }, [isOpen, messages.length]);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const chatUrl = apiBase ? `${apiBase}/chat` : '/api/chat';

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: trimForApi(nextMessages) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: ERROR_MESSAGE }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chatWidget}>
      {isOpen && (
        <div className={styles.drawer}>
          <div className={styles.header}>Portfolio Assistant</div>
          <div className={styles.messages}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className={`${styles.message} ${styles.assistantMessage} ${styles.typing}`}>
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className={styles.inputArea} onSubmit={handleSend}>
            <input
              type="text"
              className={styles.input}
              placeholder="Ask about my experience..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!input.trim() || loading}
            >
              Send
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        💬
      </button>
    </div>
  );
}
