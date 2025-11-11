import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from './Pagination';
import { fetchUserById } from '../services/users';

const API_URL = 'http://localhost:3001';

function MyAlerts({ currentUser, setMessage }) {
	const [alerts, setAlerts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [linkedBikeId, setLinkedBikeId] = useState(currentUser?.assignedBikeId || null);

	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	useEffect(() => {
		if (currentUser) {
			fetchAlerts();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser]);

	const fetchAlerts = async () => {
		setLoading(true);
		try {
			const [alertsRes, userRes] = await Promise.all([
				axios.get(`${API_URL}/alerts`),
				currentUser?.id ? fetchUserById(currentUser.id) : Promise.resolve(null)
			]);

			const assignedId = userRes?.assignedBikeId || currentUser?.assignedBikeId || null;
			setLinkedBikeId(assignedId || null);

			let filtered = alertsRes.data;
			if (currentUser?.role === 'Student') {
				filtered = assignedId ? filtered.filter(a => a.bikeId === assignedId) : [];
			}

			setAlerts(filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
		} catch (error) {
			console.error('Error fetching alerts:', error);
		}
		setLoading(false);
	};

	const handleResolveAlert = async (alert) => {
		if (window.confirm(`Resolve alert ${alert.id}? Bike ${alert.bikeId} will be set Active.`)) {
			try {
				await Promise.all([
					axios.patch(`${API_URL}/alerts/${alert.id}`, { resolved: true }),
					axios.patch(`${API_URL}/bikes/${alert.bikeId}`, { status: 'Active' })
				]);
				setMessage({ text: `Alert ${alert.id} resolved. Bike ${alert.bikeId} is now Active.`, type: 'info' });
				fetchAlerts();
			} catch (error) {
				console.error('Error resolving alert:', error);
				setMessage({ text: 'Failed to resolve alert.', type: 'error' });
			}
		}
	};

	if (loading) return <p>Loading alerts...</p>;

	if (currentUser?.role === 'Student' && (!linkedBikeId || alerts.length === 0)) {
		return (
			<div>
				<h2>Student: My Alerts</h2>
				<p>No alerts for your linked bike.</p>
			</div>
		);
	}

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
											<button className="btn-success" onClick={() => handleResolveAlert(alert)}>
												Resolve
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>

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
