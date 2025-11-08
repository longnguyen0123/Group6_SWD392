import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Quick polling-based monitor: refresh bikes every 5s
function RealTimeMonitor() {
    const [bikes, setBikes] = useState([]);

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            try { const res = await axios.get(`${API_URL}/bikes`); if (mounted) setBikes(res.data || []); }
            catch (e) { console.error(e); }
        };
        fetch();
        const id = setInterval(fetch, 5000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
        <div>
            <h2>Real-time Monitor (polling)</h2>
            <p>Auto-updates every 5s. This is a lightweight monitor showing bike status & battery.</p>
            <table>
                <thead><tr><th>ID</th><th>Status</th><th>Battery</th><th>Location</th></tr></thead>
                <tbody>
                    {bikes.map(b => (
                        <tr key={b.id}><td>{b.id}</td><td>{b.status}</td><td>{b.batteryLevel}%</td><td>{b.lastLocation}</td></tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default RealTimeMonitor;
