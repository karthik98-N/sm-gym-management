import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="container flex justify-between align-center">
        <div className="nav-brand">
          <span className="brand-primary">SM</span> FITNESS
        </div>
        <button onClick={logout} className="btn btn-danger btn-sm">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
