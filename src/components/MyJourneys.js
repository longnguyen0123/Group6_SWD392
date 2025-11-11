import React, { useState, useEffect } from 'react';
import BikeMap from './BikeMap'; 
import Pagination from './Pagination'; // ⭐️ 1. Import
import { fetchUserTrips } from '../services/trips';
import { fetchBikes } from '../services/bikes';

function MyJourneys({ currentUser }) { 
    const [trips, setTrips] = useState([]); // Danh sách lịch sử
    const [loading, setLoading] = useState(true);
    const [activeBike, setActiveBike] = useState(null); 
    const [showMap, setShowMap] = useState(false); 

    // ⭐️ 2. State Phân trang (chỉ cho Lịch sử)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [tripsData, bikesData] = await Promise.all([
                    fetchUserTrips(currentUser.id),
                    fetchBikes()
                ]);
                setTrips(tripsData || []);
                
                const currentActiveBike = (bikesData || []).find(
                    (bike) => bike.status === "In Use" && String(bike.currentUserId) === String(currentUser.id)
                );
                setActiveBike(currentActiveBike || null);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
            setLoading(false);
        };
        
        if (currentUser) {
            fetchAllData();
        }
    }, [currentUser]); 

    if (loading) return <p>Loading your journey data...</p>;

    // ⭐️ 3. Tính toán Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = trips.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(trips.length / itemsPerPage);

    return (
        <div>
            <div className="settings-form-container">
                <h3>Current Ride Status</h3>
                {activeBike ? (
                    <div>
                        <p>
                            You are currently riding: <strong>{activeBike.id}</strong> ({activeBike.modelId})
                        </p>
                        <button 
                            onClick={() => setShowMap(!showMap)}
                            className="btn-map-toggle"
                        >
                            {showMap ? 'Hide Map' : 'Track My Ride'}
                        </button>
                        
                        {showMap && (
                            <div style={{marginTop: '20px'}}>
                                <BikeMap bikes={[activeBike]} />
                            </div>
                        )}
                    </div>
                ) : (
                    <p>
                        You do not have an active ride. 
                        Go to <strong>"Available Bikes"</strong> to unlock one.
                    </p>
                )}
            </div>

            <h2>Student: My Journey History</h2>
            {trips.length === 0 ? (
                <p>No completed journey records found.</p>
            ) : (
                <>
                <table border="1">
                    <thead>
                        <tr>
                            <th>Trip ID</th>
                            <th>Bike ID</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* ⭐️ 4. Map 'currentItems' */}
                        {currentItems.map(trip => (
                            <tr key={trip.id}>
                                <td>{trip.id}</td>
                                <td>{trip.bikeId}</td>
                                <td>{new Date(trip.startTime).toLocaleString()}</td>
                                <td>{trip.endTime ? new Date(trip.endTime).toLocaleString() : 'N/A'}</td>
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

export default MyJourneys;