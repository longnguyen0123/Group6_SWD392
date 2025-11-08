import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from './Pagination'; // ⭐️ 1. Import

const API_URL = 'http://localhost:3001';

function UserManagement({ currentUser, setMessage }) {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All'); 

    // ⭐️ 2. State Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchUsers();
    }, []);

    // useEffect cho Filter/Search
    useEffect(() => {
        let tempUsers = [...allUsers];
        if (filterRole !== 'All') {
            tempUsers = tempUsers.filter(user => user.role === filterRole);
        }
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            tempUsers = tempUsers.filter(user => {
                return (
                    String(user.id).toLowerCase().includes(lowerSearchTerm) || 
                    user.fullName.toLowerCase().includes(lowerSearchTerm) ||
                    user.email.toLowerCase().includes(lowerSearchTerm) ||
                    user.role.toLowerCase().includes(lowerSearchTerm) ||
                    user.status.toLowerCase().includes(lowerSearchTerm)
                );
            });
        }
        setFilteredUsers(tempUsers);
        setCurrentPage(1); // ⭐️ 3. Reset trang
    }, [allUsers, searchTerm, filterRole]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/users`);
            setAllUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
        setLoading(false);
    };

    const handleToggleStatus = async (userToToggle) => {
        const newStatus = userToToggle.status === 'Active' ? 'Inactive' : 'Active';
        
        if (window.confirm(`Are you sure you want to set ${userToToggle.fullName} to ${newStatus}?`)) {
            try {
                await axios.patch(`${API_URL}/users/${userToToggle.id}`, { status: newStatus });
                setMessage({ text: `User ${userToToggle.fullName} updated to ${newStatus}.`, type: 'info' });
                fetchUsers(); // Tải lại toàn bộ danh sách
            } catch (error) {
                console.error("Error toggling user status:", error);
            }
        }
    };


    if (loading) return <p>Loading user list...</p>;

    // ⭐️ 4. Tính toán Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    return (
        <div>
            <h2>Admin: User Management</h2>

            <div className="filter-bar">
                <input 
                    type="text"
                    placeholder="Search by ID, Name, Email, Role, Status..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="All">All Roles</option>
                    <option value="Student">Student</option>
                    <option value="Admin">Admin</option>
                    <option value="Technician">Technician</option>
                </select>
            </div>

            <table border="1">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th> 
                    </tr>
                </thead>
                <tbody>
                    {/* ⭐️ 5. Map 'currentItems' */}
                    {currentItems.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.fullName}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>
                                <span className={`status-tag ${user.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                    {user.status}
                                </span>
                            </td>
                            <td>
                                <button
                                    className={user.status === 'Active' ? 'btn-warning' : 'btn-secondary'}
                                    disabled={user.id === currentUser.id}
                                    onClick={() => handleToggleStatus(user)}
                                >
                                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
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
        </div>
    );
}

export default UserManagement;