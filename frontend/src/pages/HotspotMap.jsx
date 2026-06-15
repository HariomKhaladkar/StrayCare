// frontend/src/pages/HotspotMap.jsx
// Feature 4: Zone Red – Admin/NGO Hotspot Map (K-Means clustering on case GPS)
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Circle,
    Popup,
    useMap,
} from 'react-leaflet';

const adminToken = () => localStorage.getItem('token');
const BASE = API_BASE_URL;

const SEVERITY_COLORS = {
    Critical: '#ef4444',
    High:     '#f97316',
    Moderate: '#eab308',
    Low:      '#22c55e',
};

const RISK_META = {
    Critical: { fillOpacity: 0.18, strokeOpacity: 0.7 },
    High:     { fillOpacity: 0.15, strokeOpacity: 0.6 },
    Moderate: { fillOpacity: 0.12, strokeOpacity: 0.5 },
    Low:      { fillOpacity: 0.10, strokeOpacity: 0.4 },
};

// ─── Auto-fit bounds to markers ─────────────────────────────────────────────
function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
        if (!markers || markers.length === 0) return;
        const bounds = markers.map(m => [m.lat, m.lon]);
        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [markers, map]);
    return null;
}

// ─── Real Leaflet Map ────────────────────────────────────────────────────────
const HotspotLeafletMap = ({ clusters, markers }) => {
    const defaultCenter = markers && markers.length > 0
        ? [markers[0].lat, markers[0].lon]
        : [20.5937, 78.9629]; // India center

    return (
        <MapContainer
            center={defaultCenter}
            zoom={6}
            style={{ height: '460px', width: '100%', borderRadius: '0.75rem' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto-fit map to all case markers */}
            {markers && markers.length > 0 && <FitBounds markers={markers} />}

            {/* Cluster danger zones – large translucent circles */}
            {clusters && clusters.map((cluster, i) => {
                const meta = RISK_META[cluster.risk_level] || RISK_META.Low;
                return (
                    <React.Fragment key={`cluster-${i}`}>
                        {/* Outer glow ring */}
                        <Circle
                            center={[cluster.lat, cluster.lon]}
                            radius={cluster.radius_m * 1.5}
                            pathOptions={{
                                color: cluster.color,
                                fillColor: cluster.color,
                                fillOpacity: 0.04,
                                weight: 0,
                            }}
                        />
                        {/* Main cluster zone */}
                        <Circle
                            center={[cluster.lat, cluster.lon]}
                            radius={cluster.radius_m}
                            pathOptions={{
                                color: cluster.color,
                                fillColor: cluster.color,
                                fillOpacity: meta.fillOpacity,
                                weight: 2,
                                opacity: meta.strokeOpacity,
                                dashArray: '6 4',
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: 180, fontFamily: 'Inter, sans-serif' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        marginBottom: '0.5rem',
                                    }}>
                                        <span style={{
                                            background: cluster.color + '22',
                                            color: cluster.color,
                                            border: `1px solid ${cluster.color}60`,
                                            borderRadius: '99px',
                                            padding: '0.15rem 0.6rem',
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                        }}>
                                            ⚠️ {cluster.risk_level} Zone
                                        </span>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                        <tbody>
                                            <tr><td style={{ color: '#888', paddingRight: '0.5rem' }}>Cases</td><td style={{ fontWeight: 700, color: cluster.color }}>{cluster.case_count}</td></tr>
                                            <tr><td style={{ color: '#888' }}>Radius</td><td style={{ fontWeight: 600 }}>{cluster.radius_m} m</td></tr>
                                            <tr><td style={{ color: '#888' }}>Lat</td><td style={{ fontFamily: 'monospace' }}>{cluster.lat.toFixed(5)}</td></tr>
                                            <tr><td style={{ color: '#888' }}>Lon</td><td style={{ fontFamily: 'monospace' }}>{cluster.lon.toFixed(5)}</td></tr>
                                        </tbody>
                                    </table>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
                                        💡 Deploy resources within {cluster.radius_m}m of this centre.
                                    </div>
                                </div>
                            </Popup>
                        </Circle>

                        {/* Cluster centre dot */}
                        <CircleMarker
                            center={[cluster.lat, cluster.lon]}
                            radius={7}
                            pathOptions={{
                                color: '#fff',
                                fillColor: cluster.color,
                                fillOpacity: 0.95,
                                weight: 2,
                            }}
                        />
                    </React.Fragment>
                );
            })}

            {/* Individual case markers */}
            {markers && markers.map((m) => {
                const color = SEVERITY_COLORS[m.severity_label] || '#94a3b8';
                return (
                    <CircleMarker
                        key={`case-${m.id}`}
                        center={[m.lat, m.lon]}
                        radius={5}
                        pathOptions={{
                            color: '#fff',
                            fillColor: color,
                            fillOpacity: 0.9,
                            weight: 1.5,
                        }}
                    >
                        <Popup>
                            <div style={{ minWidth: 160, fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>
                                    📍 Case #{m.id}
                                </div>
                                <div>
                                    <span style={{
                                        background: color + '22',
                                        color: color,
                                        border: `1px solid ${color}60`,
                                        borderRadius: '99px',
                                        padding: '0.1rem 0.5rem',
                                        fontWeight: 700,
                                        fontSize: '0.72rem',
                                    }}>
                                        {m.severity_label}
                                    </span>
                                </div>
                                <div style={{ marginTop: '0.4rem', color: '#555', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                    {m.lat.toFixed(5)}, {m.lon.toFixed(5)}
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
};

// ─── Legend Item ─────────────────────────────────────────────────────────────
const LegendItem = ({ color, label, desc }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
        <div style={{
            width: 14, height: 14, borderRadius: '50%',
            background: color, flexShrink: 0,
            boxShadow: `0 0 6px ${color}80`,
        }} />
        <div>
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f1f5f9' }}>{label}</span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginLeft: '0.35rem' }}>{desc}</span>
        </div>
    </div>
);

// ─── Cluster Table ────────────────────────────────────────────────────────────
const ClusterTable = ({ clusters }) => (
    <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['Risk Level', 'Lat', 'Lon', 'Cases', 'Action Radius'].map(h => (
                        <th key={h} style={{
                            textAlign: 'left', padding: '0.5rem 0.75rem',
                            color: '#94a3b8', fontWeight: 700,
                            fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {clusters.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                            <span style={{
                                color: c.color, background: c.color + '18',
                                border: `1px solid ${c.color}40`,
                                borderRadius: '99px', padding: '0.15rem 0.6rem',
                                fontWeight: 700, fontSize: '0.75rem',
                            }}>
                                {c.risk_level}
                            </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#e2e8f0', fontFamily: 'monospace' }}>{c.lat.toFixed(5)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#e2e8f0', fontFamily: 'monospace' }}>{c.lon.toFixed(5)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: c.color, fontWeight: 800, fontSize: '1rem' }}>{c.case_count}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'rgba(255,255,255,0.5)' }}>{c.radius_m}m</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HotspotMap() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [k, setK]             = useState(5);

    const fetchHotspots = async (clusterCount = k) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${BASE}/admin/hotspots?k=${clusterCount}`, {
                headers: { Authorization: `Bearer ${adminToken()}` },
            });
            setData(res.data);
        } catch (e) {
            setError(e.response?.data?.detail || 'Admin access required or no cases in database.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHotspots(); }, []);

    const PANEL = {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        padding: '1.25rem',
    };

    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '1rem 0.75rem' }}>

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{
                    fontSize: '2rem', fontWeight: 900, margin: '0 0 0.3rem',
                    background: 'linear-gradient(135deg, #ef4444, #f97316, #eab308)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    🗺️ Zone Red – Hotspot Map
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                    K-Means clustering on all reported case GPS coordinates. Click any zone or case pin for details.
                    NGOs should deploy feeding stations and vaccination camps at Critical & High zones.
                </p>
            </div>

            {/* Controls */}
            <div style={{ ...PANEL, marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600 }}>
                    Cluster count (K):
                    <input
                        type="number" min={2} max={10} value={k}
                        onChange={e => setK(Number(e.target.value))}
                        style={{
                            marginLeft: '0.5rem', width: 60, padding: '0.3rem 0.5rem',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '0.4rem', color: '#f1f5f9', textAlign: 'center',
                        }}
                    />
                </label>
                <button
                    onClick={() => fetchHotspots(k)}
                    style={{
                        padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem',
                        background: 'linear-gradient(135deg, #ef4444, #f97316)',
                        color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
                        boxShadow: '0 3px 10px rgba(239,68,68,0.35)',
                    }}
                >
                    🔄 Re-Cluster
                </button>

                {data && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginLeft: 'auto' }}>
                        {data.total_cases_mapped} cases mapped · {data.clusters.length} zones identified
                    </span>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.4)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                    Running K-Means clustering…
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{
                    ...PANEL, background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', textAlign: 'center', padding: '2rem',
                }}>
                    🔒 {error}
                </div>
            )}

            {!loading && !error && data && (
                <>
                    {data.total_cases_mapped === 0 ? (
                        <div style={{ ...PANEL, textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.35)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📍</div>
                            <p>No cases with GPS coordinates yet. Report some cases first!</p>
                        </div>
                    ) : (
                        <>
                            {/* Map Row */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: '1.25rem',
                                marginBottom: '1.25rem',
                                alignItems: 'start',
                            }}>
                                {/* REAL LEAFLET MAP */}
                                <div style={PANEL}>
                                    <p style={{
                                        margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 700,
                                        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em',
                                    }}>
                                        🗺️ Interactive Danger Zone Map
                                    </p>
                                    <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <HotspotLeafletMap
                                            clusters={data.clusters}
                                            markers={data.markers}
                                        />
                                    </div>
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                                        Click any zone circle or case dot for details · Scroll to zoom
                                    </p>
                                </div>

                                {/* Legend + Stats */}
                                <div style={{ minWidth: 170 }}>
                                    <div style={{ ...PANEL, marginBottom: '1rem' }}>
                                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                            Map Legend
                                        </p>
                                        <LegendItem color="#ef4444" label="Critical Zone" desc="≥10 cases" />
                                        <LegendItem color="#f97316" label="High Zone"     desc="≥5 cases" />
                                        <LegendItem color="#eab308" label="Moderate Zone" desc="≥2 cases" />
                                        <LegendItem color="#22c55e" label="Low Zone"      desc="1 case" />
                                        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                                Case Dots
                                            </p>
                                            <LegendItem color="#ef4444" label="Critical" desc="" />
                                            <LegendItem color="#f97316" label="High"     desc="" />
                                            <LegendItem color="#eab308" label="Moderate" desc="" />
                                            <LegendItem color="#22c55e" label="Low"      desc="" />
                                        </div>
                                    </div>

                                    {/* Top danger zone callout */}
                                    {data.clusters[0] && (
                                        <div style={{
                                            ...PANEL,
                                            border: `1px solid ${data.clusters[0].color}50`,
                                            background: data.clusters[0].color + '0a',
                                        }}>
                                            <p style={{
                                                fontSize: '0.7rem', fontWeight: 700,
                                                color: data.clusters[0].color,
                                                textTransform: 'uppercase', letterSpacing: '0.07em',
                                                margin: '0 0 0.5rem',
                                            }}>
                                                ⚠️ Highest Risk Zone
                                            </p>
                                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: data.clusters[0].color, lineHeight: 1 }}>
                                                {data.clusters[0].case_count}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>
                                                cases reported
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.3rem', fontFamily: 'monospace' }}>
                                                {data.clusters[0].lat.toFixed(4)}, {data.clusters[0].lon.toFixed(4)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cluster Details Table */}
                            <div style={PANEL}>
                                <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                    📊 Cluster Details — Deployment Recommendations
                                </p>
                                <ClusterTable clusters={data.clusters} />
                            </div>

                            {/* Insight callout */}
                            <div style={{
                                marginTop: '1.25rem', padding: '1rem 1.25rem',
                                background: 'rgba(99,102,241,0.07)',
                                border: '1px solid rgba(99,102,241,0.25)',
                                borderRadius: '0.75rem', fontSize: '0.85rem',
                                color: 'rgba(255,255,255,0.6)',
                                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>💡</span>
                                <div>
                                    <strong style={{ color: '#a5b4fc' }}>NGO Deployment Guidance: </strong>
                                    Focus resources on the <strong style={{ color: '#ef4444' }}>Critical</strong> and{' '}
                                    <strong style={{ color: '#f97316' }}>High</strong> zones first.
                                    Set up feeding stations within the cluster radius, and schedule vaccination camps
                                    in these coordinates. Re-cluster weekly as new cases come in.
                                    <strong style={{ color: '#a5b4fc' }}> Click zone circles on the map</strong> for exact coordinates and deployment radius.
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
