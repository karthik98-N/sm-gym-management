import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MemberModal from '../components/MemberModal';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import './Dashboard.css';

// Connected to Google Apps Script
const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbyLRV3dPlb4GzyZsFlov-5w3DD3FJH6BMyVJ1w0XhEcfSy54hD06_CoRb6PBoXpujU7/exec";

const Dashboard = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const sendGooglePost = async (action, payload = {}) => {
    // Mode "no-cors" bypasses Google's strict browser security blocks completely for POSTs.
    // It means we can shoot data strictly into Google safely.
    try {
      await fetch(GOOGLE_APP_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload })
      });
      // no-cors returns an opaque response, so we don't try to parse it. We just wait 1s.
      await new Promise(resolve => setTimeout(resolve, 1500)); 
    } catch (err) {
      console.error("Google Script Error:", err);
      alert("Failed to push data to Google Drive.");
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${GOOGLE_APP_URL}?action=GET`);
      const data = await response.json();
      if (Array.isArray(data)) {
        // Automatically map 'id' to '_id' in case the user's sheet header was 'id' instead of '_id'
        const normalizedData = data.map(m => ({ ...m, _id: m._id || m.id }));
        setMembers(normalizedData.reverse());
      }
    } catch(err) {
      console.log("Fetch failed, probably needs doGet script setup.");
    }
    setLoading(false);
  };

  const handleAddSubmit = async (newMemberData) => {
    setLoading(true);
    const uniqueId = Date.now().toString();
    const newMember = { ...newMemberData, _id: uniqueId, id: uniqueId, createdAt: new Date().toISOString() };
    await sendGooglePost('POST', { member: newMember });
    await fetchMembers();
    setIsModalOpen(false);
  };

  const handleEditSubmit = async (id, updatedData) => {
    setLoading(true);
    await sendGooglePost('PUT', { id, member: updatedData });
    await fetchMembers();
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member from Google Drive?')) {
      setLoading(true);
      await sendGooglePost('DELETE', { id });
      await fetchMembers();
    }
  };

  const handleAdd = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const calculateStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry >= today ? 'Active' : 'Expired';
  };

  const filteredMembers = members.filter(m => 
    m.fullName?.toString().toLowerCase().includes(search.toLowerCase()) ||
    m.mobileNumber?.toString().includes(search)
  );

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="container mt-2">
        <div className="dashboard-header flex justify-between align-center border-bottom pb-1">
          <div className="flex align-center gap-1">
            <h2>Members List</h2>
            {loading && <FaSpinner className="spin text-primary" />}
          </div>
          <button className="btn btn-primary flex align-center gap-1" onClick={handleAdd} disabled={loading}>
            <FaPlus /> Add Member
          </button>
        </div>

        <div className="controls-bar flex justify-between align-center mt-2 mb-2">
          <div className="search-box flex align-center">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or mobile..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>
        </div>

        {/* Desktop View - Table */}
        <div className="table-responsive">
          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Plan</th>
                <th>Join Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => {
                const status = calculateStatus(member.expiryDate);
                return (
                  <tr key={member._id}>
                    <td>
                      <div className="member-name">{member.fullName}</div>
                      <div className="member-email">{member.email}</div>
                    </td>
                    <td>{member.mobileNumber}</td>
                    <td>{member.plan}</td>
                    <td>{member.joinDate ? new Date(member.joinDate).toLocaleDateString() : ''}</td>
                    <td>{member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : ''}</td>
                    <td>
                      <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon text-primary" onClick={() => handleEdit(member)} disabled={loading}><FaEdit /></button>
                        <button className="btn-icon text-danger" onClick={() => handleDelete(member._id)} disabled={loading}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="text-center p-2">No members found in Drive.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="members-grid">
          {filteredMembers.map(member => {
            const status = calculateStatus(member.expiryDate);
            return (
              <div className="member-card" key={member._id}>
                <div className="card-header flex justify-between align-center">
                  <h3 className="card-title">{member.fullName}</h3>
                  <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
                </div>
                <div className="card-body">
                  <p><strong>Mobile:</strong> {member.mobileNumber}</p>
                  <p><strong>Plan:</strong> {member.plan}</p>
                  <p><strong>Expiry:</strong> {member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : ''}</p>
                </div>
                <div className="card-actions flex justify-between mt-1 pt-1">
                  <button className="btn-text text-primary flex align-center gap-1" onClick={() => handleEdit(member)} disabled={loading}><FaEdit /> Edit</button>
                  <button className="btn-text text-danger flex align-center gap-1" onClick={() => handleDelete(member._id)} disabled={loading}><FaTrash /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <MemberModal 
          onClose={() => setIsModalOpen(false)} 
          member={editingMember} 
          onAdd={handleAddSubmit}
          onEdit={handleEditSubmit}
          loading={loading}
        />
      )}
    </div>
  );
};

export default Dashboard;
