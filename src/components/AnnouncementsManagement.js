import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from './Pagination'; // ⭐️ 1. Import

const API_URL = 'http://localhost:3001';

function AnnouncementsManagement({ setMessage }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', content: '', visible: true });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', content: '', visible: true });

    // ⭐️ 2. State Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetch = async () => {
        setLoading(true);
        try { 
            const res = await axios.get(`${API_URL}/announcements?_sort=createdAt&_order=desc`); 
            setItems(res.data || []); 
        }
        catch (e) { console.error(e); }
        setLoading(false);
    };
    
    useEffect(() => { fetch(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const id = `ann_${Date.now()}`;
            await axios.post(`${API_URL}/announcements`, { id, ...form, createdAt: new Date().toISOString() });
            setMessage({ text: 'Announcement created', type: 'success' });
            setForm({ title: '', content: '', visible: true });
            fetch();
        } catch (err) { console.error(err); setMessage({ text: 'Error creating announcement', type: 'error' }); }
    };

    const openEditModal = (item) => {
        setEditItem(item);
        setEditForm({ title: item.title, content: item.content, visible: !!item.visible });
        setEditModalOpen(true);
    };

    const closeEditModal = () => { setEditModalOpen(false); setEditItem(null); };

    const handleEditSave = async (e) => {
        e.preventDefault();
        if (!editItem) return;
        try {
            await axios.put(`${API_URL}/announcements/${editItem.id}`, { ...editItem, ...editForm });
            setMessage({ text: 'Announcement updated', type: 'success' });
            closeEditModal();
            fetch();
        } catch (err) { console.error(err); setMessage({ text: 'Error updating announcement', type: 'error' }); }
    };
    const handleDelete = async (id) => { 
        if (!window.confirm('Delete announcement?')) return; 
        await axios.delete(`${API_URL}/announcements/${id}`); 
        setMessage({ text: 'Deleted', type: 'info' }); 
        fetch(); 
    };

    if (loading) return <p>Loading announcements...</p>;

    // ⭐️ 3. Tính toán Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    return (
        <div>
            <h2>Admin: Manage Announcements</h2>

            <form onSubmit={handleSave} style={{ marginBottom: 20, display:'grid', gap:8, background: '#f9f9f9', border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px' }}>
                <h3>Add New Announcement</h3>
                <div className="form-row"><input className="form-input" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
                <div className="form-row"><input className="form-input" placeholder="Content" value={form.content} onChange={e => setForm({...form, content: e.target.value})} required /></div>
                <div className="form-row"><label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={form.visible} onChange={e => setForm({...form, visible: e.target.checked})} /> Visible
                </label></div>
                <div style={{ display:'flex', gap:8 }}>
                    <button type="submit">Create</button>
                </div>
            </form>

            <table className="admin-table">
                <thead>
                    <tr><th>Title</th><th>Visible</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    {/* ⭐️ 4. Map 'currentItems' */}
                    {currentItems.map(it => (
                        <tr key={it.id}>
                            <td>{it.title}</td>
                            <td>{it.visible ? 'Yes' : 'No'}</td>
                            <td>{new Date(it.createdAt).toLocaleString()}</td>
                            <td style={{display: 'flex', gap: '5px'}}>
                                <button onClick={() => openEditModal(it)} className="btn-secondary">Edit</button>
                                <button onClick={() => handleDelete(it.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* ⭐️ 5. Thêm Pagination */}
            <Pagination 
                totalPages={totalPages} 
                currentPage={currentPage} 
                paginate={setCurrentPage} 
            />

            {/* Edit modal */}
            {editModalOpen && editItem && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit Announcement</h3>
                        <form onSubmit={handleEditSave} style={{display: 'block'}}>
                            <div className="form-group" style={{marginTop: '15px'}}>
                                <label>Title</label>
                                <input className="form-input" placeholder="Title" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} required />
                            </div>
                            <div className="form-group" style={{marginTop: '15px'}}>
                                <label>Content</label>
                                <textarea className="form-textarea" placeholder="Content" value={editForm.content} onChange={e => setEditForm({...editForm, content: e.target.value})} required />
                            </div>
                            <div className="form-group" style={{marginTop: '15px'}}>
                                <label><input type="checkbox" checked={editForm.visible} onChange={e => setEditForm({...editForm, visible: e.target.checked})} /> Visible</label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeEditModal}>Cancel</button>
                                <button type="submit">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnnouncementsManagement;