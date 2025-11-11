import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

function Login({ onLoginSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const [registerForm, setRegisterForm] = useState({
        id: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [registerError, setRegisterError] = useState('');

    const resetMessages = () => {
        setError('');
        setInfo('');
        setRegisterError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        resetMessages();

        try {
            const response = await axios.get(`${API_URL}/users?email=${encodeURIComponent(email.trim())}`);
            const user = response.data[0]; 

            if (!user) {
                setError('Invalid email or password.');
            } else if (user.password !== password) {
                setError('Invalid email or password.');
            } else if (user.status !== 'Active') {
                setError('Your account is Inactive. Please contact an administrator.');
            } else if (user.role !== 'Student' && user.role !== 'Admin' && user.role !== 'Technician') {
                setError('Your account role is not allowed.');
            } else {
                onLoginSuccess(user);
            }
        } catch (err) {
            setError('Failed to connect to the server. Is json-server running?');
            console.error(err);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        resetMessages();
        const id = registerForm.id.trim();
        const fullName = registerForm.fullName.trim();
        const regEmail = registerForm.email.trim().toLowerCase();
        const password = registerForm.password;
        const confirmPassword = registerForm.confirmPassword;

        if (!id || !fullName || !regEmail || !password) {
            setRegisterError('Please fill in all required fields.');
            return;
        }
        if (password !== confirmPassword) {
            setRegisterError('Password confirmation does not match.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
            setRegisterError('Invalid email format.');
            return;
        }

        try {
            const [idRes, emailRes] = await Promise.all([
                axios.get(`${API_URL}/users?id=${encodeURIComponent(id)}`),
                axios.get(`${API_URL}/users?email=${encodeURIComponent(regEmail)}`)
            ]);
            if (idRes.data.length > 0) {
                setRegisterError('Student ID already exists.');
                return;
            }
            if (emailRes.data.length > 0) {
                setRegisterError('Email is already registered.');
                return;
            }

            await axios.post(`${API_URL}/users`, {
                id,
                fullName,
                email: regEmail,
                password,
                role: 'Student',
                status: 'Active',
                balance: 0,
                assignedBikeId: null
            });

            setInfo('Registration successful! You can now log in.');
            setMode('login');
            setEmail(regEmail);
            setPassword('');
            setRegisterForm({
                id: '',
                fullName: '',
                email: '',
                password: '',
                confirmPassword: ''
            });
        } catch (err) {
            console.error(err);
            setRegisterError('Failed to register. Please try again later.');
        }
    };

    return (
        <div>
            <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>

            {info && (
                <div className="login-info">
                    {info}
                </div>
            )}

            {mode === 'login' ? (
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
                    
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}
                    
                    <button type="submit" style={{ width: '100%', marginTop: '10px' }}>Login</button>
                    <button
                        type="button"
                        className="btn-link"
                        style={{ width: '100%', marginTop: '8px' }}
                        onClick={() => { resetMessages(); setMode('register'); }}
                    >
                        Need an account? Register
                    </button>
                </form>
            ) : (
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Student ID</label>
                        <input
                            value={registerForm.id}
                            onChange={(e) => setRegisterForm(prev => ({ ...prev, id: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            value={registerForm.fullName}
                            onChange={(e) => setRegisterForm(prev => ({ ...prev, fullName: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={registerForm.confirmPassword}
                            onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <input value="Student" readOnly disabled />
                    </div>
                    {registerError && (
                        <div className="login-error">
                            {registerError}
                        </div>
                    )}
                    <button type="submit" style={{ width: '100%', marginTop: '10px' }}>Register</button>
                    <button
                        type="button"
                        className="btn-link"
                        style={{ width: '100%', marginTop: '8px' }}
                        onClick={() => { resetMessages(); setMode('login'); }}
                    >
                        Already have an account? Login
                    </button>
                </form>
            )}
        </div>
    );
}

export default Login;