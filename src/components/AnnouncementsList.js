import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

function AnnouncementsList() {
    const [items, setItems] = useState([]);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => { fetch(); }, []);

    const fetch = async () => {
        try { const res = await axios.get(`${API_URL}/announcements?visible=true&_sort=createdAt&_order=desc`); setItems(res.data || []); }
        catch (e) { console.error(e); }
    };

    return (
        <div>
            <h2>News & Announcements</h2>
            {items.length === 0 ? <p>No announcements.</p> : (
                <ul className="announcement-list">
                    {items.map(a => (
                        <li key={a.id} className="announcement-item" onClick={() => { setSelected(a); setDetailOpen(true); }}>
                            <strong className="announcement-title">{a.title}</strong>
                            <div className="announcement-excerpt">{a.content}</div>
                            <div className="announcement-meta">{new Date(a.createdAt).toLocaleString()}</div>
                        </li>
                    ))}
                </ul>
            )}

            {detailOpen && selected && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h2 style={{ marginTop:0 }}>{selected.title}</h2>
                        <div style={{ color:'#444', marginBottom: 12 }}>{selected.content}</div>
                        <div className="announcement-meta">Created: {new Date(selected.createdAt).toLocaleString()} • Visible: {selected.visible ? 'Yes' : 'No'}</div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => { setDetailOpen(false); setSelected(null); }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnnouncementsList;
