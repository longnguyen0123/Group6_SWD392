import React, { useEffect, useState } from 'react';
import Pagination from './Pagination';
import { fetchAuditLogs } from '../services/audits';

function AuditLogs() {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [actionFilter, setActionFilter] = useState('All');

	// pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	useEffect(() => {
		fetchLogs();
	}, []);

    const fetchLogs = async () => {
		setLoading(true);
		try {
            const data = await fetchAuditLogs();
            // sort by timestamp desc
            const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
			setLogs(sorted);
		} catch (e) {
			console.error(e);
		}
		setLoading(false);
	};

	const filtered = logs.filter(l => {
		const matchesAction = actionFilter === 'All' ? true : l.action === actionFilter;
		const s = search.trim().toLowerCase();
		const matchesSearch = !s ? true :
			JSON.stringify(l).toLowerCase().includes(s);
		return matchesAction && matchesSearch;
	});

	const totalPages = Math.ceil(filtered.length / itemsPerPage);
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const pageItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

	const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

	if (loading) return <p>Loading audit logs...</p>;

	return (
		<div>
			<h2>Admin: Audit Logs</h2>
			<div className="filter-bar">
				<input
					type="text"
					placeholder="Search in logs..."
					value={search}
					onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
				/>
				<select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}>
					<option value="All">All Actions</option>
					{uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
				</select>
				<button onClick={fetchLogs}>Refresh</button>
			</div>
			<table border="1">
				<thead>
					<tr>
						<th>Time</th>
						<th>Action</th>
						<th>Admin ID</th>
						<th>User ID</th>
						<th>Bike ID</th>
						<th>Details</th>
					</tr>
				</thead>
				<tbody>
					{pageItems.map(item => (
						<tr key={item.id}>
							<td>{new Date(item.timestamp).toLocaleString()}</td>
							<td>{item.action}</td>
							<td>{item.adminId}</td>
							<td>{item.userId || '-'}</td>
							<td>{item.bikeId || '-'}</td>
							<td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<code>{JSON.stringify(item)}</code>
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
		</div>
	);
}

export default AuditLogs;

