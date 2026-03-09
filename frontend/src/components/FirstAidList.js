// src/components/FirstAidList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './FirstAid.module.css';

const FirstAidList = () => {
    // CORRECTED: Initial state is an empty array
    const [articles, setArticles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/first-aid/articles');
                setArticles(response.data);
            } catch (error) {
                console.error("Failed to fetch articles", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    // This line is now safe because 'articles' is always an array
    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className={styles.loading}>Loading Knowledge Base...</div>;

    return (
        <div className={styles.container}>
            <h1>First-Aid Knowledge Base</h1>
            <input
                type="text"
                placeholder="Search for a topic (e.g., 'wound')..."
                className={styles.searchBar}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className={styles.articleList}>
                {filteredArticles.length > 0 ? (
                    filteredArticles.map(article => (
                        <Link to={`/first-aid/${article.id}`} key={article.id} className={styles.articleCard}>
                            <div className={styles.categoryTag}>{article.category}</div>
                            <h2>{article.title}</h2>
                            <p>{article.summary}</p>
                            <span>Read More →</span>
                        </Link>
                    ))
                ) : (
                    <p>No articles found matching your search.</p>
                )}
            </div>
        </div>
    );
};

export default FirstAidList;