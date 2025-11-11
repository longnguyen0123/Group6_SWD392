import React, { useState, useEffect } from 'react';
import Pagination from './Pagination'; // ⭐️ 1. Import
import { fetchUsers as svcFetchUsers, createUser as svcCreateUser, updateUser as svcUpdateUser, patchUser as svcPatchUser } from '../services/users';
import { fetchBikes as svcFetchBikes, patchBike as svcPatchBike } from '../services/bikes';
import { writeAuditLog } from '../services/audits';

function UserFormModal({ initial, onClose, onSave, allUsers }) {
	const isCreating = !initial;
	const [formData, setFormData] = useState(initial || { id: '', fullName: '', email: '', role: 'Student', status: 'Active' });
	const [errors, setErrors] = useState({});

	const validate = () => {
		const e = {};
		if (!formData.id || String(formData.id).trim() === '') e.id = 'Student ID is required';
		if (!formData.fullName || formData.fullName.trim() === '') e.fullName = 'Full name is required';
		if (!formData.email || formData.email.trim() === '') e.email = 'Email is required';
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (formData.email && !emailRegex.test(formData.email)) e.email = 'Invalid email format';

		// unique id/email
		if (isCreating) {
			if (allUsers.some(u => String(u.id) === String(formData.id))) e.id = 'Duplicate Student ID';
			if (allUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) e.email = 'Email already in use';
		} else {
			if (allUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase() && String(u.id) !== String(initial.id))) {
				e.email = 'Email already in use';
			}
		}
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const onChange = (e) => {
		const { name, value } = e.target;
		if (name === 'role' && isCreating) return;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const submit = (e) => {
		e.preventDefault();
		if (!validate()) return;
		onSave(formData);
	};

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h3>{initial ? 'Edit User' : 'Create User'}</h3>
				<form onSubmit={submit} className="modal-grid-form">
					<div className="form-group">
						<label>Student ID</label>
						<input name="id" value={formData.id} onChange={onChange} disabled={!!initial} />
						{errors.id && <small className="error">{errors.id}</small>}
					</div>
					<div className="form-group">
						<label>Full Name</label>
						<input name="fullName" value={formData.fullName} onChange={onChange} />
						{errors.fullName && <small className="error">{errors.fullName}</small>}
					</div>
					<div className="form-group">
						<label>Email</label>
						<input name="email" value={formData.email} onChange={onChange} />
						{errors.email && <small className="error">{errors.email}</small>}
					</div>
					<div className="form-group">
						<label>Role</label>
						{isCreating ? (
							<input value="Student" readOnly disabled />
						) : (
							<input value={formData.role} readOnly disabled />
						)}
					</div>
					<div className="form-group">
						<label>Status</label>
						<select name="status" value={formData.status} onChange={onChange}>
							<option value="Active">Active</option>
							<option value="Inactive">Inactive</option>
						</select>
					</div>
					<div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
						<button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
						<button type="submit">{initial ? 'Save Changes' : 'Create'}</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function UserManagement({ currentUser, setMessage }) {
	const [allUsers, setAllUsers] = useState([]);
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterRole, setFilterRole] = useState('All'); 

	// bikes for linking
	const [allBikes, setAllBikes] = useState([]);

	// form modal
	const [showForm, setShowForm] = useState(false);
	const [editingUser, setEditingUser] = useState(null);

	// ⭐️ 2. State Phân trang
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	useEffect(() => {
		fetchUsers();
		fetchBikes();
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
					user.status.toLowerCase().includes(lowerSearchTerm) ||
					(user.assignedBikeId ? user.assignedBikeId.toLowerCase().includes(lowerSearchTerm) : false)
				);
			});
		}
		setFilteredUsers(tempUsers);
		setCurrentPage(1); // ⭐️ 3. Reset trang
	}, [allUsers, searchTerm, filterRole]);

	const fetchUsers = async () => {
		setLoading(true);
		try {
			const data = await svcFetchUsers();
			setAllUsers(data);
		} catch (error) {
			console.error("Error fetching users:", error);
		}
		setLoading(false);
	};

	const fetchBikes = async () => {
		try {
			const data = await svcFetchBikes();
			setAllBikes(data);
		} catch (error) {
			console.error("Error fetching bikes:", error);
		}
	};

	const logAudit = async (action, payload) => {
		try {
			await writeAuditLog({
				id: `audit_${Date.now()}`,
				action,
				adminId: currentUser?.id,
				timestamp: new Date().toISOString(),
				...payload
			});
		} catch (e) {
			console.error('Failed to write audit log', e);
		}
	};

	const handleToggleStatus = async (userToToggle) => {
		const newStatus = userToToggle.status === 'Active' ? 'Inactive' : 'Active';
		
		if (window.confirm(`Are you sure you want to set ${userToToggle.fullName} to ${newStatus}?`)) {
			try {
				await svcPatchUser(userToToggle.id, { status: newStatus });
				setMessage({ text: `User ${userToToggle.fullName} updated to ${newStatus}.`, type: 'info' });
				await logAudit('user.status_toggle', { userId: userToToggle.id, to: newStatus });
				fetchUsers(); // Tải lại toàn bộ danh sách
			} catch (error) {
				console.error("Error toggling user status:", error);
			}
		}
	};

	const handleCreateUser = () => {
		setEditingUser(null);
		setShowForm(true);
	};

	const handleEditUser = (user) => {
		setEditingUser(user);
		setShowForm(true);
	};

	const saveUser = async (data) => {
		try {
			if (!editingUser) {
				await svcCreateUser(data);
				setMessage({ text: 'User created successfully.', type: 'success' });
				await logAudit('user.create', { userId: data.id });
			} else {
				await svcUpdateUser(editingUser.id, { ...editingUser, ...data });
				setMessage({ text: 'User updated successfully.', type: 'success' });
				await logAudit('user.update', { userId: editingUser.id });
			}
			setShowForm(false);
			setEditingUser(null);
			fetchUsers();
		} catch (e) {
			console.error(e);
			setMessage({ text: 'Unable to save data.', type: 'error' });
		}
	};

	// Bike linking helpers
	const getAssignedBikeId = (user) => {
		// derive from user's assignedBikeId if present, otherwise from bikes' currentUserId
		if (user.assignedBikeId) return user.assignedBikeId;
		const b = allBikes.find(b => String(b.currentUserId) === String(user.id));
		return b ? b.id : null;
	};

	const availableBikes = (currentAssignedId) => {
		// bikes not assigned to anyone or the currently assigned bike (to keep it in the list)
		return allBikes.filter(b => (b.currentUserId == null || b.id === currentAssignedId) && b.status !== 'Maintenance');
	};

	const linkBike = async (user, newBikeId) => {
		const currentAssigned = getAssignedBikeId(user);
		if (newBikeId === currentAssigned) return;

		// if target bike already assigned to someone else
		const targetBike = allBikes.find(b => b.id === newBikeId);
		if (targetBike && targetBike.currentUserId && String(targetBike.currentUserId) !== String(user.id)) {
			const ok = window.confirm(`Bike ${newBikeId} is already assigned to another student. Reassign to ${user.fullName}?`);
			if (!ok) return;
		}

		try {
			// unlink old bike
			if (currentAssigned) {
				await svcPatchBike(currentAssigned, { currentUserId: null, status: 'Active' });
			}
			// link new bike
			await svcPatchBike(newBikeId, { currentUserId: null, status: 'Active', currentTripId: null });
			// store on user as assignedBikeId for quick listing
			await svcPatchUser(user.id, { assignedBikeId: newBikeId });

			setMessage({ text: `Linked bike ${newBikeId} to ${user.fullName}.`, type: 'success' });
			await logAudit('user.link_bike', { userId: user.id, bikeId: newBikeId, previousBikeId: currentAssigned });
			fetchBikes();
			fetchUsers();
		} catch (e) {
			console.error(e);
			setMessage({ text: 'Unable to save data.', type: 'error' });
			await logAudit('user.link_bike_failed', { userId: user.id, bikeId: newBikeId });
		}
	};

	const unlinkBike = async (user) => {
		const currentAssigned = getAssignedBikeId(user);
		if (!currentAssigned) return;
		if (!window.confirm(`Unlink bike ${currentAssigned} from ${user.fullName}?`)) return;
		try {
			await svcPatchBike(currentAssigned, { currentUserId: null, status: 'Active' });
			await svcPatchUser(user.id, { assignedBikeId: null });
			setMessage({ text: `Unlinked bike ${currentAssigned} from ${user.fullName}.`, type: 'info' });
			await logAudit('user.unlink_bike', { userId: user.id, bikeId: currentAssigned });
			fetchBikes();
			fetchUsers();
		} catch (e) {
			console.error(e);
			setMessage({ text: 'Unable to save data.', type: 'error' });
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
					placeholder="Search by ID, Name, Email, Role, Status, Bike..." 
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
					<option value="All">All Roles</option>
					<option value="Student">Student</option>
					<option value="Admin">Admin</option>
					<option value="Technician">Technician</option>
				</select>
				<button onClick={handleCreateUser} style={{ marginLeft: 8 }}>+ Create User</button>
			</div>

			<table border="1">
				<thead>
					<tr>
						<th>User ID</th>
						<th>Full Name</th>
						<th>Email</th>
						<th>Role</th>
						<th>Status</th>
						<th>Bike</th>
						<th>Actions</th> 
					</tr>
				</thead>
				<tbody>
					{/* ⭐️ 5. Map 'currentItems' */}
					{currentItems.map(user => {
						const assignedId = getAssignedBikeId(user);
						const bikes = availableBikes(assignedId);
						return (
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
									<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
										<select value={assignedId || ''} onChange={(e) => linkBike(user, e.target.value)}>
											<option value="" disabled>{assignedId ? '(change)' : 'Select bike'}</option>
											{assignedId && <option value={assignedId}>{assignedId}</option>}
											{bikes.filter(b => b.id !== assignedId).map(b => (
												<option key={b.id} value={b.id}>{b.id} ({b.status})</option>
											))}
										</select>
										{assignedId && (
											<button className="btn-secondary" onClick={() => unlinkBike(user)}>Unlink</button>
										)}
									</div>
								</td>
								<td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
									<button className="btn-secondary" onClick={() => handleEditUser(user)}>Edit</button>
									<button
										className={user.status === 'Active' ? 'btn-warning' : 'btn-secondary'}
										disabled={String(user.id) === String(currentUser.id)}
										onClick={() => handleToggleStatus(user)}
									>
										{user.status === 'Active' ? 'Deactivate' : 'Activate'}
									</button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			
			{/* ⭐️ 6. Thêm Pagination */}
			<Pagination 
				totalPages={totalPages} 
				currentPage={currentPage} 
				paginate={setCurrentPage} 
			/>

			{showForm && (
				<UserFormModal
					initial={editingUser}
					onClose={() => { setShowForm(false); setEditingUser(null); }}
					onSave={saveUser}
					allUsers={allUsers}
				/>
			)}
		</div>
	);
}

export default UserManagement;