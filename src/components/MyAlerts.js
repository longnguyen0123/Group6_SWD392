import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from './Pagination'; // ⭐️ 1. Import

const API_URL = 'http://localhost:3001';

function MyAlerts({ currentUser, setMessage }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    // ⭐️ 2. State Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/alerts`);
            setAlerts(response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))); // Sắp xếp mới nhất
        } catch (error) {
            console.error("Error fetching alerts:", error);
        }
        setLoading(false);
    };
    
    useEffect(() => {
        if(currentUser) {
            fetchAlerts();
        }
    }, [currentUser]);

    const handleResolveAlert = async (alert) => {
        if (window.confirm(`Are you sure you want to resolve alert ${alert.id}? This will unlock the associated bike if it was locked by an alert.`)) {
            try {
                await Promise.all([
                    axios.patch(`${API_URL}/alerts/${alert.id}`, { resolved: true }),
                    axios.patch(`${API_URL}/bikes/${alert.bikeId}`, { status: "Active" })
                ]);
                setMessage({ text: `Alert ${alert.id} resolved. Bike ${alert.bikeId} is now Active.`, type: 'info' });
                fetchAlerts(); // Tải lại danh sách
            } catch (error) {
                console.error("Error resolving alert:", error);
                setMessage({ text: `Failed to resolve alert.`, type: 'error' });
            }
        }
    };

    if (loading) return <p>Loading alerts...</p>;

    // ⭐️ 3. Tính toán Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = alerts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(alerts.length / itemsPerPage);

    return (
        <div>
            <h2>Student: My Alerts</h2>
            {alerts.length === 0 ? (
                <p>No alerts found.</p>
            ) : (
                <>
                <table border="1">
                    <thead>
                        <tr>
                            <th>Alert ID</th>
                            <th>Bike ID</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Actions</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {/* ⭐️ 4. Map 'currentItems' */}
                        {currentItems.map(alert => (
                            <tr key={alert.id}>
                                <td>{alert.id}</td>
                                <td>{alert.bikeId}</td>
                                <td>{alert.alertType}</td>
                                <td>{alert.description}</td>
                                <td>{new Date(alert.timestamp).toLocaleString()}</td>
                                <td>
                                    <span className={`status-tag ${alert.resolved ? 'status-completed' : 'status-inactive'}`}>
                                        {alert.resolved ? 'Resolved' : 'Active'}
                                    </span>
                                </td>
                                <td>
                                    {!alert.resolved && (
                                        <button 
                                            className="btn-success"
                                            onClick={() => handleResolveAlert(alert)}
                                        >
                                            Resolve
                                        </button>
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
        </div>
    );
}

export default MyAlerts;