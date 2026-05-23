import React, { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../../api/chat'

const WELCOME = 'Xin chào! Tôi là trợ lý SmartShop 🤖 Tôi có thể tư vấn laptop, điện thoại và thiết bị công nghệ cho bạn. Bạn cần hỗ trợ gì?'

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ from: 'bot', text: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { from: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const reply = await sendMessage(text)
      setMessages((prev) => [...prev, { from: 'bot', text: reply }])
    } catch {
      setMessages((prev) => [...prev, { from: 'bot', text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1050 }}>
      {/* Chat window */}
      {open && (
        <div style={{
          width: 360,
          height: 480,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: 12,
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0d6efd, #0a58ca)',
            color: '#fff',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18
              }}>🤖</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>SmartShop AI</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>Trợ lý tư vấn trực tuyến</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
            >×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', background: '#f8f9fa' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.from === 'user' ? '#0d6efd' : '#fff',
                  color: msg.from === 'user' ? '#fff' : '#212529',
                  fontSize: 14,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <div style={{
                  padding: '10px 16px', borderRadius: '18px 18px 18px 4px',
                  background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  fontSize: 20, letterSpacing: 2
                }}>
                  <span className="typing-dot">•</span>
                  <span className="typing-dot" style={{ animationDelay: '0.2s' }}>•</span>
                  <span className="typing-dot" style={{ animationDelay: '0.4s' }}>•</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            gap: 8,
            background: '#fff'
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={loading}
              style={{
                flex: 1,
                border: '1px solid #dee2e6',
                borderRadius: 20,
                padding: '8px 14px',
                fontSize: 14,
                outline: 'none',
                background: loading ? '#f8f9fa' : '#fff'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38,
                borderRadius: '50%',
                background: loading || !input.trim() ? '#adb5bd' : '#0d6efd',
                border: 'none',
                color: '#fff',
                fontSize: 16,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}
            >➤</button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d6efd, #0a58ca)',
          border: 'none',
          color: '#fff',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(13,110,253,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        title="Tư vấn AI"
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  )
}
