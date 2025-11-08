import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

function RolesManagement({ setMessage }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for technician credential upload
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [credentialFile, setCredentialFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    // (buttons UI - no select state required)

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try { const res = await axios.get(`${API_URL}/users`); setUsers(res.data || []); }
        catch (e) { console.error(e); }
        setLoading(false);
    };

    const changeRoleDirect = async (u, role) => {
        try {
            // Enforce single admin: if assigning Admin, ensure no other admin exists
            if (role === 'Admin') {
                const otherAdmin = users.find(x => x.role === 'Admin' && x.id !== u.id);
                if (otherAdmin) {
                    setMessage({ text: `There is already an Admin (${otherAdmin.fullName}). Only one Admin allowed.`, type: 'error' });
                    return;
                }
            }

            await axios.patch(`${API_URL}/users/${u.id}`, { role });
            setMessage({ text: `Role updated for ${u.fullName}`, type: 'success' });
            await fetchUsers();
        } catch (e) { console.error(e); setMessage({ text: 'Error updating role', type: 'error' }); }
    };

    const requestTechnician = (u) => {
        // Open modal to upload credential before promoting
        setSelectedUser(u);
        setCredentialFile(null);
        setModalOpen(true);
    };

    const submitCredentialAndPromote = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        if (!credentialFile) { setMessage({ text: 'Please attach your credential file before submitting.', type: 'error' }); return; }

        try {
            setUploading(true);

            // Simulate upload by storing credential info on the user record.
            const credentialInfo = { fileName: credentialFile.name, uploadedAt: new Date().toISOString() };

            // Patch user: set role to Technician and attach credential info
            await axios.patch(`${API_URL}/users/${selectedUser.id}`, { role: 'Technician', credential: credentialInfo });

            setMessage({ text: `${selectedUser.fullName} promoted to Technician (credential uploaded).`, type: 'success' });
            setModalOpen(false);
            setSelectedUser(null);
            setCredentialFile(null);
            await fetchUsers();
        } catch (err) {
            console.error(err);
            setMessage({ text: 'Error uploading credential or updating role', type: 'error' });
        } finally { setUploading(false); }
    };

    // no select handler; using button-based actions below

    return (
        <div>
            <h2>Manage Roles</h2>
            <table className="admin-table">
                <thead><tr><th>User</th><th>Role</th><th>Action</th></tr></thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.fullName} ({u.email})</td>
                            <td>{u.role}</td>
                            <td>
                                {u.role === 'Admin' ? (
                                    <span style={{ fontWeight: 600 }}>Admin</span>
                                ) : (
                                    <>
                                        {u.role !== 'Student' && (
                                            <button className="btn" onClick={() => changeRoleDirect(u, 'Student')} title={u.role === 'Admin' ? 'Cannot change Admin role' : 'Set as Student'}>Student</button>
                                        )}

                                        {u.role !== 'Technician' && (
                                            <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => {
                                                if (u.role === 'Admin') return; // do not change admin
                                                if (u.role === 'Technician') return changeRoleDirect(u, 'Technician');
                                                requestTechnician(u);
                                            }} title={u.role === 'Admin' ? 'Cannot change Admin role' : 'Promote to Technician (requires credential)'}>Technician</button>
                                        )}


                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {modalOpen && selectedUser && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h3>Submit Credential for Technician Role</h3>
                        <p>Upload a copy of the applicant's technician certificate or relevant credential. After submission, the user will be promoted to Technician.</p>
                        <form onSubmit={submitCredentialAndPromote}>
                            <div className="form-row">
                                <label>Selected user: <strong>{selectedUser.fullName}</strong></label>
                            </div>
                            <div className="form-row">
                                <input type="file" accept="application/pdf,image/*" onChange={e => setCredentialFile(e.target.files && e.target.files[0])} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setSelectedUser(null); setCredentialFile(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'Submitting...' : 'Submit & Promote'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RolesManagement;
