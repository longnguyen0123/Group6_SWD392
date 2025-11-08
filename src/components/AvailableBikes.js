import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BikeMap from './BikeMap'; 

const API_URL = 'http://localhost:3001';

function AvailableBikes({ currentUser, setMessage, setViewingImage }) {
    const [allBikes, setAllBikes] = useState([]);
    const [filteredBikes, setFilteredBikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [showMap, setShowMap] = useState(false); 

    // State cho Modal Báo cáo Sự cố
    const [issueModalOpen, setIssueModalOpen] = React.useState(false);
    const [selectedBike, setSelectedBike] = React.useState(null);
    const [issueType, setIssueType] = React.useState('Flat Tire'); 
    const [issueDesc, setIssueDesc] = React.useState(''); 

    useEffect(() => {
        fetchAvailableBikes();
    }, []);

    useEffect(() => {
        let tempBikes = [...allBikes];
        if (filterStatus !== 'All') {
            tempBikes = tempBikes.filter(bike => bike.status === filterStatus);
        }
        setFilteredBikes(tempBikes);
    }, [allBikes, filterStatus]);


    const fetchAvailableBikes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/bikes?_expand=bikeModel`);
            setAllBikes(response.data);
            setFilteredBikes(response.data); 
        } catch (error) { console.error("Error fetching available bikes:", error); }
        setLoading(false);
    };

    // Helper: Lấy nhãn Model (Basic/Plus/Pro)
    const getModelLabel = (bike) => {
        const MODEL_LABELS = {
            model_basic: 'Basic',
            model_plus: 'Plus',
            model_pro: 'Pro'
        };
        if (bike.modelId && MODEL_LABELS[bike.modelId]) return MODEL_LABELS[bike.modelId];
        const name = bike.bikeModel?.modelName || '';
        const m = name.match(/\b(Basic|Plus|Pro)\b/i);
        if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
        return bike.modelId || 'Unknown';
    };

    // Demo Khóa/Mở (UC-16) - Đã bao gồm logic tạo Payment
    const handleToggleLock = async (bike) => {
        const isInUseByMe = bike.status === "In Use" && String(bike.currentUserId) === String(currentUser.id);
        const canUnlock = bike.status === "Active";

        // 1. NẾU ĐANG LOCK XE (KẾT THÚC CHUYẾN ĐI)
        if (isInUseByMe) {
            try {
                const endTime = new Date().toISOString();
                let tripId = bike.currentTripId || null;
                if (!tripId) {
                    const tripsRes = await axios.get(`${API_URL}/trips?bikeId=${bike.id}&userId=${currentUser.id}&_sort=startTime&_order=desc`);
                    const last = (tripsRes.data || []).find(t => !t.endTime);
                    tripId = last?.id || null;
                }
                if (tripId) {
                    const tripRes = await axios.get(`${API_URL}/trips/${tripId}`);
                    const trip = tripRes.data;
                    await axios.patch(`${API_URL}/trips/${tripId}`, { endTime });
                    const start = new Date(trip.startTime).getTime();
                    const end = new Date(endTime).getTime();
                    const minutes = Math.max(1, Math.ceil((end - start) / 60000));
                    const pricePerMinute = 0.05; 
                    const amount = Math.round(minutes * pricePerMinute * 100) / 100;
                    const payId = `pay_${Date.now()}`;
                    await axios.post(`${API_URL}/payments`, { 
                        id: payId, 
                        userId: String(currentUser.id), 
                        tripId, 
                        amount, 
                        currency: 'USD', 
                        status: 'Pending', 
                        createdAt: new Date().toISOString() 
                    });
                }
                await axios.patch(`${API_URL}/bikes/${bike.id}`, { status: "Active", currentUserId: null, currentTripId: null, isAntiTheftActive: false });
                setMessage({ text: `Bike ${bike.id} locked. Payment created.`, type: 'info' });
                fetchAvailableBikes(); 
            } catch (error) { 
                console.error("Error locking bike:", error); 
                setMessage({ text: `Error locking bike ${bike.id}.`, type: 'error' }); 
            }
        
        // 2. NẾU ĐANG UNLOCK XE (BẮT ĐẦU CHUYẾN ĐI)
        } else if (canUnlock) {
            try {
                const startTime = new Date().toISOString();
                const tripId = `trip_${Date.now()}`;
                await axios.post(`${API_URL}/trips`, { id: tripId, bikeId: bike.id, userId: String(currentUser.id), startTime });
                await axios.patch(`${API_URL}/bikes/${bike.id}`, { status: "In Use", currentUserId: currentUser.id, currentTripId: tripId, isAntiTheftActive: false });
                setMessage({ text: `Bike ${bike.id} unlocked. Trip started.`, type: 'info' });
                fetchAvailableBikes(); 
            } catch (error) { 
                console.error("Error unlocking bike:", error); 
                setMessage({ text: `Error unlocking bike ${bike.id}.`, type: 'error' }); 
            }
        } else {
            setMessage({ text: `Bike ${bike.id} cannot be unlocked (status: ${bike.status}).`, type: 'error' });
        }
    };

    // UC-05: Bật/Tắt chế độ chống trộm
    const handleToggleAntiTheft = async (bike) => {
        const newState = !bike.isAntiTheftActive; 
        try {
            await axios.patch(`${API_URL}/bikes/${bike.id}`, { isAntiTheftActive: newState });
            setMessage({ 
                text: `Anti-Theft Mode for ${bike.id} is now ${newState ? 'ON' : 'OFF'}.`, 
                type: newState ? 'success' : 'info' 
            });
            fetchAvailableBikes(); 
        } catch (error) {
            console.error("Error toggling anti-theft:", error);
        }
    };

    // UC-05 (NF-5): Mô phỏng xe bị di chuyển
    const handleSimulateMovement = async (bike) => {
        if (window.confirm(`Simulate UNAUTHORIZED MOVEMENT for ${bike.id}? This will lock the bike, log an alert, AND create a maintenance task.`)) {
            try {
                const now = new Date();
                
                // 1. (NF-5) Gửi cảnh báo (Alert)
                const newAlert = {
                    id: `alert_${now.getTime()}`,
                    bikeId: bike.id,
                    alertType: "Anti-Theft",
                    timestamp: now.toISOString(),
                    description: "Unauthorized movement detected!",
                    resolved: false
                };

                // 2. Tạo Nhiệm vụ Bảo trì (Maintenance Task)
                const newMaintenanceTask = {
                    id: `maint_${now.getTime()}`,
                    bikeId: bike.id,
                    technicianId: null,
                    description: "[AUTO-LOCK] Locked by Anti-Theft system. Needs inspection.",
                    date: now.toISOString().split('T')[0],
                    status: 'Pending'
                };
                
                // 3. (NF-5) Tự động khóa bánh (Set Maintenance)
                const bikeUpdate = { 
                    status: "Maintenance", 
                    isAntiTheftActive: false 
                };

                // Chạy cả 3 request
                await Promise.all([
                    axios.post(`${API_URL}/alerts`, newAlert),
                    axios.post(`${API_URL}/maintenance`, newMaintenanceTask),
                    axios.patch(`${API_URL}/bikes/${bike.id}`, bikeUpdate)
                ]);
                
                setMessage({ 
                    text: `MOVEMENT DETECTED on ${bike.id}! Alert sent & Maintenance task created.`, 
                    type: 'error' 
                });
                
                fetchAvailableBikes(); 
            } catch (error) {
                console.error("Error simulating movement:", error);
            }
        }
    };


    // (UC-04) Báo cáo Sự cố Bảo trì
    const showIssueModal = (bike) => {
        setSelectedBike(bike);
        setIssueType('Flat Tire'); 
        setIssueDesc(''); 
        setIssueModalOpen(true);
    };
    const closeIssueModal = () => {
        setIssueModalOpen(false);
        setSelectedBike(null);
        setIssueDesc('');
    };
    const submitIssueReport = async (e) => {
        e.preventDefault();
        if (!selectedBike) return;
        
        try {
            const newMaintenanceTask = {
                id: `maint_${Date.now()}`,
                bikeId: selectedBike.id,
                technicianId: null, 
                description: `[${issueType}] ${issueDesc}`, 
                date: new Date().toISOString().split('T')[0],
                status: 'Pending'
            };
            await axios.post(`${API_URL}/maintenance`, newMaintenanceTask);
            await axios.patch(`${API_URL}/bikes/${selectedBike.id}`, { 
                status: 'Maintenance' 
            });
            setMessage({ text: `Issue reported for ${selectedBike.id}. Bike set to Maintenance.`, type: 'info' });
            closeIssueModal();
            fetchAvailableBikes(); 
        } catch (e) { 
            console.error(e); 
            setMessage({ text: 'Error submitting issue report.', type: 'error' }); 
        }
    };

    if (loading) return <p>Loading available bikes...</p>;

    return (
        <div>
            <h2>Student: Available Bikes</h2>

            <div className="filter-bar">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                </select>
                <button 
                    onClick={() => setShowMap(!showMap)} 
                    className="btn-secondary" 
                    style={{marginLeft: 'auto'}}
                >
                    {showMap ? 'Hide Map' : 'Show Map'}
                </button>
            </div>

            {showMap && (
                <div style={{marginTop: '20px'}}>
                    <BikeMap bikes={filteredBikes} />
                </div>
            )}

            <table border="1">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Bike ID</th>
                        <th>Model</th>
                        <th>Status</th>
                        <th>Battery</th>
                        <th>Pro Features</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBikes.map(bike => (
                        <tr key={bike.id}>
                            <td>
                                <img 
                                    src={`${process.env.PUBLIC_URL}/images/bike.jpg`} 
                                    alt="Smart Bike" 
                                    className="bike-thumbnail"
                                    onClick={() => setViewingImage('bike.jpg')}
                                    onError={(e) => { e.target.onerror = null; e.target.src=`${process.env.PUBLIC_URL}/images/default.png` }}
                                />
                            </td>
                            <td>{bike.id}</td>
                            <td>{getModelLabel(bike)}</td>
                            <td>{bike.status}</td>
                            <td>{bike.batteryLevel}%</td>
                            <td>
                                {bike.modelId === 'model_pro' ? 'Solar/Phone Charging OK' : 'N/A'}
                            </td>
                            <td>
                                {(() => {
                                    const isInUseByMe = bike.status === 'In Use' && String(bike.currentUserId) === String(currentUser.id);
                                    const canUnlock = bike.status === 'Active';
                                    const actionAllowed = isInUseByMe || canUnlock;
                                    const buttonLabel = isInUseByMe ? 'Lock Bike' : (canUnlock ? 'Unlock Bike' : (bike.status === 'Maintenance' ? 'Unavailable (Maintenance)' : 'Unavailable'));

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                                            <button
                                                onClick={() => handleToggleLock(bike)}
                                                disabled={!actionAllowed}
                                                className={isInUseByMe ? 'btn-secondary' : ''}
                                                title={!actionAllowed ? `Cannot unlock while status is ${bike.status}` : ''}
                                            >
                                                {buttonLabel}
                                            </button>

                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                                {bike.status === 'Active' && (
                                                    <button
                                                        className={bike.isAntiTheftActive ? 'btn-warning' : 'btn-secondary'}
                                                        onClick={() => handleToggleAntiTheft(bike)}
                                                    >
                                                        {bike.isAntiTheftActive ? 'Anti-Theft: ON' : 'Anti-Theft: OFF'}
                                                    </button>
                                                )}
                                                {bike.isAntiTheftActive && (
                                                    <button
                                                        className="btn-danger"
                                                        onClick={() => handleSimulateMovement(bike)}
                                                        title="Simulate unauthorized movement (NF-5)"
                                                    >
                                                        Simulate Movement
                                                    </button>
                                                )}
                                                
                                                {(bike.status === 'Active' || isInUseByMe) && (
                                                    <button onClick={() => showIssueModal(bike)} className="btn-warning">Report Issue</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal Báo cáo Sự cố (UC-04) */}
            {issueModalOpen && (
                <div className="modal-overlay" onClick={closeIssueModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        
                        {/* ⭐️ SỬA LỖI: Xóa (UC-04) khỏi tiêu đề */}
                        <h3>Report Maintenance Issue</h3>
                        <p>You are reporting an issue for: <strong>{selectedBike?.id}</strong></p>
                        
                        <form onSubmit={submitIssueReport} style={{ display: 'block' }}>
                            <div className="form-group">
                                <label>Issue Type</label>
                                <select 
                                    value={issueType} 
                                    // ⭐️ SỬA LỖI: Sửa e.g.value thành e.target.value
                                    onChange={(e) => setIssueType(e.target.value)}
                                    className="form-input" 
                                >
                                    <option value="Flat Tire">Flat Tire</option>
                                    <option value="Brake Malfunction">Brake Malfunction</option>
                                    <option value="Broken Lock">Broken Lock</option>
                                    <option value="Low Battery">Low Battery</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group" style={{marginTop: '15px'}}>
                                <label>Description (Optional)</label>
                                <textarea 
                                    value={issueDesc} 
                                    onChange={(e) => setIssueDesc(e.target.value)} 
                                    rows={5} 
                                    className="form-textarea"
                                    placeholder="Add more details here..."
                                />
                            </div>
                            
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeIssueModal}>Cancel</button>
                                <button type="submit">Submit Report</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AvailableBikes;