import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Import cho Bản đồ (Map)
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
// Import cho Chức năng Vẽ (Draw)
import { EditControl } from 'react-leaflet-draw';

// Import và cấu hình Icon (Sửa lỗi Leaflet)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
});
// ----------------------------------------------------

const API_URL = 'http://localhost:3001';
const centerPosition = [21.0136, 105.5267]; // Tọa độ FPT Hòa Lạc

// Component Settings (ĐÃ CẬP NHẬT)
function Settings({ currentUser, setMessage }) {
    const [geofences, setGeofences] = useState([]);
    const [loading, setLoading] = useState(true);

    // ⭐️ (MỚI) State để quản lý việc hiển thị form Add/Map
    const [isAdding, setIsAdding] = useState(false);

    // State cho form Thêm mới
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('Campus');
    const [drawnShape, setDrawnShape] = useState(null);

    useEffect(() => {
        fetchGeofences();
    }, []);

    // 1. Lấy (Fetch) tất cả Geofences
    const fetchGeofences = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/geofences`);
            setGeofences(response.data);
        } catch (error) {
            console.error("Error fetching geofences:", error);
        }
        setLoading(false);
    };

    // 2. Xử lý Thêm mới (Add)
    const handleAddGeofence = async (e) => {
        e.preventDefault();
        
        if (!drawnShape) {
            setMessage({ text: 'Please draw a zone on the map first.', type: 'error' });
            return;
        }

        const newRule = {
            id: `geo_${Date.now()}`,
            name: newName,
            areaType: newType,
            alertOnExit: newType === 'Campus',
            geoJson: drawnShape // Lưu hình đã vẽ
        };

        try {
            await axios.post(`${API_URL}/geofences`, newRule);
            setMessage({ text: `Geofence '${newName}' created successfully.`, type: 'success' });
            fetchGeofences(); // Tải lại danh sách
            
            // ⭐️ (CẬP NHẬT) Ẩn form sau khi lưu
            setIsAdding(false); 
            setNewName('');
            setDrawnShape(null);
        } catch (error) {
            console.error("Error adding geofence:", error);
            setMessage({ text: 'Failed to create geofence.', type: 'error' });
        }
    };

    // 3. Xử lý Xóa (Delete)
    const handleDeleteGeofence = async (rule) => {
        if (window.confirm(`Are you sure you want to delete the rule '${rule.name}'?`)) {
            try {
                await axios.delete(`${API_URL}/geofences/${rule.id}`);
                setMessage({ text: `Geofence '${rule.name}' deleted.`, type: 'info' });
                fetchGeofences(); 
            } catch (error) {
                console.error("Error deleting geofence:", error);
            }
        }
    };

    // 4. Hàm xử lý khi VẼ XONG
    const handleCreated = (e) => {
        const { layerType, layer } = e;
        const shapeData = layer.toGeoJSON();
        
        if (layerType === 'circle') {
            shapeData.radius = layer.getRadius();
        }

        console.log("Shape created:", shapeData);
        setDrawnShape(shapeData);
        setMessage({ text: 'Zone drawn. Add details and save.', type: 'info' });
    };

    // 5. Hàm xử lý khi SỬA/XÓA hình đã vẽ
    const handleEdited = (e) => {
        // (Bỏ qua logic Sửa phức tạp)
    };
    const handleDeleted = (e) => {
        setDrawnShape(null); 
    };

    // ⭐️ (MỚI) Hàm hủy, reset và ẩn form
    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewName('');
        setDrawnShape(null);
    };

    if (loading) return <p>Loading settings...</p>;

    return (
        <div>
            <h2>System Settings (Geofence)</h2>
            
            {/* ⭐️ (CẬP NHẬT) Chỉ hiển thị form/map khi isAdding là true */}
            {isAdding ? (
                // GIAO DIỆN THÊM MỚI (MAP VÀ FORM)
                <div className="settings-form-container">
                    <h3>Add New Geofence Rule</h3>
                    
                    <p><strong>Step 1:</strong> Use the toolbar on the map to draw a Polygon or Circle.</p>
                    <div className="map-container">
                        <MapContainer center={centerPosition} zoom={16} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            
                            <FeatureGroup>
                                <EditControl
                                    position="topright"
                                    onCreated={handleCreated}
                                    onEdited={handleEdited}
                                    onDeleted={handleDeleted}
                                    draw={{
                                        rectangle: false,
                                        polyline: false,
                                        marker: false,
                                        circlemarker: false,
                                        polygon: true, 
                                        circle: true, 
                                    }}
                                    edit={{
                                        featureGroup: null, 
                                        remove: true,
                                    }}
                                />
                            </FeatureGroup>
                        </MapContainer>
                    </div>

                    <form onSubmit={handleAddGeofence} className="settings-form" style={{marginTop: '20px'}}>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label><strong>Step 2:</strong> Add details and Save</label>
                        </div>
                        <div className="form-group">
                            <label>Rule Name</label>
                            <input 
                                type="text" 
                                value={newName} 
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g., Library No-Parking Zone"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                                <option value="Campus">Campus (Alert on Exit)</option>
                                <option value="No-Parking">No-Parking (Alert on Entry)</option>
                                <option value="Restricted">Restricted</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            {/* Nút Cancel */}
                            <button type="button" className="btn-secondary" onClick={handleCancelAdd}>Cancel</button>
                            <button type="submit" disabled={!drawnShape}>Save New Rule</button>
                        </div>
                    </form>
                </div>
            ) : (
                // ⭐️ (MỚI) Nút để kích hoạt isAdding (hiển thị khi form ẩn)
                <div style={{ marginBottom: '20px' }}>
                    <button onClick={() => setIsAdding(true)}>Add New Geofence Rule</button>
                </div>
            )}

            {/* Bảng danh sách Geofence */}
            <h3>Existing Geofence Rules</h3>
            <table border="1">
                <thead>
                    <tr>
                        <th>Rule Name</th>
                        <th>Type</th>
                        <th>Geometry Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {geofences.map(rule => (
                        <tr key={rule.id}>
                            <td>{rule.name}</td>
                            <td>{rule.areaType}</td>
                            <td>
                                {rule.geoJson?.geometry?.type} 
                                {rule.geoJson?.radius ? ` (Radius: ${rule.geoJson.radius.toFixed(0)}m)` : ''}
                            </td>
                            <td>
                                <button 
                                    className="btn-warning"
                                    onClick={() => handleDeleteGeofence(rule)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Settings;