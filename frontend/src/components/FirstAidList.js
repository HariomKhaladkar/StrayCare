// src/components/FirstAidList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

import { Link } from 'react-router-dom';
import styles from './FirstAid.module.css';

const FirstAidList = () => {
    const [articles, setArticles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/first-aid/articles`);
                setArticles(response.data);
            } catch (error) {
                console.error("Failed to fetch articles", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className={styles.loading}>Loading Knowledge Base…</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>🩺 First-Aid Knowledge Base</h1>
            <p className={styles.pageSubtitle}>
                Practical guides and video tutorials to help you assist stray animals in need.
            </p>

            <input
                type="text"
                placeholder="Search for a topic (e.g., 'wound', 'dehydration')…"
                className={styles.searchBar}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className={styles.articleList}>
                {filteredArticles.length > 0 ? (
                    filteredArticles.map(article => (
                        <Link to={`/first-aid/${article.id}`} key={article.id} className={styles.articleCard}>
                            <div className={styles.cardTop}>
                                <div className={styles.categoryTag}>{article.category}</div>
                                {article.video_url && (
                                    <div className={styles.videoBadge}>
                                        🎬 Includes Video
                                    </div>
                                )}
                            </div>
                            <h2>{article.title}</h2>
                            <p>{article.summary}</p>
                            <span className={styles.readMore}>Read More →</span>
                        </Link>
                    ))
                ) : (
                    <p className={styles.noResults}>No articles found matching your search.</p>
                )}
            </div>
        </div>
    );
};

export default FirstAidList;