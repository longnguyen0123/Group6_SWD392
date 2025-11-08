import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Pagination from './Pagination'; // ⭐️ 1. Import

const API_URL = 'http://localhost:3001';

function LostReportsManagement({ setMessage }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // ⭐️ 2. State Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => { fetch(); }, []);

    const fetch = async () => {
        setLoading(true);
        try { 
            const res = await axios.get(`${API_URL}/lostReports?_sort=createdAt&_order=desc`); 
            setReports(res.data || []); 
        }
        catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleResolve = async (r) => {
        try {
            await axios.patch(`${API_URL}/lostReports/${r.id}`, { status: 'Resolved' });
            setMessage({ text: `Report ${r.id} marked Resolved`, type: 'info' });
            fetch();
        } catch (e) { console.error(e); setMessage({ text: 'Error updating report', type: 'error' }); }
    };

    if (loading) return <p>Loading reports...</p>;

    // ⭐️ 3. Tính toán Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = reports.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(reports.length / itemsPerPage);

    return (
        <div>
            <h2>Admin: Lost / Theft Reports</h2>
            {reports.length === 0 ? <p>No reports.</p> : (
                <>
                <table>
                    <thead><tr><th>ID</th><th>Bike</th><th>User</th><th>Description</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {/* ⭐️ 4. Map 'currentItems' */}
                        {currentItems.map(r => (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.bikeId}</td>
                                <td>{r.userId}</td>
                                <td>{r.description}</td>
                                <td>
                                    <span className={`status-tag ${r.status === 'Resolved' ? 'status-completed' : 'status-inactive'}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td>
                                    {r.status !== 'Resolved' && <button className="btn-success" onClick={() => handleResolve(r)}>Mark Resolved</button>}
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
                </>
            )}
        </div>
    );
}

export default LostReportsManagement;