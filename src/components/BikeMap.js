import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// ⭐️ SỬA LỖI: Import ảnh theo cách của React (Webpack)
import icon from 'leaflet/dist/images/marker-icon.png';
// corrected filename: marker-shadow.png exists in leaflet package
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// ⭐️ SỬA LỖI: Chỉ định các ảnh đã import cho Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
});
// ----------------------------------------------------


// Tọa độ trung tâm FPT (Hòa Lạc)
const centerPosition = [21.0136, 105.5267]; 
// (Nếu là FPT HCM, đổi thành [10.814, 106.667])

function BikeMap({ bikes }) {

    // Hàm chuyển đổi tọa độ text sang [lat, lng]
    const parseLocation = (locationStr) => {
        try {
            // Đảm bảo locationStr là string trước khi split
            if (typeof locationStr !== 'string') {
                return null;
            }
            const parts = locationStr.split(',').map(Number);
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                return [parts[0], parts[1]];
            }
            return null; // Trả về null nếu tọa độ sai
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="map-container">
            <MapContainer center={centerPosition} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Lặp qua danh sách xe và ghim (Marker) */}
                {bikes.map(bike => {
                    const position = parseLocation(bike.lastLocation);
                    
                    // Chỉ hiển thị nếu tọa độ hợp lệ
                    if (!position) return null; 

                    return (
                        <Marker key={bike.id} position={position}>
                            <Popup>
                                <b>Bike ID: {bike.id}</b><br />
                                Status: {bike.status}<br />
                                Battery: {bike.batteryLevel}%
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default BikeMap;