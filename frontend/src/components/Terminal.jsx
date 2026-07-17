import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { key as keySfx, send as sendSfx } from '../utils/sfx';

const ReactMarkdown = lazy(() => import('react-markdown'));

// The hero terminal: boots Ethan's profile, loads the model, then
// becomes the live AI chat (same /api/chat backend as before).

const STORAGE_KEY = 'portfolio-terminal-messages';
const MAX_MESSAGE_PAIRS = 10;
const ERROR_MESSAGE = 'connection failed. the model is probably napping, try again in a bit.';
const GREETING =
  "hey, I'm Melchior-1 (M-1 for short), the model trained on Ethan's portfolio. ask me about his projects, stack, classes, whatever.";

const BOOT_LINES = [
  { text: '$ boot --profile ethan_harter', cls: 'cmd' },
  { text: '  modeling ........... ok', cls: 'ok' },
  { text: '  language ........... ok', cls: 'ok' },
  { text: '  full-stack ......... ok', cls: 'ok' },
  { text: '  gpa 3.95 ........... verified', cls: 'dim' },
  { text: '  awards ............. 2x first place', cls: 'dim' },
  { text: '$ loading model ...... done', cls: 'cmd' },
  { text: '-> all layers online. say hello.', cls: 'result' },
];

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

const REDUCE_MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Terminal() {
  const [bootedLines, setBootedLines] = useState(() => (REDUCE_MOTION ? BOOT_LINES : []));
  const [typedChars, setTypedChars] = useState(0);
  const [booted, setBooted] = useState(REDUCE_MOTION);
  const [messages, setMessages] = useState(loadStoredMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  // boot sequence typing
  useEffect(() => {
    if (REDUCE_MOTION) return undefined;

    let line = 0;
    let chars = 0;
    let timer;

    const tick = () => {
      const current = BOOT_LINES[line];
      chars += 1;
      setBootedLines(BOOT_LINES.slice(0, line));
      setTypedChars(chars);

      if (chars >= current.text.length) {
        line += 1;
        chars = 0;
        setBootedLines(BOOT_LINES.slice(0, line));
        setTypedChars(0);
        if (line >= BOOT_LINES.length) {
          setBooted(true);
          return;
        }
        timer = setTimeout(tick, current.cls === 'cmd' ? 260 : 110);
        return;
      }
      timer = setTimeout(tick, current.cls === 'cmd' ? 26 : 7);
    };

    timer = setTimeout(tick, 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // keep the log pinned to the bottom
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [bootedLines, typedChars, messages, loading, booted]);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading || !booted) return;
    sendSfx();

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
      if (!response.ok) throw new Error(data.error || 'Request failed');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: ERROR_MESSAGE, error: true }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const typingLine = !booted && bootedLines.length < BOOT_LINES.length ? BOOT_LINES[bootedLines.length] : null;

  return (
    <div className="term">
      <div className="term-bar">
        <i /><i /><i className="hot" />
        <span className="term-name">session · ask m-1</span>
        <span className="term-hint">enter to send</span>
      </div>

      <div
        className="term-body"
        ref={bodyRef}
        role="log"
        aria-live="polite"
        onClick={() => {
          if (window.getSelection()?.toString()) return;
          inputRef.current?.focus({ preventScroll: true });
        }}
      >
        {bootedLines.map((line) => (
          <span key={line.text} className={`ln ${line.cls}`}>{line.text}</span>
        ))}
        {typingLine && (
          <span className={`ln ${typingLine.cls}`}>
            {typingLine.text.slice(0, typedChars)}
            <span className="term-caret" aria-hidden="true" />
          </span>
        )}

        {booted && messages.length === 0 && (
          <div className="term-msg">
            <span className="who">m1&gt; </span>
            <span className="msg-text">{GREETING}</span>
          </div>
        )}

        {booted &&
          messages.map((message, index) => (
            <div key={index} className={`term-msg ${message.role === 'user' ? 'you' : ''}`}>
              <span className="who">{message.role === 'user' ? 'you> ' : 'm1> '}</span>
              {message.role === 'assistant' ? (
                message.error ? (
                  <span className="ln err" style={{ display: 'inline' }}>{message.content}</span>
                ) : (
                  <div className="term-md">
                    <Suspense fallback={<span className="msg-text">{message.content}</span>}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </Suspense>
                  </div>
                )
              ) : (
                <span className="msg-text">{message.content}</span>
              )}
            </div>
          ))}

        {loading && (
          <div className="term-msg term-thinking">
            <span className="who">m1&gt; </span>
            <span className="msg-text">thinking<span className="dots" /></span>
          </div>
        )}
      </div>

      <form className="term-input-row" onSubmit={handleSend}>
        <span className="prompt" aria-hidden="true">you&gt;</span>
        <input
          id="ask-input"
          ref={inputRef}
          type="text"
          className="term-input"
          placeholder={booted ? 'ask about ethan…' : 'booting…'}
          aria-label="Ask M-1, Ethan's AI assistant, a question"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key.length === 1 || event.key === 'Backspace') keySfx();
          }}
          disabled={!booted || loading}
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" className="term-send" disabled={!booted || loading || !input.trim()}>
          send
        </button>
      </form>
    </div>
  );
}
