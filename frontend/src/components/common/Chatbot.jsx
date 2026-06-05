import { useEffect, useRef, useState } from 'react'
import { Bot, MessageCircle, Send, X } from 'lucide-react'
import { sendMessage } from '../../api/chat'
import Button from '../ui/Button'

const WELCOME = 'Xin chào! Tôi là trợ lý SMARTSHOP. Tôi có thể tư vấn laptop, điện thoại và thiết bị công nghệ cho bạn.'

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

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      {open && (
        <div className="mb-3 flex h-[min(480px,calc(100vh-120px))] w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-shop-border bg-shop-surface shadow-md">
          <div className="flex items-center justify-between bg-shop-navy px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-bold">SMARTSHOP AI</div>
                <div className="text-xs font-medium text-white/70">Tư vấn trực tuyến</div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/10" aria-label="Đóng chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-shop-bg px-4 py-3">
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`mb-3 flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={[
                    'max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm font-medium leading-6 shadow-sm',
                    message.from === 'user'
                      ? 'rounded-br-md bg-shop-red text-white'
                      : 'rounded-bl-md border border-shop-border bg-shop-surface text-shop-text',
                  ].join(' ')}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="mb-3 flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-shop-border bg-shop-surface px-4 py-2 text-sm font-bold text-shop-muted shadow-sm">
                  Đang trả lời...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 border-t border-shop-border bg-shop-surface p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              disabled={loading}
              className="h-10 min-w-0 flex-1 rounded-xl border border-shop-border bg-shop-surface px-3 text-sm font-medium text-shop-text outline-none transition placeholder:text-shop-muted focus:border-shop-red focus:ring-4 focus:ring-shop-red/10"
            />
            <Button variant="icon" onClick={handleSend} disabled={loading || !input.trim()} aria-label="Gửi">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!open && (
        <Button variant="primary" onClick={() => setOpen(true)} className="h-14 w-14 rounded-2xl p-0 shadow-md" aria-label="Tư vấn AI">
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
