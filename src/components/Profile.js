import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

function Profile({ currentUser, setMessage, onUpdateUser }) {
    const [form, setForm] = useState({ fullName: '', email: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        setForm({ fullName: currentUser.fullName || '', email: currentUser.email || '' });
        setLoading(false);
    }, [currentUser]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`${API_URL}/users/${currentUser.id}`, form);
            setMessage({ text: 'Profile updated', type: 'success' });
            // refresh session user
            const updated = { ...currentUser, ...form };
            sessionStorage.setItem('sbe_user_session', JSON.stringify(updated));
            onUpdateUser(updated);
        } catch (e) { console.error(e); setMessage({ text: 'Error updating profile', type: 'error' }); }
    };

    if (loading) return <p>Loading profile...</p>;

    return (
        <div>
            <h2>My Profile</h2>
            <form onSubmit={handleSave} style={{ maxWidth: 600 }}>
                <div className="form-group">
                    <label>Full name</label>
                    <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="modal-actions">
                    <button type="submit">Save</button>
                </div>
            </form>
        </div>
    );
}

export default Profile;
