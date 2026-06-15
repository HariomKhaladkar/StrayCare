// src/components/FirstAidDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

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
                const response = await axios.get(`${API_BASE_URL}/first-aid/articles/${id}`);
                setArticle(response.data);
            } catch (error) {
                console.error("Failed to fetch article", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    if (loading) return <div className={styles.loading}>Loading article…</div>;
    if (!article) return <div className={styles.loading}>Article not found.</div>;

    // Detect if it's a YouTube embed URL or a local/direct video URL
    const isYouTube = article.video_url && article.video_url.includes('youtube.com/embed');

    return (
        <div className={styles.container}>
            <Link to="/first-aid" className={styles.backLink}>
                ← Back to All Articles
            </Link>

            <div className={styles.articleContent}>
                {/* Header */}
                <div className={styles.articleHeader}>
                    <div className={styles.categoryTag}>{article.category}</div>
                    <h1>{article.title}</h1>
                    {article.summary && (
                        <p className={styles.articleSummary}>{article.summary}</p>
                    )}
                </div>

                {/* ── Video Player ── */}
                {article.video_url && (
                    <div className={styles.videoSection}>
                        <h3 className={styles.videoTitle}>📹 Video Tutorial</h3>
                        {isYouTube ? (
                            <div className={styles.iframeWrapper}>
                                <iframe
                                    src={article.video_url}
                                    title={`${article.title} — video tutorial`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className={styles.videoIframe}
                                />
                            </div>
                        ) : (
                            <video
                                controls
                                className={styles.videoPlayer}
                                preload="metadata"
                            >
                                <source
                                    src={
                                        article.video_url.startsWith('http')
                                            ? article.video_url
                                            : `${API_BASE_URL}/${article.video_url}`
                                    }
                                    type="video/mp4"
                                />
                                Your browser does not support HTML5 video.
                            </video>
                        )}
                    </div>
                )}

                {/* Article Body */}
                <div className={styles.markdownBody}>
                    <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default FirstAidDetail;