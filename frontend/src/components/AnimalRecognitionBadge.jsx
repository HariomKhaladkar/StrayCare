// frontend/src/components/AnimalRecognitionBadge.jsx
//
// A self-contained image upload area that shows:
//  - A preview of the selected image
//  - A live "AI Analysing…" spinner
//  - A beautiful result badge: emoji + animal type + confidence bar
//
// 📱 Android / Capacitor: uses native Camera API (camera or gallery prompt)
// 🌐 Web browser:         uses standard <input type="file"> fallback
//
import React, { useRef, useCallback } from 'react';
import { useAnimalRecognition } from '../hooks/useAnimalRecognition';
import { useNativeCamera } from '../hooks/useNativeCamera';

const CONFIDENCE_COLOR = (pct) => {
    if (pct >= 80) return '#22c55e';
    if (pct >= 50) return '#eab308';
    return '#f97316';
};

const STATUS_MESSAGES = {
    idle: null,
    loading_model: { text: 'Loading AI model (first time only)…', spin: true },
    analyzing: { text: '🔍 Analysing image…', spin: true },
    done: null,
    not_animal: { text: '⚠️ No animal detected. Please upload a clear photo of the animal.', spin: false, warn: true },
    error: { text: null, spin: false, warn: true },
};

const Spinner = () => (
    <div style={{
        width: 18, height: 18, border: '2.5px solid rgba(99,102,241,0.2)',
        borderTop: '2.5px solid #6366f1', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem',
    }} />
);

const AnimalRecognitionBadge = ({
    onFileChange,
    onAnimalDetected,
    label = 'Photo',
    required = false,
    accept = 'image/*',
    id = 'animal-photo-input',
}) => {
    const { result, status, error: recogError, analyze, reset } = useAnimalRecognition();
    const {
        capturePhoto,
        handleWebFileChange,
        fileInputRef,
        photoPreview: nativePreview,
        photoFile: nativeFile,
        clearPhoto: clearNativePhoto,
        isNative,
        isLoading: cameraLoading,
        error: cameraError,
    } = useNativeCamera();

    const imgRef = useRef(null);
    const [preview, setPreview] = React.useState(null);

    // Shared: run AI analysis on any image source
    const runAnalysis = useCallback((dataUrl, file) => {
        if (onFileChange) onFileChange(file);
        reset();
        setPreview(dataUrl);
        const img = new Image();
        img.onload = () => { imgRef.current = img; analyze(img); };
        img.src = dataUrl;
    }, [onFileChange, analyze, reset]);

    // Native (Android): react when useNativeCamera gives us a file
    React.useEffect(() => {
        if (isNative && nativeFile && nativePreview) {
            runAnalysis(nativePreview, nativeFile);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nativeFile, nativePreview]);

    // Web fallback: standard file input onChange
    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        handleWebFileChange(e);
        const url = URL.createObjectURL(file);
        runAnalysis(url, file);
    }, [handleWebFileChange, runAnalysis]);

    const handleClear = useCallback(() => {
        setPreview(null);
        reset();
        clearNativePhoto();
        if (onFileChange) onFileChange(null);
    }, [reset, clearNativePhoto, onFileChange]);

    React.useEffect(() => {
        if (result && onAnimalDetected) onAnimalDetected(result);
    }, [result, onAnimalDetected]);

    const statusInfo = STATUS_MESSAGES[status];
    const displayPreview = preview || nativePreview;

    return (
        <div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }}`}</style>

            {/* Label */}
            <label
                htmlFor={isNative ? undefined : id}
                style={{
                    fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)',
                    marginBottom: '0.6rem', display: 'block', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                }}
            >
                {label} {required && '*'}
            </label>

            {/* Camera / file picker */}
            {!displayPreview && (
                <div>
                    {isNative ? (
                        /* Android: big native camera button */
                        <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={cameraLoading}
                            style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: '0.5rem', width: '100%', minHeight: 140,
                                background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(236,72,153,0.1))',
                                border: '2px dashed rgba(99,102,241,0.45)', borderRadius: '1rem',
                                cursor: cameraLoading ? 'not-allowed' : 'pointer',
                                color: '#a5b4fc', fontSize: '0.9rem', fontWeight: 700,
                            }}
                        >
                            {cameraLoading ? (
                                <>
                                    <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #818cf8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    <span>Opening camera…</span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '2.5rem' }}>📷</span>
                                    <span>Tap to take photo or choose from gallery</span>
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                                        Camera · Gallery · AI auto-detection
                                    </span>
                                </>
                            )}
                        </button>
                    ) : (
                        /* Web: styled upload area with hidden file input */
                        <>
                            <label
                                htmlFor={id}
                                style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    gap: '0.5rem', width: '100%', minHeight: 120,
                                    background: 'rgba(99,102,241,0.07)',
                                    border: '2px dashed rgba(99,102,241,0.35)', borderRadius: '1rem',
                                    cursor: 'pointer', color: '#a5b4fc',
                                    fontSize: '0.88rem', fontWeight: 600, boxSizing: 'border-box',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.14)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
                            >
                                <span style={{ fontSize: '2rem' }}>🖼️</span>
                                <span>Click to upload photo</span>
                                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
                                    JPG, PNG, WEBP · AI auto-detection
                                </span>
                            </label>
                            <input
                                id={id}
                                ref={fileInputRef}
                                type="file"
                                accept={accept}
                                onChange={handleFileChange}
                                required={required}
                                style={{ display: 'none' }}
                            />
                        </>
                    )}
                    {cameraError && (
                        <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>{cameraError}</p>
                    )}
                </div>
            )}

            {/* Image Preview + Analysis Result */}
            {displayPreview && (
                <div style={{ marginTop: '0.75rem' }}>
                    <div style={{
                        position: 'relative', display: 'inline-block', borderRadius: '0.6rem',
                        overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)',
                        boxShadow: result ? `0 0 20px ${CONFIDENCE_COLOR(result.confidence)}40` : 'none',
                        transition: 'box-shadow 0.4s', maxWidth: '100%',
                    }}>
                        <img
                            src={displayPreview}
                            alt="Preview"
                            style={{ display: 'block', maxHeight: 200, maxWidth: '100%', objectFit: 'cover' }}
                        />

                        {/* Clear / retake overlay button */}
                        <button
                            type="button"
                            onClick={handleClear}
                            title={isNative ? 'Retake photo' : 'Remove photo'}
                            style={{
                                position: 'absolute', top: 8, right: 8,
                                background: 'rgba(0,0,0,0.65)', color: '#fff',
                                border: 'none', borderRadius: '50%',
                                width: 28, height: 28, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.85rem', fontWeight: 700,
                            }}
                        >
                            {isNative ? '🔄' : '✕'}
                        </button>

                        {/* Overlay spinner while analysing */}
                        {(status === 'loading_model' || status === 'analyzing') && (
                            <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'column', gap: '0.5rem',
                            }}>
                                <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #818cf8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>
                                    {status === 'loading_model' ? 'Loading AI…' : 'Analysing…'}
                                </span>
                            </div>
                        )}

                        {/* Result emoji overlaid on bottom of image */}
                        {status === 'done' && result && (
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                                padding: '1.2rem 0.75rem 0.6rem',
                            }}>
                                <span style={{ fontSize: '1.3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{result.emoji}</span>
                            </div>
                        )}
                    </div>

                    {/* Result Card */}
                    {status === 'done' && result && (
                        <div style={{
                            marginTop: '0.6rem',
                            background: `linear-gradient(135deg, ${CONFIDENCE_COLOR(result.confidence)}15, rgba(99,102,241,0.08))`,
                            border: `1px solid ${CONFIDENCE_COLOR(result.confidence)}40`,
                            borderRadius: '0.7rem', padding: '0.75rem 1rem', animation: 'fadeIn 0.4s ease',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <div>
                                    <span style={{ fontSize: '1.1rem', marginRight: '0.4rem' }}>{result.emoji}</span>
                                    <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem' }}>{result.label}</span>
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '99px', padding: '0.1rem 0.5rem', fontWeight: 700 }}>
                                        {result.species}
                                    </span>
                                </div>
                                <span style={{ fontWeight: 900, fontSize: '1rem', color: CONFIDENCE_COLOR(result.confidence) }}>
                                    {result.confidence}%
                                </span>
                            </div>
                            <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
                                <div style={{ height: '100%', borderRadius: 99, width: `${result.confidence}%`, background: CONFIDENCE_COLOR(result.confidence), transition: 'width 0.8s ease' }} />
                            </div>
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>
                                🤖 AI detected · {result.rawLabel}
                                {isNative && <span style={{ marginLeft: '0.5rem' }}>📷 Native Camera</span>}
                            </p>
                        </div>
                    )}

                    {/* Status messages */}
                    {statusInfo && (
                        <div style={{
                            marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                            background: statusInfo.warn ? 'rgba(234,179,8,0.08)' : 'rgba(99,102,241,0.08)',
                            border: `1px solid ${statusInfo.warn ? 'rgba(234,179,8,0.3)' : 'rgba(99,102,241,0.25)'}`,
                            borderRadius: '0.5rem', fontSize: '0.82rem',
                            color: statusInfo.warn ? '#fbbf24' : '#a5b4fc',
                            display: 'flex', alignItems: 'center',
                        }}>
                            {statusInfo.spin && <Spinner />}
                            {statusInfo.text || recogError}
                        </div>
                    )}

                    {/* Retake button on Android */}
                    {isNative && (
                        <button
                            type="button"
                            onClick={() => { handleClear(); setTimeout(capturePhoto, 150); }}
                            style={{
                                marginTop: '0.75rem', width: '100%',
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                color: '#a5b4fc', borderRadius: '0.6rem',
                                padding: '0.5rem', cursor: 'pointer',
                                fontSize: '0.85rem', fontWeight: 600,
                            }}
                        >
                            📷 Retake Photo
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnimalRecognitionBadge;
