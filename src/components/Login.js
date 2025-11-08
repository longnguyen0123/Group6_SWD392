import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); 

        try {
            const response = await axios.get(`${API_URL}/users?email=${email}`);
            const user = response.data[0]; 

            if (!user) {
                setError('Invalid email or password.');
            } else if (user.password !== password) {
                setError('Invalid email or password.');
            } else if (user.status !== 'Active') {
                setError('Your account is Inactive. Please contact an administrator.');
            } else {
                onLoginSuccess(user);
            }
        } catch (err) {
            setError('Failed to connect to the server. Is json-server running?');
            console.error(err);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            {/* Bỏ class "login-form" cũ, CSS sẽ áp dụng cho form bên trong .App-Login */}
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                
                {/* ⭐️ THAY ĐỔI: Bọc lỗi trong div có class mới */}
                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}
                
                {/* Thêm margin cho nút Login */}
                <button type="submit" style={{ width: '100%', marginTop: '10px' }}>Login</button>
            </form>
        </div>
    );
}

export default Login;