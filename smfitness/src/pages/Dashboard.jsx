import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Navbar from '../components/Navbar';
import MemberModal from '../components/MemberModal';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaSpinner, FaFileImage, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import './Dashboard.css';
import { supabase } from '../supabase';

const CACHE_KEY = 'sm_gym_members_cache';

// ── Toast Notification System ──────────────────────────────────────────────────
const Toast = ({ toasts, onRemove }) => (
  <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {toasts.map(t => (
      <div key={t.id} onClick={() => onRemove(t.id)} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: t.type === 'success' ? '#1a3a2a' : '#3a1a1a',
        border: `1px solid ${t.type === 'success' ? '#2ecc71' : '#e74c3c'}`,
        color: '#fff', padding: '12px 18px', borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)', cursor: 'pointer',
        animation: 'slideInRight 0.25s ease', minWidth: '260px', maxWidth: '360px',
        fontSize: '0.9rem'
      }}>
        {t.type === 'success'
          ? <FaCheckCircle style={{ color: '#2ecc71', flexShrink: 0 }} />
          : <FaExclamationCircle style={{ color: '#e74c3c', flexShrink: 0 }} />}
        <span>{t.message}</span>
      </div>
    ))}
  </div>
);

// ── MemoizedRow to prevent re-renders ─────────────────────────────────────────
const MemberRow = React.memo(({ member, onEdit, onDelete, onViewImage, saving }) => {
  const status = useMemo(() => {
    return new Date(member.expiryDate) >= new Date() ? 'Active' : 'Expired';
  }, [member.expiryDate]);

  const receiptSrc = typeof member.paymentScreenshot === 'string' ? member.paymentScreenshot : null;

  return (
    <tr>
      <td>
        <div className="member-name">{member.fullName}</div>
        <div className="member-email">{member.email}</div>
      </td>
      <td>{member.mobileNumber}</td>
      <td>{member.plan}</td>
      <td>{member.joinDate ? new Date(member.joinDate).toLocaleDateString() : ''}</td>
      <td>{member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : ''}</td>
      <td><span className={`badge badge-${status.toLowerCase()}`}>{status}</span></td>
      <td>
        {receiptSrc ? (
          <button className="receipt-btn" onClick={() => onViewImage(receiptSrc)} title="View Payment Receipt">
            <FaFileImage /><span>View</span>
          </button>
        ) : (
          <span className="text-dim" style={{ fontSize: '0.8rem' }}>No Image</span>
        )}
      </td>
      <td>
        <div className="action-buttons">
          <button className="btn-icon text-primary" onClick={() => onEdit(member)} disabled={saving}><FaEdit /></button>
          <button className="btn-icon text-danger" onClick={() => onDelete(member._id)} disabled={saving}><FaTrash /></button>
        </div>
      </td>
    </tr>
  );
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
const Dashboard = () => {
  // Load from cache instantly (0ms)
  const [members, setMembers] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toasts, setToasts] = useState([]);
  const debounceRef = useRef(null);

  // ── Toast helpers ──
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Debounced search ──
  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 200);
  }, []);

  // ── Fetch & cache ──
  const fetchMembers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch Error:', error);
      } else if (data) {
        const normalized = data.map(m => ({ ...m, _id: m.id }));
        setMembers(normalized);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(normalized)); } catch {}
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    // If cache was loaded, fetch silently in background — user sees data instantly
    fetchMembers(members.length > 0);

    // Listen for toast events from child components (e.g. MemberModal)
    const handler = (e) => addToast(e.detail.message, e.detail.type);
    window.addEventListener('sm-toast', handler);
    return () => window.removeEventListener('sm-toast', handler);
  }, []);

  // ── Upload helper with compression ──
  const uploadImage = useCallback(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('receipts').upload(fileName, file);
    if (error) {
      addToast(`Image upload failed: ${error.message}`, 'error');
      return null;
    }
    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
    return urlData.publicUrl;
  }, [addToast]);

  // ── Add Member ──
  const handleAddSubmit = useCallback(async (newMemberData) => {
    setSaving(true);

    let paymentScreenshotUrl = null;
    if (newMemberData.paymentScreenshot?.file) {
      paymentScreenshotUrl = await uploadImage(newMemberData.paymentScreenshot.file);
    }

    const { paymentScreenshot, ...memberData } = newMemberData;
    const finalMemberData = { ...memberData, paymentScreenshot: paymentScreenshotUrl };

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...finalMemberData, id: tempId, _id: tempId };
    setMembers(prev => {
      const next = [optimistic, ...prev];
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setIsModalOpen(false);

    const { data, error } = await supabase.from('members').insert([finalMemberData]).select().single();
    if (error) {
      addToast(`Save failed: ${error.message}`, 'error');
      setMembers(prev => {
        const next = prev.filter(m => m._id !== tempId);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    } else {
      const real = { ...data, _id: data.id };
      setMembers(prev => {
        const next = prev.map(m => m._id === tempId ? real : m);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
      addToast('Member saved successfully!');
    }
    setSaving(false);
  }, [uploadImage, addToast]);

  // ── Edit Member ──
  const handleEditSubmit = useCallback(async (id, updatedData) => {
    setSaving(true);

    let paymentScreenshotUrl = updatedData.paymentScreenshot;
    if (updatedData.paymentScreenshot?.file) {
      paymentScreenshotUrl = await uploadImage(updatedData.paymentScreenshot.file);
      if (!paymentScreenshotUrl) { setSaving(false); return; }
    } else if (typeof updatedData.paymentScreenshot !== 'string') {
      paymentScreenshotUrl = null;
    }

    const { paymentScreenshot, _id, id: oldId, ...memberData } = updatedData;
    const finalMemberData = { ...memberData, paymentScreenshot: paymentScreenshotUrl };

    // Optimistic update
    setMembers(prev => {
      const next = prev.map(m => m._id === id ? { ...m, ...finalMemberData } : m);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setIsModalOpen(false);

    const { error } = await supabase.from('members').update(finalMemberData).eq('id', id);
    if (error) {
      addToast(`Update failed: ${error.message}`, 'error');
      fetchMembers(true);
    } else {
      addToast('Member updated successfully!');
    }
    setSaving(false);
  }, [uploadImage, addToast, fetchMembers]);

  // ── Delete Member ──
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this member?')) return;

    setMembers(prev => {
      const next = prev.filter(m => m._id !== id);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      addToast(`Delete failed: ${error.message}`, 'error');
      fetchMembers(true);
    } else {
      addToast('Member deleted.');
    }
  }, [addToast, fetchMembers]);

  const handleAdd = useCallback(() => { setEditingMember(null); setIsModalOpen(true); }, []);
  const handleEdit = useCallback((member) => { setEditingMember(member); setIsModalOpen(true); }, []);

  const filteredMembers = useMemo(() =>
    members.filter(m =>
      m.fullName?.toString().toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      m.mobileNumber?.toString().includes(debouncedSearch)
    ), [members, debouncedSearch]);

  const getImageSrc = (data) => {
    if (!data) return null;
    if (typeof data === 'string') return data;
    return data.previewUrl || null;
  };

  return (
    <div className="dashboard">
      <Navbar />
      <style>{`@keyframes slideInRight { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }`}</style>
      
      <div className="container mt-2">
        <div className="dashboard-header flex justify-between align-center border-bottom pb-1">
          <div className="flex align-center gap-1">
            <h2>Fitness Members Dashboard</h2>
            {(loading || saving) && <FaSpinner className="spin text-primary" />}
          </div>
          <button className="btn btn-primary flex align-center gap-1" onClick={handleAdd} disabled={saving}>
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
              onChange={handleSearchChange}
              className="form-control"
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="table-responsive">
          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th><th>Mobile</th><th>Plan</th>
                <th>Join Date</th><th>Expiry Date</th>
                <th>Status</th><th>Receipt</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <MemberRow
                  key={member._id}
                  member={member}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewImage={setSelectedImage}
                  saving={saving}
                />
              ))}
              {filteredMembers.length === 0 && !loading && (
                <tr><td colSpan="8" className="text-center p-2">No members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="members-grid">
          {filteredMembers.map(member => {
            const status = new Date(member.expiryDate) >= new Date() ? 'Active' : 'Expired';
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
                  {getImageSrc(member.paymentScreenshot) && (
                    <button 
                      className="btn btn-primary mt-1" 
                      style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
                      onClick={() => setSelectedImage(getImageSrc(member.paymentScreenshot))}
                    >
                      <FaFileImage className="mr-1" /> View Receipt
                    </button>
                  )}
                </div>
                <div className="card-actions flex justify-between mt-1 pt-1">
                  <button className="btn-text text-primary flex align-center gap-1" onClick={() => handleEdit(member)} disabled={saving}><FaEdit /> Edit</button>
                  <button className="btn-text text-danger flex align-center gap-1" onClick={() => handleDelete(member._id)} disabled={saving}><FaTrash /> Delete</button>
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
          loading={saving}
        />
      )}

      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <button className="lightbox-close"><FaTimes /></button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Receipt Full size" loading="lazy" />
          </div>
        </div>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Dashboard;
