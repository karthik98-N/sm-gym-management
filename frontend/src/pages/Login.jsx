import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'Network Error') {
        setError('Database disconnected. Ensure backend and MongoDB are running.');
      } else {
        setError(err.response?.data?.msg || 'Invalid email or password');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <h1 className="logo-text">SM <span className="logo-highlight">FITNESS</span></h1>
          <p className="logo-subtext">STUDIO</p>
        </div>
        
        <h2 className="login-title">Admin Access</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 mt-1">LOG IN</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
