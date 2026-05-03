import React, { useState, useEffect } from 'react';
import { FaTimes, FaCamera } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';
import LoadingOverlay from './ui/LoadingOverlay';
import './MemberModal.css';

const MemberModal = ({ onClose, member, onAdd, onEdit, loading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    plan: '1 Month',
    joinDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    paymentStatus: 'paid'
  });
  const [preview, setPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName,
        mobileNumber: member.mobileNumber,
        email: member.email || '',
        plan: member.plan,
        joinDate: new Date(member.joinDate).toISOString().split('T')[0],
        expiryDate: new Date(member.expiryDate).toISOString().split('T')[0],
        paymentStatus: member.paymentStatus
      });
      if (member.paymentScreenshot) {
        setPreview(member.paymentScreenshot);
      }
    } else {
      calculateExpiry(formData.joinDate, formData.plan);
    }
  }, [member]);

  const calculateExpiry = (joinDateStr, planStr) => {
    const joinData = new Date(joinDateStr);
    let expiry = new Date(joinDateStr);

    if (planStr === '1 Month') {
      expiry.setMonth(joinData.getMonth() + 1);
    } else if (planStr === '3 Months') {
      expiry.setMonth(joinData.getMonth() + 3);
    } else if (planStr === '6 Months') {
      expiry.setMonth(joinData.getMonth() + 6);
    } else if (planStr === '1 Year') {
      expiry.setFullYear(joinData.getFullYear() + 1);
    }

    setFormData(prev => ({ ...prev, expiryDate: expiry.toISOString().split('T')[0] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'plan' || name === 'joinDate') {
      const pPlan = name === 'plan' ? value : formData.plan;
      const pDate = name === 'joinDate' ? value : formData.joinDate;
      calculateExpiry(pDate, pPlan);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      
      const options = {
        maxSizeMB: 0.12, // Compress down to 120KB
        maxWidthOrHeight: 1280, // Keep resolution reasonable but legible
        useWebWorker: true,
        fileType: 'image/jpeg'
      };

      const compressedFile = await imageCompression(file, options);
      
      setPreview({
        file: compressedFile,
        previewUrl: URL.createObjectURL(compressedFile)
      });
    } catch (error) {
      console.error("Compression error:", error);
      window.dispatchEvent(new CustomEvent('sm-toast', { detail: { message: 'Image compression failed. Please try a different photo.', type: 'error' } }));
    } finally {
      setIsCompressing(false);
      e.target.value = null; // Clear input to allow re-selecting same file
    }
  };

  // Helper to ensure the image source is always a valid string
  const getImageSrc = (data) => {
    if (!data) return null;
    if (typeof data === 'string') return data;
    return data.previewUrl || null;
  };

  const handleViewFull = () => {
    const src = getImageSrc(preview);
    if (src) {
      const newWindow = window.open();
      newWindow.document.write(`<img src="${src}" style="max-width:100%; height:auto;" />`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...formData, paymentScreenshot: preview };
    
    if (member) {
      onEdit(member._id, finalData);
    } else {
      onAdd(finalData);
    }
  };

  return (
    <div className="modal-overlay flex align-center justify-center">
      {/* Rose Curve overlay — shown when saving or network is slow */}
      <LoadingOverlay visible={loading} message="Saving member…" />
      {/* Rose Curve overlay — shown when compressing image */}
      <LoadingOverlay visible={isCompressing} message="Compressing image…" />

      <div className="modal-content">
        <div className="modal-header flex justify-between align-center border-bottom pb-1 mb-2">
          <h2>{member ? 'Edit Member' : 'Add New Member'}</h2>
          <button className="btn-icon text-light" onClick={onClose} disabled={loading}><FaTimes /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" className="form-control" value={formData.fullName} onChange={handleInputChange} required />
            </div>
            
            <div className="form-group">
              <label>Mobile Number</label>
              <input type="tel" name="mobileNumber" className="form-control" value={formData.mobileNumber} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>Email (Optional)</label>
              <input type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Membership Plan</label>
              <select name="plan" className="form-control" value={formData.plan} onChange={handleInputChange}>
                <option value="1 Month">1 Month</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
              </select>
            </div>

            <div className="form-group">
              <label>Join Date</label>
              <input type="date" name="joinDate" className="form-control" value={formData.joinDate} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>Expiry Date (Auto-calculated)</label>
              <input type="date" name="expiryDate" className="form-control" value={formData.expiryDate} readOnly style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>

            <div className="form-group">
              <label>Payment Status</label>
              <select name="paymentStatus" className="form-control" value={formData.paymentStatus} onChange={handleInputChange}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="form-group upload-section mt-2">
            <label>Payment Screenshot</label>
            <div className="upload-box" style={{ border: preview ? 'none' : '' }}>
              <input type="file" id="file" accept="image/*" onChange={handleFileChange} hidden />
              <input type="file" id="camera" accept="image/*" capture="environment" onChange={handleFileChange} hidden />
              
              {preview ? (
                <div className="flex flex-col align-center">
                  <div className="preview-container">
                    <img 
                      src={getImageSrc(preview)} 
                      alt="Preview" 
                      className="preview-img" 
                      onError={(e) => {
                        console.error("Image load failed");
                        e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image';
                      }}
                    />
                  </div>
                  <div className="flex gap-1 mt-1 justify-center p-1">
                     <button type="button" className="btn-text text-primary" onClick={handleViewFull}>View Full Size</button>
                     <button type="button" className="btn-text text-danger" onClick={() => setPreview(null)}>Clear Image</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1" style={{ height: '100%' }}>
                  <label htmlFor="file" className="upload-label flex flex-col align-center text-dim" style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                    <FaCamera size={26} className="mb-1 text-primary" />
                    <span style={{ fontSize: '0.9rem' }}>Upload Pic</span>
                  </label>
                  <label htmlFor="camera" className="upload-label flex flex-col align-center text-dim" style={{ flex: 1 }}>
                    <FaCamera size={26} className="mb-1 text-primary" />
                    <span style={{ fontSize: '0.9rem' }}>Take Photo</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer flex justify-between mt-2 pt-2 border-top">
            <button type="button" className="btn btn-danger" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberModal;
