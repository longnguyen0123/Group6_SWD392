import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Pagination from './Pagination'; // ⭐️ 1. Import

const API_URL = 'http://localhost:3001';

function PaymentsManagement({ setMessage }) {
    const [payments, setPayments] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);

    // ⭐️ 2. State Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [pRes, uRes] = await Promise.all([
                axios.get(`${API_URL}/payments?_sort=createdAt&_order=desc`),
                axios.get(`${API_URL}/users`)
            ]);
            setPayments(pRes.data || []);
            const map = {};
            (uRes.data || []).forEach(u => { map[u.id] = u; });
            setUsersMap(map);
        } catch (e) { console.error(e); }
        setLoading(false);
    };
    
    useEffect(() => { fetchAll(); }, []);

    const handleCharge = async (p) => {
        try {
            const user = usersMap[p.userId];
            if (!user) { setMessage({ text: 'User not found', type: 'error' }); return; }
            const balance = Number(user.balance || 0);
            if (balance < Number(p.amount)) {
                const confirm = window.confirm(`User has insufficient balance ($${balance}). Charge anyway and allow negative balance?`);
                if (!confirm) return;
            }
            await axios.patch(`${API_URL}/payments/${p.id}`, { status: 'Paid' });
            const newBalance = Math.round((balance - Number(p.amount)) * 100) / 100;
            await axios.patch(`${API_URL}/users/${user.id}`, { balance: newBalance });
            setMessage({ text: `Payment ${p.id} charged. User new balance: $${newBalance}`, type: 'success' });
            await fetchAll();
        } catch (e) { console.error(e); setMessage({ text: 'Error charging payment', type: 'error' }); }
    };

    const handleRefund = async (p) => {
        try {
            const payRes = await axios.get(`${API_URL}/payments/${p.id}`);
            const latest = payRes.data;
            if (!latest) { setMessage({ text: 'Payment not found', type: 'error' }); return; }
            if (latest.status === 'Refunded') {
                setMessage({ text: `Payment ${p.id} already refunded`, type: 'info' });
                await fetchAll();
                return;
            }
            const user = usersMap[p.userId];
            if (!user) { setMessage({ text: 'User not found', type: 'error' }); return; }
            if (!window.confirm(`Refund ${p.amount} to ${user.fullName}? This will mark the payment as Refunded and credit the user's balance.`)) return;
            const balance = Number(user.balance || 0);
            const newBalance = Math.round((balance + Number(p.amount)) * 100) / 100;
            await axios.patch(`${API_URL}/payments/${p.id}`, { status: 'Refunded' });
            await axios.patch(`${API_URL}/users/${user.id}`, { balance: newBalance });
            setMessage({ text: `Payment ${p.id} refunded. User new balance: $${newBalance}`, type: 'success' });
            await fetchAll();
        } catch (e) { console.error(e); setMessage({ text: 'Error refunding payment', type: 'error' }); }
    };

    if (loading) return <p>Loading payments...</p>;

    // ⭐️ 3. Tính toán Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = payments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(payments.length / itemsPerPage);

    return (
        <div>
            <h2>Payments</h2>
            {payments.length === 0 ? <p>No payments.</p> : (
                <>
                <table>
                    <thead><tr><th>ID</th><th>User</th><th>Balance</th><th>Trip</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {/* ⭐️ 4. Map 'currentItems' */}
                        {currentItems.map(p => {
                            const user = usersMap[p.userId];
                            return (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{user ? user.fullName : p.userId}</td>
                                    <td>{user ? `$${Number(user.balance || 0).toFixed(2)}` : '—'}</td>
                                    <td>{p.tripId}</td>
                                    <td>{p.amount} {p.currency}</td>
                                    <td>
                                        <span className={`status-tag ${
                                            p.status === 'Paid' ? 'status-active' :
                                            p.status === 'Refunded' ? 'status-completed' : 'status-pending'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td style={{display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center'}}>
                                        {p.status === 'Pending' ? (
                                            <button onClick={() => handleCharge(p)}>Charge (Mark Paid)</button>
                                        ) : p.status === 'Paid' ? (
                                            <button onClick={() => handleRefund(p)} className="btn-secondary">Refund</button>
                                        ) : null}
                                    </td>
                                </tr>
                            );
                        })}
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

export default PaymentsManagement;