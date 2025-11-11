import React, { useState, useEffect } from 'react';
import BikeManagement from './components/BikeManagement';
import MyJourneys from './components/MyJourneys';
import UserManagement from './components/UserManagement';
import AllTripsReport from './components/AllTripsReport';
import AvailableBikes from './components/AvailableBikes';
import MyAlerts from './components/MyAlerts';
import Login from './components/Login';
import MaintenanceManagement from './components/MaintenanceManagement'; // ⭐️ THÊM MỚI
import AnnouncementsManagement from './components/AnnouncementsManagement';
import AnnouncementsList from './components/AnnouncementsList';
import LostReportsManagement from './components/LostReportsManagement';
import Profile from './components/Profile';
import PaymentsStudent from './components/PaymentsStudent';
import PaymentsManagement from './components/PaymentsManagement';
import RealTimeMonitor from './components/RealTimeMonitor';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Settings from './components/Settings';
import RolesManagement from './components/RolesManagement';
import AuditLogs from './components/AuditLogs';
import './App.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css'; // ⭐️ THÊM MỚI (Import CSS cho bản đồ)

// Component Lightbox
const ImageLightboxModal = ({ imageSrc, onClose }) => {
    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <span className="lightbox-close" onClick={onClose}>&times;</span>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img src={imageSrc} alt="Full view" className="lightbox-image" />
            </div>
        </div>
    );
};

// ⭐️ CẬP NHẬT: Component Sidebar (Thêm Maintenance cho Admin/Technician)
const Sidebar = ({ user, activeView, onNavigate, onLogout }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>{user.fullName}</h3>
                <span>{user.role}</span>
            </div>
            
            <nav className="sidebar-nav">
                {/* Menu ADMIN / TECHNICIAN */}
                {(user.role === 'Admin' || user.role === 'Technician') && (
                    <>
                        <button 
                            className={activeView === 'bikes' ? 'active' : ''}
                            onClick={() => onNavigate('bikes')}>
                            Bike Management
                        </button>
                        
                        {/* ⭐️ THÊM MỚI: Maintenance (Cho cả 2 vai trò) */}
                        <button 
                            className={activeView === 'maintenance' ? 'active' : ''}
                            onClick={() => onNavigate('maintenance')}>
                            Maintenance
                        </button>

                        {/* Chỉ Admin thấy User Management */}
                        {user.role === 'Admin' && (
                            <button 
                                className={activeView === 'users' ? 'active' : ''}
                                onClick={() => onNavigate('users')}>
                                User Management
                            </button>
                        )}
                        {user.role === 'Admin' && (
                            <button 
                                className={activeView === 'auditlogs' ? 'active' : ''}
                                onClick={() => onNavigate('auditlogs')}>
                                Audit Logs
                            </button>
                        )}
                        <button className={activeView === 'payments' ? 'active' : ''} onClick={() => onNavigate('payments')}>Payments</button>
                        <button className={activeView === 'monitor' ? 'active' : ''} onClick={() => onNavigate('monitor')}>Monitor</button>
                        <button className={activeView === 'analytics' ? 'active' : ''} onClick={() => onNavigate('analytics')}>Analytics</button>
                        <button className={activeView === 'settings' ? 'active' : ''} onClick={() => onNavigate('settings')}>Settings</button>
                        <button className={activeView === 'roles' ? 'active' : ''} onClick={() => onNavigate('roles')}>Roles</button>
                        {/* Announcements (Admin) */}
                        {user.role === 'Admin' && (
                            <button
                                className={activeView === 'announcements_admin' ? 'active' : ''}
                                onClick={() => onNavigate('announcements_admin')}>
                                Announcements
                            </button>
                        )}
                        {/* Lost reports (Admin) */}
                        {user.role === 'Admin' && (
                            <button
                                className={activeView === 'lostreports' ? 'active' : ''}
                                onClick={() => onNavigate('lostreports')}>
                                Lost Reports
                            </button>
                        )}
                        <button 
                            className={activeView === 'trips' ? 'active' : ''}
                            onClick={() => onNavigate('trips')}>
                            All Trips Report
                        </button>
                    </>
                )}

                {/* Menu STUDENT */}
                {user.role === 'Student' && (
                    <>
                        <button 
                            className={activeView === 'available' ? 'active' : ''}
                            onClick={() => onNavigate('available')}>
                            Available Bikes
                        </button>
                        <button
                            className={activeView === 'announcements' ? 'active' : ''}
                            onClick={() => onNavigate('announcements')}>
                            Announcements
                        </button>
                            <button
                                className={activeView === 'profile' ? 'active' : ''}
                                onClick={() => onNavigate('profile')}>
                                Profile
                            </button>
                            <button
                                className={activeView === 'payments_student' ? 'active' : ''}
                                onClick={() => onNavigate('payments_student')}>
                                Payments
                            </button>
                            <button 
                                className={activeView === 'journeys' ? 'active' : ''}
                                onClick={() => onNavigate('journeys')}>
                                My Journeys
                            </button>
                        <button 
                            className={activeView === 'alerts' ? 'active' : ''}
                            onClick={() => onNavigate('alerts')}>
                            My Alerts
                        </button>
                    </>
                )}

                <button onClick={onLogout} className="logout">Logout</button>
            </nav>
        </div>
    );
};

// ⭐️ CẬP NHẬT: Component Content (Thêm route 'maintenance')
// ⭐️ CẬP NHẬT: Component Content (Sửa lỗi Settings)
const Content = ({ view, user, setMessage, setViewingImage, onUpdateUser }) => {
    // Admin Views
    if (view === 'bikes') 
        return <BikeManagement setMessage={setMessage} setViewingImage={setViewingImage} />;
    
    if (view === 'maintenance')
        return <MaintenanceManagement currentUser={user} setMessage={setMessage} />;

    if (view === 'users') 
        return <UserManagement currentUser={user} setMessage={setMessage} />;

    if (view === 'payments')
        return <PaymentsManagement setMessage={setMessage} />;
    if (view === 'monitor')
        return <RealTimeMonitor />;
    if (view === 'analytics')
        return <AnalyticsDashboard />;
    
    // ⭐️ SỬA LỖI Ở ĐÂY ⭐️
    if (view === 'settings')
        return <Settings currentUser={user} setMessage={setMessage} />;

    if (view === 'roles')
        return <RolesManagement setMessage={setMessage} />;
    if (view === 'auditlogs')
        return <AuditLogs />;

    if (view === 'trips') 
        return <AllTripsReport />;

    // Student Views
    if (view === 'available') 
        return <AvailableBikes currentUser={user} setMessage={setMessage} setViewingImage={setViewingImage} />;
    if (view === 'journeys') 
        return <MyJourneys currentUser={user} />;
    if (view === 'alerts') 
        return <MyAlerts currentUser={user} setMessage={setMessage} />;
    if (view === 'announcements')
        return <AnnouncementsList />;
    if (view === 'profile')
        return <Profile currentUser={user} setMessage={setMessage} onUpdateUser={onUpdateUser} />;
    if (view === 'payments_student')
        return <PaymentsStudent currentUser={user} setMessage={setMessage} />;

    // Admin Views (extra)
    if (view === 'announcements_admin')
        return <AnnouncementsManagement setMessage={setMessage} />;
    if (view === 'lostreports')
        return <LostReportsManagement setMessage={setMessage} />;

    return <h2>Welcome to SBE Dashboard</h2>; 
};

// Component APP chính
function App() {
    const [currentUser, setCurrentUser] = useState(getInitialUser());
    const [message, setMessage] = useState(null); 
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [viewingImage, setViewingImage] = useState(null); 

    // ⭐️ CẬP NHẬT: State cho view (Thêm default cho Technician)
    const [activeView, setActiveView] = useState(() => {
        const savedView = sessionStorage.getItem('sbe_active_view');
        const user = getInitialUser(); 
        
        if (user && savedView) { return savedView; }
        if (user) {
            if (user.role === 'Student') return 'available';
            if (user.role === 'Technician') return 'maintenance'; // Default cho Tech
            return 'bikes'; // Default cho Admin
        }
        return '';
    }); 

    useEffect(() => {
        if (message) {
            setIsToastVisible(true);
            const timer = setTimeout(() => {
                setIsToastVisible(false); 
                setTimeout(() => setMessage(null), 500);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // ⭐️ CẬP NHẬT: handleLoginSuccess (Thêm default cho Technician)
    const handleLoginSuccess = (user) => {
        let defaultView = 'bikes'; // Admin
        if (user.role === 'Student') defaultView = 'available';
        if (user.role === 'Technician') defaultView = 'maintenance';
        
        sessionStorage.setItem('sbe_user_session', JSON.stringify(user));
        sessionStorage.setItem('sbe_active_view', defaultView); 
        
        setCurrentUser(user);
        setMessage({ text: `Welcome back, ${user.fullName}!`, type: 'success' });
        setActiveView(defaultView);
    };

    // (handleLogout giữ nguyên)
    const handleLogout = () => {
        sessionStorage.removeItem('sbe_user_session');
        sessionStorage.removeItem('sbe_active_view'); 
        setCurrentUser(null);
        setMessage(null); 
        setIsToastVisible(false);
    };

    // (handleNavigate giữ nguyên)
    const handleNavigate = (view) => {
        sessionStorage.setItem('sbe_active_view', view); 
        setActiveView(view);
    };

    // --- RENDER ---
    if (!currentUser) {
        return <div className="App-Login"><Login onLoginSuccess={handleLoginSuccess} /></div>;
    }

    return (
        <div className="dashboard-container">
            {message && (
                <div className={`toast-popup ${isToastVisible ? 'show' : ''} ${message.type}`}>
                    {message.text}
                </div>
            )}

            {viewingImage && (
                <ImageLightboxModal 
                    imageSrc={`${process.env.PUBLIC_URL}/images/${viewingImage}`}
                    onClose={() => setViewingImage(null)}
                />
            )}

            <Sidebar 
                user={currentUser} 
                activeView={activeView}
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
            />

            <div className="content">
                <Content 
                    view={activeView} 
                    user={currentUser} 
                    setMessage={setMessage} 
                    setViewingImage={setViewingImage}
                    onUpdateUser={setCurrentUser}
                />
            </div>
        </div>
    );
}

// (getInitialUser giữ nguyên)
const getInitialUser = () => {
    const savedUser = sessionStorage.getItem('sbe_user_session');
    if (savedUser) {
        return JSON.parse(savedUser);
    }
    return null;
};

export default App;