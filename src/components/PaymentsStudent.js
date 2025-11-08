import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Pagination from './Pagination'; // ⭐️ 1. Import

const API_URL = 'http://localhost:3001';

function PaymentsStudent({ currentUser, setMessage }) {
    const [payments, setPayments] = useState([]);
    const [userBalance, setUserBalance] = useState(0);
    const [loading, setLoading] = useState(true); // ⭐️ Thêm state loading

    // ⭐️ 2. State Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // (Hàm fetchPayments và fetchUserBalance giữ nguyên)
    const fetchPayments = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/payments?userId=${currentUser.id}&_sort=createdAt&_order=desc`);
            setPayments(res.data || []);
        } catch (e) { console.error(e); }
    }, [currentUser.id]);

    const fetchUserBalance = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/users/${currentUser.id}`);
            const b = Number(res.data && res.data.balance ? res.data.balance : 0);
            setUserBalance(b);
        } catch (e) { console.error(e); setUserBalance(0); }
    }, [currentUser.id]);

    // ⭐️ Cập nhật useEffect để quản lý Loading
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            await Promise.all([
                fetchPayments(),
                fetchUserBalance()
            ]);
            setLoading(false);
        };
        fetchAll();
    }, [fetchPayments, fetchUserBalance]);


    const handlePay = async (p) => {
        try {
            // refresh user balance first
            const userRes = await axios.get(`${API_URL}/users/${currentUser.id}`);
            const balance = Number(userRes.data && userRes.data.balance ? userRes.data.balance : 0);

            if (balance < Number(p.amount)) {
                setMessage({ text: `Insufficient balance. Need ${p.amount} but have ${balance}`, type: 'error' });
                return;
            }

            // mark payment paid and deduct balance
            await axios.patch(`${API_URL}/payments/${p.id}`, { status: 'Paid' });

            const newBalance = Math.round((balance - Number(p.amount)) * 100) / 100;
            await axios.patch(`${API_URL}/users/${currentUser.id}`, { balance: newBalance });

            setMessage({ text: `Payment ${p.id} paid. New balance: $${newBalance}`, type: 'success' });

            // refresh lists and balance
            await fetchPayments();
            await fetchUserBalance();
        } catch (e) { console.error(e); setMessage({ text: 'Error making payment', type: 'error' }); }
    };

    // (Code Modal xác nhận giữ nguyên)
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const openConfirm = (p) => { setSelectedPayment(p); setConfirmOpen(true); };
    const closeConfirm = () => { setSelectedPayment(null); setConfirmOpen(false); };
    const confirmAndPay = async () => {
        if (!selectedPayment) return;
        await handlePay(selectedPayment);
        closeConfirm();
    };

    if (loading) return <p>Loading payments...</p>; // ⭐️ Thêm check Loading

    // ⭐️ 3. Tính toán Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = payments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(payments.length / itemsPerPage);

    return (
        <div>
            <h2>My Payments</h2>
            <div className="filter-bar" style={{ justifyContent: 'flex-start' }}>
                 <div style={{ padding: '8px 16px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: 8 }}>
                    <h3 style={{margin: 0, padding: 0, fontSize: '1em', color: '#666'}}>My Balance</h3>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#0056b3' }}>${userBalance.toFixed(2)}</div>
                </div>
            </div>

            {payments.length === 0 ? <p>No payments.</p> : (
                <>
                <table>
                    <thead><tr><th>ID</th><th>Trip</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {/* ⭐️ 4. Map 'currentItems' */}
                        {currentItems.map(p => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.tripId}</td>
                                <td>${p.amount.toFixed(2)} {p.currency}</td>
                                <td>
                                    <span className={`status-tag ${
                                        p.status === 'Paid' ? 'status-active' :
                                        p.status === 'Refunded' ? 'status-completed' : 'status-pending'
                                    }`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td>
                                    {p.status === 'Pending' ? (
                                        <>
                                            <button onClick={() => openConfirm(p)} disabled={userBalance < Number(p.amount)}>Pay Now</button>
                                            {userBalance < Number(p.amount) && <small style={{ color: 'crimson', marginLeft: 8 }}>Insufficient funds</small>}
                                        </>
                                    ) : (
                                        <span style={{color: '#666'}}>No action required</span>
                                    )}
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

            {/* (Modal xác nhận giữ nguyên) */}
            {confirmOpen && selectedPayment && (
                <div className="modal-overlay" onClick={closeConfirm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirm Payment</h3>
                        <p>Pay <strong>${selectedPayment.amount.toFixed(2)}</strong> for trip <em>{selectedPayment.tripId}</em>?</p>
                        <p>Your current balance is ${userBalance.toFixed(2)}.</p>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={closeConfirm}>Cancel</button>
                            <button onClick={confirmAndPay}>Confirm Pay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaymentsStudent;