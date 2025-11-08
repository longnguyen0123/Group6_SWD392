import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Pagination from './Pagination'; // ⭐️ 1. Import

const API_URL = 'http://localhost:3001';

// Component Modal (MaintenanceModal)
function MaintenanceModal({ task, onClose, onSave, technicians, currentUser }) {
    const [formData, setFormData] = useState(task || {
        bikeId: '',
        description: '',
        status: 'Pending',
        technicianId: null,
        date: new Date().toISOString().split('T')[0] 
    });
    const isNew = !task; 
    
    const isAdmin = currentUser.role === 'Admin';
    const isTechnician = currentUser.role === 'Technician';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newFormData = { ...prev, [name]: value };
            if (isAdmin && name === 'technicianId' && value && newFormData.status === 'Pending') {
                newFormData.status = 'In Progress';
            }
            return newFormData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{isNew ? 'New Maintenance Task' : 'Edit Maintenance Task'}</h3>
                
                <form onSubmit={handleSubmit} style={{ display: 'block' }}>
                    <div className="form-group">
                        <label>Bike ID</label>
                        <input type="text" name="bikeId" value={formData.bikeId} onChange={handleChange} placeholder="e.g., SBE-001" required className="form-input" disabled={!isNew} />
                    </div>
                    <div className="form-group" style={{marginTop: '15px'}}>
                        <label>Description</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Describe the issue..." required className="form-input" disabled={!isAdmin} />
                    </div>
                    <div className="form-group" style={{marginTop: '15px'}}>
                        <label>Assign to Technician (Admin only)</label>
                        <select name="technicianId" value={formData.technicianId || ''} onChange={handleChange} className="form-input" disabled={!isAdmin} title={!isAdmin ? "Only Admins can assign tasks" : ""}>
                            <option value="">(Unassigned)</option>
                            {technicians.map(tech => (
                                <option key={tech.id} value={tech.id}>{tech.fullName}</option>
                            ))}
                        </select>
                    </div>
                     <div className="form-group" style={{marginTop: '15px'}}>
                        <label>Status (Technician only)</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="form-input" disabled={!isTechnician} title={!isTechnician ? "Only Technicians can change status" : ""}>
                            <option value="Pending" disabled={isTechnician}>Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    
                    <div className="modal-actions"> 
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit">Save Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Component chính
function MaintenanceManagement({ currentUser, setMessage }) {
    const [allTasks, setAllTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // ⭐️ 2. State Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // (Hàm fetchData giữ nguyên)
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tasksRes, techsRes] = await Promise.all([
                axios.get(`${API_URL}/maintenance`), 
                axios.get(`${API_URL}/users?role=Technician`)
            ]);
            const tasks = tasksRes.data || [];
            const techs = techsRes.data || [];
            const techMap = new Map();
            techs.forEach(tech => {
                techMap.set(String(tech.id), tech.fullName); 
            });
            const tasksWithTech = tasks.map(task => ({
                ...task,
                technicianName: task.technicianId ? techMap.get(String(task.technicianId)) : '(Unassigned)'
            }));
            setAllTasks(tasksWithTech);
            setTechnicians(techs); 
        } catch (error) { 
            console.error("Error fetching data:", error); 
        }
        setLoading(false);
    }, []); 

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // useEffect cho Filter/Search
    useEffect(() => {
        let tempTasks = [...allTasks];
        if (filterStatus !== 'All') {
            tempTasks = tempTasks.filter(task => task.status === filterStatus);
        }
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            tempTasks = tempTasks.filter(task => 
                (task.bikeId && task.bikeId.toLowerCase().includes(lowerSearch)) ||
                (task.description && task.description.toLowerCase().includes(lowerSearch))
            );
        }
        setFilteredTasks(tempTasks);
        setCurrentPage(1); // ⭐️ 3. Reset trang
    }, [allTasks, searchTerm, filterStatus]);

    // (Hàm handleSave và handleOpenModal giữ nguyên)
    const handleSave = async (taskData) => {
        const dataToSave = { ...taskData, technicianId: taskData.technicianId ? parseInt(taskData.technicianId, 10) : null };
        try {
            if (!dataToSave.id) {
                dataToSave.id = `maint_${Date.now()}`;
                await axios.post(`${API_URL}/maintenance`, dataToSave);
                setMessage({ text: 'New maintenance task created!', type: 'success' });
            } else { 
                delete dataToSave.technicianName; 
                await axios.put(`${API_URL}/maintenance/${dataToSave.id}`, dataToSave);
                setMessage({ text: `Task ${dataToSave.id} updated!`, type: 'success' });
                if (dataToSave.status === 'Completed') {
                    await axios.patch(`${API_URL}/bikes/${dataToSave.bikeId}`, {
                        status: 'Active',
                        batteryLevel: 100
                    });
                    setMessage({ text: `Task ${dataToSave.id} completed. Bike ${dataToSave.bikeId} is now Active (100% Battery).`, type: 'success' });
                }
            }
        } catch (error) {
            console.error("Error saving task:", error);
            setMessage({ text: 'Failed to save task.', type: 'error' });
        }
        setIsModalOpen(false);
        setCurrentTask(null);
        fetchData(); // Tải lại dữ liệu
    };
    const handleOpenModal = (task = null) => {
        setCurrentTask(task);
        setIsModalOpen(true);
    };

    if (loading) return <p>Loading maintenance tasks...</p>;

    // ⭐️ 4. Tính toán Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

    return (
        <div>
            <h2>Maintenance Management</h2>
            
            <div className="filter-bar">
                <input type="text" placeholder="Search by Bike ID or Description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                </select>
                {currentUser.role === 'Admin' && (
                    <button onClick={() => handleOpenModal()} style={{marginLeft: 'auto'}}>
                        Add New Task
                    </button>
                )}
            </div>

            <table border="1">
                <thead>
                    <tr>
                        <th>Bike ID</th>
                        <th>Description</th>
                        <th>Date Reported</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* ⭐️ 5. Map 'currentItems' */}
                    {currentItems.map(task => (
                        <tr key={task.id}>
                            <td>{task.bikeId}</td>
                            <td>{task.description}</td>
                            <td>{task.date}</td>
                            <td>{task.technicianName}</td>
                            <td>
                                <span className={`status-tag ${
                                    task.status === 'Completed' ? 'status-completed' :
                                    task.status === 'In Progress' ? 'status-in-progress' : 'status-pending'
                                }`}>
                                    {task.status}
                                </span>
                            </td>
                            <td>
                                <button className="btn-secondary" onClick={() => handleOpenModal(task)}>
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* ⭐️ 6. Thêm Pagination */}
            <Pagination 
                totalPages={totalPages} 
                currentPage={currentPage} 
                paginate={setCurrentPage} 
            />

            {isModalOpen && (
                <MaintenanceModal 
                    task={currentTask}
                    technicians={technicians}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    currentUser={currentUser} 
                />
            )}
        </div>
    );
}

export default MaintenanceManagement;