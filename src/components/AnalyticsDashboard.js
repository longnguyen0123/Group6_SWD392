import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

// ⭐️ (ĐÃ CẬP NHẬT)
function AnalyticsDashboard() {
    // Cập nhật state (thay avgBattery bằng totalRevenue)
    const [stats, setStats] = useState({ trips: 0, totalDistance: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { 
        fetchStats(); 
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Lấy song song 2 request: trips và payments
            const [tripsRes, paymentsRes] = await Promise.all([
                axios.get(`${API_URL}/trips`),
                axios.get(`${API_URL}/payments`)
            ]);
            
            const trips = tripsRes.data || [];
            const payments = paymentsRes.data || [];

            // 1. Tính Tổng Chuyến đi (Giữ nguyên)
            const totalTrips = trips.length;

            // 2. Tính Tổng Quãng đường (Giữ nguyên)
            const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);

            // 3. ⭐️ (MỚI) Tính Tổng Doanh thu
            // Chỉ tính các thanh toán đã 'Paid' (Thành công)
            const totalRevenue = payments
                .filter(p => p.status === 'Paid')
                .reduce((sum, payment) => sum + (payment.amount || 0), 0);

            // Cập nhật state mới
            setStats({ 
                trips: totalTrips, 
                totalDistance: totalDistance.toFixed(1), // Làm tròn 1 chữ số
                totalRevenue: totalRevenue.toFixed(2) // Làm tròn 2 chữ số
            });

        } catch (e) { 
            console.error(e); 
        }
        setLoading(false);
    };

    if (loading) return <p>Loading analytics...</p>;

    return (
        <div>
            <h2>Analytics Dashboard (Summary)</h2>
            <div style={{ display: 'flex', gap: 20 }}>
                {/* Card 1: Trips */}
                <div style={{ padding: 16, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: 8 }}>
                    <h3>Trips</h3>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.trips}</div>
                </div>
                
                {/* Card 2: Distance */}
                <div style={{ padding: 16, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: 8 }}>
                    <h3>Total Distance (km)</h3>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.totalDistance}</div>
                </div>
                
                {/* ⭐️ Card 3: (CẬP NHẬT) Total Revenue */}
                <div style={{ padding: 16, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: 8 }}>
                    <h3>Total Revenue (USD)</h3>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>${stats.totalRevenue}</div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;