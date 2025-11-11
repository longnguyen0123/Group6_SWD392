import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BikeMap from './BikeMap'; 
import { buildModelFeatureIndex, hasFeatureEnabled, getModelBadges } from '../utils/features';
import { fetchBikes, fetchBikeModels, patchBike } from '../services/bikes';
import { createTrip, patchTrip, fetchTripById } from '../services/trips';
import { fetchUserById } from '../services/users';

const API_URL = 'http://localhost:3001';

function AvailableBikes({ currentUser, setMessage, setViewingImage }) {
	const [linkedBikes, setLinkedBikes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showMap, setShowMap] = useState(false); 
	const [modelIndex, setModelIndex] = useState({});
	const [linkedBikeId, setLinkedBikeId] = useState(currentUser?.assignedBikeId || null);

	// State cho Modal Báo cáo Sự cố
	const [issueModalOpen, setIssueModalOpen] = React.useState(false);
	const [selectedBike, setSelectedBike] = React.useState(null);
	const [issueType, setIssueType] = React.useState('Flat Tire'); 
	const [issueDesc, setIssueDesc] = React.useState(''); 

const fetchAvailableBikes = useCallback(async () => {
		setLoading(true);
		try {
			const [bikesData, modelsData, userData] = await Promise.all([
				fetchBikes(),
				fetchBikeModels(),
				currentUser?.id ? fetchUserById(currentUser.id) : Promise.resolve(null)
			]);
			const idx = buildModelFeatureIndex(modelsData);
			setModelIndex(idx);

			if (currentUser?.role === 'Student') {
				const linkedId = (userData?.assignedBikeId || currentUser.assignedBikeId || null);
				setLinkedBikeId(linkedId || null);
				const studentList = linkedId ? bikesData.filter(b => b.id === linkedId) : [];
				setLinkedBikes(studentList);
			} else {
				// Admin / Technician see all bikes
				setLinkedBikeId(null);
				setLinkedBikes(bikesData);
			}
		} catch (error) { console.error("Error fetching available bikes:", error); }
		setLoading(false);
}, [currentUser]);

useEffect(() => {
	fetchAvailableBikes();
}, [fetchAvailableBikes]);

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
                    const trip = await fetchTripById(tripId);
                    await patchTrip(tripId, { endTime });
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
                await patchBike(bike.id, { status: "Active", currentUserId: null, currentTripId: null, isAntiTheftActive: false });
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
                await createTrip({ id: tripId, bikeId: bike.id, userId: String(currentUser.id), startTime });
                await patchBike(bike.id, { status: "In Use", currentUserId: currentUser.id, currentTripId: tripId, isAntiTheftActive: false });
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

	const bikesForDisplay = linkedBikes;

	return (
		<div>
			<h2>Student: Available Bikes</h2>

			{currentUser?.role === 'Student' && (!linkedBikeId || bikesForDisplay.length === 0) && (
				<p>No bike assigned to your account yet. Please contact the administrator to link a smart bike.</p>
			)}

			<div className="filter-bar" style={{ justifyContent: 'flex-end' }}>
				<button 
					onClick={() => setShowMap(!showMap)} 
					className="btn-secondary"
				>
					{showMap ? 'Hide Map' : 'Show Map'}
				</button>
			</div>

			{showMap && (
				<div style={{marginTop: '20px'}}>
					<BikeMap bikes={bikesForDisplay} />
				</div>
			)}

            <table border="1">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Bike ID</th>
                        <th>Model</th>
						<th>Features</th>
                        <th>Status</th>
                        <th>Battery</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {bikesForDisplay.map(bike => (
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
							<td>
								{getModelBadges(modelIndex, bike.modelId).map(b => (
									<span key={b} className="tag" style={{ marginRight: 4 }}>{b}</span>
								))}
							</td>
                            <td>{bike.status}</td>
                            <td>{bike.batteryLevel}%</td>
                            <td>
                                {(() => {
                                    const isInUseByMe = bike.status === 'In Use' && String(bike.currentUserId) === String(currentUser.id);
                                    const isLinkedToMe = String(linkedBikeId || currentUser.assignedBikeId || '') === String(bike.id);
                                    const canUnlock = bike.status === 'Active' && isLinkedToMe;
                                    const actionAllowed = isInUseByMe || canUnlock;
                                    const buttonLabel = isInUseByMe ? 'Lock Bike' : (canUnlock ? 'Unlock Bike' : (bike.status === 'Maintenance' ? 'Unavailable (Maintenance)' : 'Unavailable'));

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                                            <button
                                                onClick={() => handleToggleLock(bike)}
                                                disabled={!actionAllowed}
                                                className={isInUseByMe ? 'btn-secondary' : ''}
                                                title={!actionAllowed ? (bike.status === 'Active' && !isLinkedToMe ? 'This bike is not linked to your account.' : `Cannot unlock while status is ${bike.status}`) : ''}
                                            >
                                                {buttonLabel}
                                            </button>

                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
												{bike.status === 'Active' && hasFeatureEnabled(modelIndex, bike.modelId, 'hasAntiTheft') && (
                                                    <button
                                                        className={bike.isAntiTheftActive ? 'btn-warning' : 'btn-secondary'}
                                                        onClick={() => handleToggleAntiTheft(bike)}
                                                    >
                                                        {bike.isAntiTheftActive ? 'Anti-Theft: ON' : 'Anti-Theft: OFF'}
                                                    </button>
                                                )}
												{bike.isAntiTheftActive && hasFeatureEnabled(modelIndex, bike.modelId, 'hasAntiTheft') && (
                                                    <button
                                                        className="btn-danger"
                                                        onClick={() => handleSimulateMovement(bike)}
                                                        title="Simulate unauthorized movement (NF-5)"
                                                    >
                                                        Simulate Movement
                                                    </button>
                                                )}
                                                
                                                {(isInUseByMe || (bike.status === 'Active' && isLinkedToMe)) && (
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