import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from './Pagination'; // ⭐️ 1. Import

const API_URL = 'http://localhost:3001';

function AllTripsReport() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    // ⭐️ 2. State Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchTrips = async () => {
            setLoading(true);
            try {
                // Sắp xếp theo thời gian mới nhất
                const response = await axios.get(`${API_URL}/trips?_expand=user&_sort=startTime&_order=desc`);
                setTrips(response.data);
            } catch (error) {
                console.error("Error fetching all trips:", error);
            }
            setLoading(false);
        };
        fetchTrips();
    }, []);

    if (loading) return <p>Loading all journey reports...</p>;

    // ⭐️ 3. Tính toán Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = trips.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(trips.length / itemsPerPage);

    return (
        <div>
            <h2>Admin: All Trips Report</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>Trip ID</th>
                        <th>Bike ID</th>
                        <th>User (Student)</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Distance (km)</th>
                    </tr>
                </thead>
                <tbody>
                    {/* ⭐️ 4. Map 'currentItems' */}
                    {currentItems.map(trip => (
                        <tr key={trip.id}>
                            <td>{trip.id}</td>
                            <td>{trip.bikeId}</td>
                            <td>{trip.user ? trip.user.fullName : `User ID: ${trip.userId}`}</td>
                            <td>{new Date(trip.startTime).toLocaleString()}</td>
                            <td>{trip.endTime ? new Date(trip.endTime).toLocaleString() : '(In Progress)'}</td>
                            <td>{trip.distance || 'N/A'}</td>
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
        </div>
    );
}

export default AllTripsReport;