import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

import ReactMarkdown from 'react-markdown';
import styles from './Chatbot.module.css';

const Chatbot = ({ onClose }) => {
    const [messages, setMessages] = useState([
        { from: 'ai', text: 'Hello! I am the **StrayCare AI Assistant** powered by Gemini. I can help with animal first aid, rescue guidance, and anything about the StrayCare app. How can I help you today? 🐾' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { from: 'user', text: input };
        const currentInput = input;
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build history from previous messages (excluding the initial greeting and the current message)
            const allMessages = [...messages]; // messages state before adding the new one
            const history = allMessages
                .filter(msg => msg.from === 'user' || msg.from === 'ai')
                .slice(1) // skip the initial system greeting
                .map(msg => ({
                    role: msg.from === 'ai' ? 'model' : 'user',
                    text: msg.text,
                }));

            const response = await axios.post(`${API_BASE_URL}/chatbot/query`, {
                query: currentInput,
                history: history,
            });
            const aiMessage = { from: 'ai', text: response.data.response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = { from: 'ai', text: 'Sorry, I am having trouble connecting to the AI backend. Please try again in a moment.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.chatWindow}>
            <div className={styles.chatHeader}>
                <div className={styles.headerInfo}>
                    <span className={styles.headerIcon}>🐾</span>
                    <div>
                        <h3>StrayCare AI</h3>
                        <span className={styles.statusDot}>Online · Gemini</span>
                    </div>
                </div>
                <button onClick={onClose} className={styles.closeButton}>&times;</button>
            </div>

            <div className={styles.chatMessages}>
                {messages.map((msg, index) => (
                    <div key={index} className={`${styles.messageWrapper} ${styles[msg.from]}`}>
                        {msg.from === 'ai' && <div className={styles.avatar}>🤖</div>}
                        <div className={styles.messageBubble}>
                            {msg.from === 'ai' ? (
                                <div className={styles.markdownContent}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className={`${styles.messageWrapper} ${styles.ai}`}>
                        <div className={styles.avatar}>🤖</div>
                        <div className={`${styles.messageBubble} ${styles.typing}`}>
                            <span className={styles.dot}></span>
                            <span className={styles.dot}></span>
                            <span className={styles.dot}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className={styles.chatInputForm}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about animal care..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </form>
        </div>
    );
};

export default Chatbot;