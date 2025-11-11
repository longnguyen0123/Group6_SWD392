import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from './Pagination'; // ⭐️ 1. Import
import { buildModelFeatureIndex, getModelBadges } from '../utils/features';
import { fetchBikes as apiFetchBikes, fetchBikeModels, addBike, updateBike, patchBike as patchBikeSvc, deleteBike as deleteBikeSvc } from '../services/bikes';

const API_URL = 'http://localhost:3001';

// Component Modal (EditBikeModal)
function EditBikeModal({ bike, onClose, onSave }) {
    const [formData, setFormData] = useState(bike);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Edit Smart Bike</h3>
                <form onSubmit={handleSubmit} className="modal-grid-form">
                    <div className="form-group"><label>Bike ID</label><input type="text" name="id" value={formData.id} disabled /></div>
                    <div className="form-group"><label>Model</label><select name="modelId" value={formData.modelId} onChange={handleChange}><option value="model_basic">Basic</option><option value="model_plus">Plus</option><option value="model_pro">Pro</option></select></div>
                    <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option value="Active">Active</option><option value="In Use">In Use</option><option value="Maintenance">Maintenance</option></select></div>
                    <div className="form-group"><label>Battery Level (%)</label><input type="number" name="batteryLevel" value={formData.batteryLevel} disabled /></div>
                    <div className="modal-actions" style={{ gridColumn: '1 / -1' }}><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit">Save Changes</button></div>
                </form>
            </div>
        </div>
    );
}


// Component chính
function BikeManagement({ setMessage, setViewingImage }) {
    const [allBikes, setAllBikes] = useState([]); 
    const [filteredBikes, setFilteredBikes] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [newBikeId, setNewBikeId] = useState('');
    const [newBikeModel, setNewBikeModel] = useState('model_basic');
    const [isEditing, setIsEditing] = useState(false);
    const [currentBike, setCurrentBike] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [filterStatus, setFilterStatus] = useState('All'); 
	const [modelIndex, setModelIndex] = useState({});

    // ⭐️ 2. State cho Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // 5 xe mỗi trang

    useEffect(() => {
        fetchBikes();
    }, []);

    // useEffect cho Filter/Search
    useEffect(() => {
        let tempBikes = [...allBikes];
        if (filterStatus !== 'All') {
            tempBikes = tempBikes.filter(bike => bike.status === filterStatus);
        }
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            tempBikes = tempBikes.filter(bike => {
                return (
                    bike.id.toLowerCase().includes(lowerSearchTerm) ||
                    bike.modelId.toLowerCase().includes(lowerSearchTerm) ||
                    bike.status.toLowerCase().includes(lowerSearchTerm) ||
                    String(bike.batteryLevel).toLowerCase().includes(lowerSearchTerm) || 
                    bike.lastLocation.toLowerCase().includes(lowerSearchTerm)
                );
            });
        }
        setFilteredBikes(tempBikes);
        setCurrentPage(1); // ⭐️ 3. Reset về trang 1 khi filter
    }, [allBikes, searchTerm, filterStatus]);

	const fetchBikes = async () => {
        setLoading(true);
        try {
			const [bikesData, modelsData] = await Promise.all([
				apiFetchBikes(),
				fetchBikeModels()
			]);
			setAllBikes(bikesData); 
			setModelIndex(buildModelFeatureIndex(modelsData));
        } catch (error) { 
            console.error("Error fetching bikes:", error); 
        }
        setLoading(false); 
    };

    const handleDeleteBike = async (bikeId) => {
        const bike = allBikes.find(b => b.id === bikeId);
        if (bike && bike.status === 'In Use') {
            setMessage({ text: "Cannot delete a bike that is currently In Use.", type: 'error' });
            return;
        }
        if (window.confirm(`Are you sure you want to delete ${bikeId}?`)) {
			try {
				await deleteBikeSvc(bikeId);
                setMessage({ text: `Bike ${bikeId} deleted successfully.`, type: 'info' });
                fetchBikes(); 
            } catch (error) { console.error("Error deleting bike:", error); }
        }
    };
    
    const handleAddBike = async (e) => {
        e.preventDefault();
		// Prevent duplicate Bike ID
		if (allBikes.some(b => String(b.id).toLowerCase() === String(newBikeId).toLowerCase())) {
			setMessage({ text: `Bike ID ${newBikeId} already exists.`, type: 'error' });
			return;
		}
        const bikeData = { id: newBikeId, modelId: newBikeModel, status: "Active", batteryLevel: 100, lastLocation: "FPT University Campus", isAntiTheftActive: false };
        try {
			await addBike(bikeData);
            setMessage({ text: 'New bike added successfully!', type: 'success' });
            fetchBikes(); 
            setNewBikeId(''); 
            setNewBikeModel('model_basic');
        } catch (error) { console.error("Error adding bike:", error); }
    };
    
    const handleOpenEditModal = (bike) => {
        setCurrentBike(bike);
        setIsEditing(true);
    };
    
    const handleSaveEdit = async (bikeData) => {
        try {
			await updateBike(bikeData.id, bikeData);
            setMessage({ text: `Bike ${bikeData.id} updated!`, type: 'success' });
            setIsEditing(false);
            setCurrentBike(null);
            fetchBikes(); 
        } catch (error) { console.error("Error updating bike:", error); }
    };

    const handleRemoteLock = async (bike) => {
        if (window.confirm(`Remote lock bike ${bike.id}? This will set status to Maintenance.`)) {
			try {
				await patchBikeSvc(bike.id, { status: 'Maintenance' });
                setMessage({ text: `Bike ${bike.id} remote-locked.`, type: 'info' });
                fetchBikes();
            } catch (e) { console.error(e); setMessage({ text: 'Error performing remote lock', type: 'error' }); }
        }
    };

    const handleSetToActive = async (bike) => {
        if (window.confirm(`Set bike ${bike.id} to 'Active'? This will also set battery to 100%.`)) {
			try {
				await patchBikeSvc(bike.id, { 
                    status: 'Active',
                    batteryLevel: 100 
                });
                setMessage({ text: `Bike ${bike.id} is now Active (100% Battery).`, type: 'success' });
                fetchBikes();
            } catch (e) {
                console.error(e);
                setMessage({ text: 'Error setting bike to active', type: 'error' });
            }
        }
    };


    if (loading) return <p>Loading bike list...</p>;

    // ⭐️ 4. Tính toán các item cho trang hiện tại
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBikes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBikes.length / itemsPerPage);

    return (
        <div>
            <h2>Admin: Bike Management</h2>
            
            <form onSubmit={handleAddBike} style={{ marginBottom: '20px' }}>
                <h3>Add New Bike</h3>
                <input 
                    type="text"
                    placeholder="Bike ID (e.g., SBE-006)"
                    value={newBikeId}
                    onChange={(e) => setNewBikeId(e.target.value)}
                    required 
                />
                <select value={newBikeModel} onChange={(e) => setNewBikeModel(e.target.value)}>
                    <option value="model_basic">Basic</option>
                    <option value="model_plus">Plus</option>
                    <option value="model_pro">Pro</option>
                </select>
                <button type="submit">Add Bike</button>
            </form>

            <div className="filter-bar">
                <input 
                    type="text"
                    placeholder="Search by ID, Model, Status, Location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                </select>
            </div>

            <table border="1">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Bike ID</th>
                        <th>Model ID</th>
						<th>Features</th>
                        <th>Status</th>
                        <th>Battery</th>
                        <th>Location</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* ⭐️ 5. Map qua 'currentItems' thay vì 'filteredBikes' */}
                    {currentItems.map(bike => (
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
                            <td>{bike.modelId}</td>
							<td>
								{getModelBadges(modelIndex, bike.modelId).map(b => (
									<span key={b} className="tag" style={{ marginRight: 4 }}>{b}</span>
								))}
							</td>
                            <td>{bike.status}</td>
                            <td>{bike.batteryLevel}%</td>
                            <td>{bike.lastLocation}</td>
                            <td style={{display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center'}}>
                                <button className="btn-secondary" onClick={() => handleOpenEditModal(bike)}>
                                    Edit
                                </button>
                                {bike.status === 'Maintenance' ? (
                                    <button className="btn-success" onClick={() => handleSetToActive(bike)}>
                                        Set Active
                                    </button>
                                ) : (
                                    <button onClick={() => handleRemoteLock(bike)} disabled={bike.status === 'In Use'}>
                                        Remote Lock
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleDeleteBike(bike.id)}
                                    disabled={bike.status === 'In Use'}
                                    title={bike.status === 'In Use' ? "Cannot delete a bike that is In Use" : "Delete Bike"}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* ⭐️ 6. Thêm component Pagination */}
            <Pagination 
                totalPages={totalPages} 
                currentPage={currentPage} 
                paginate={setCurrentPage} 
            />

            {isEditing && (
                <EditBikeModal 
                    bike={currentBike}
                    onClose={() => setIsEditing(false)}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    );
}

export default BikeManagement;