// src/components/FirstAidDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import styles from './FirstAid.module.css';

const FirstAidDetail = () => {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/first-aid/articles/${id}`);
                setArticle(response.data);
            } catch (error) {
                console.error("Failed to fetch article", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    if (loading) return <div className={styles.loading}>Loading article...</div>;
    if (!article) return <div>Article not found.</div>;

    return (
        <div className={styles.container}>
            <Link to="/first-aid" className={styles.backLink}>← Back to All Articles</Link>
            <div className={styles.articleContent}>
                <h1>{article.title}</h1>
                <div className={styles.categoryTag}>{article.category}</div>
                <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
        </div>
    );
};

export default FirstAidDetail;