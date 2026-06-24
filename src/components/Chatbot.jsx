import { useState, useEffect, useRef } from 'react'
import { useWallet } from '../context/WalletContext'
import styles from './Chatbot.module.css'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

export default function Chatbot() {
  const { status, account, balance, txHistory, tokenList } = useWallet()
  const walletConnected = status === 'connected'

  const [isOpen, setIsOpen] = useState(false)
  const [model, setModel] = useState('gemini') // gemini | groq
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello. I am your ExChange AI Assistant. How can I help you navigate assets, swaps, settlement, or market data today?'
    }
  ])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Construct Wallet Context system prompt
  const getSystemPrompt = () => {
    const ethBal = balance ? (Number(balance) / 1e18).toFixed(4) : '0'
    const shortAccount = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'
    const tokenCount = tokenList ? tokenList.length : 0
    const txCount = txHistory ? txHistory.length : 0

    return `You are "ExChange AI Assistant", a premium Web3 companion.
Context:
- User Wallet Connection: ${walletConnected ? 'Connected' : 'Not Connected'}
- Wallet Address: ${shortAccount}
- ETH Balance: ${ethBal} ETH
- ERC-20 Tokens Detected: ${tokenCount} tokens
- Total Transaction Count: ${txCount} transactions

Instructions:
1. Provide accurate, helpful, and concise answers about cryptocurrency, DeFi, Web3 wallets, or general blockchain.
2. If the user asks about their balance, address, holdings, or transactions, refer directly to the context provided above.
3. Be professional, friendly, and structured. Use bullet points or code snippets where helpful. Avoid generic placeholders. Keep answers short (under 4 sentences if possible).`
  };

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { sender: 'user', text: userText }])
    setLoading(true)

    const systemPrompt = getSystemPrompt()

    try {
      if (model === 'gemini') {
        // --- GEMINI API CALL ---
        if (!GEMINI_API_KEY) {
          throw new Error('Gemini API key is missing. Add it to your .env file.')
        }

        // Construct history + prompt
        const historyText = messages
          .slice(-10) // Limit to last 10 messages for token budget
          .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
          .join('\n')

        const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText}\n\nUser: ${userText}\nAssistant:`

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: fullPrompt }]
                }
              ]
            })
          }
        )

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error?.message || `HTTP ${res.status} Error`)
        }

        const data = await res.json()
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received from Gemini.'
        setMessages(prev => [...prev, { sender: 'bot', text: botReply.trim() }])

      } else {
        // --- GROQ API CALL ---
        if (!GROQ_API_KEY) {
          throw new Error('Groq API key is missing. Add it to your .env file.')
        }

        const historyMsgs = messages.slice(-10).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: systemPrompt },
              ...historyMsgs,
              { role: 'user', content: userText }
            ],
            temperature: 0.7,
            max_tokens: 300
          })
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error?.message || `HTTP ${res.status} Error`)
        }

        const data = await res.json()
        const botReply = data.choices?.[0]?.message?.content || 'No response received from Groq.'
        setMessages(prev => [...prev, { sender: 'bot', text: botReply.trim() }])
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Warning: unable to fetch a response. Details: ${err.message}`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.chatbotContainer}>
      
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button 
          className={styles.chatBubble} 
          onClick={() => setIsOpen(true)}
          title="Open AI Assistant"
          id="chat-floating-bubble"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className={styles.glowEffect} />
        </button>
      )}

      {/* Expanded Chat Box Window */}
      {isOpen && (
        <div className={styles.chatBox}>
          
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerTitleRow}>
              <div className={styles.avatarMini} />
              <div>
                <h4 className={styles.headerTitle}>AI Assistant</h4>
                <span className={styles.headerStatus}>Online</span>
              </div>
            </div>

            {/* Model Tabs toggle */}
            <div className={styles.modelToggle}>
              <button 
                type="button"
                className={`${styles.toggleBtn} ${model === 'gemini' ? styles.activeToggle : ''}`}
                onClick={() => setModel('gemini')}
              >
                Gemini
              </button>
              <button 
                type="button"
                className={`${styles.toggleBtn} ${model === 'groq' ? styles.activeToggle : ''}`}
                onClick={() => setModel('groq')}
              >
                Groq
              </button>
            </div>

            <button 
              className={styles.closeBtn} 
              onClick={() => setIsOpen(false)}
              title="Minimize chat"
            >
              X
            </button>
          </div>

          {/* Messages list */}
          <div className={styles.messagesList}>
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.msgUser : styles.msgBot}`}
              >
                {msg.sender === 'bot' && <div className={styles.botIcon} />}
                <div className={styles.bubble}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.messageWrapper} ${styles.msgBot}`}>
                <div className={styles.botIcon} />
                <div className={styles.bubble} style={{ display: 'flex', gap: 4, padding: '12px 16px' }}>
                  <span className={styles.dot} style={{ animationDelay: '0s' }} />
                  <span className={styles.dot} style={{ animationDelay: '0.2s' }} />
                  <span className={styles.dot} style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input footer */}
          <form onSubmit={handleSend} className={styles.chatInputRow}>
            <input
              type="text"
              placeholder="Ask about your balance, market..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className={styles.sendBtn} disabled={loading}>
              Send
            </button>
          </form>

        </div>
      )}

    </div>
  )
}
