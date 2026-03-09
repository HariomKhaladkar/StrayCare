// src/components/Chatbot.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import styles from './Chatbot.module.css';

const Chatbot = ({ onClose }) => {
    const [messages, setMessages] = useState([
        { from: 'ai', text: 'Hello! How can I help you with pet first aid today?' }
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
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://127.0.0.1:8000/chatbot/query', { query: input });
            const aiMessage = { from: 'ai', text: response.data.response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = { from: 'ai', text: 'Sorry, I am having trouble connecting. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.chatWindow}>
            <div className={styles.chatHeader}>
                <h3>StrayCare AI Assistant</h3>
                <button onClick={onClose} className={styles.closeButton}>×</button>
            </div>
            <div className={styles.chatMessages}>
                {messages.map((msg, index) => (
                    <div key={index} className={`${styles.message} ${styles[msg.from]}`}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div className={`${styles.message} ${styles.ai} ${styles.typing}`}>Typing...</div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className={styles.chatInputForm}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a first-aid question..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>Send</button>
            </form>
        </div>
    );
};

export default Chatbot;