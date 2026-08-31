import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getApiBase from '../utils/apiBase';

export default function SubmitComplaint() {
  const navigate = useNavigate();
  
  const initialFormState = {
    fullName: '',
    mobileNumber: '',
    emailAddress: '',
    quarterNumber: '',
    location: '',
    complaintType: '',
    description: '',
    images: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [complaintId, setComplaintId] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required.';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (!formData.quarterNumber.trim()) newErrors.quarterNumber = 'Quarter Number is required.';
    if (!formData.location.trim()) newErrors.location = 'Location/Area is required.';
    if (!formData.complaintType) newErrors.complaintType = 'Complaint Type is required.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => {
      const totalImages = prev.images.length + files.length;
      if (totalImages > 3) {
        alert('You can only upload a maximum of 3 images.');
        return prev;
      }
      
      const newImages = files.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
      
      return { ...prev, images: [...prev.images, ...newImages] };
    });
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      URL.revokeObjectURL(newImages[indexToRemove].preview);
      newImages.splice(indexToRemove, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newComplaintId = `MES-2026-${randomId}`;

    const newComplaint = {
      complaintId: newComplaintId,
      name: formData.fullName, // matching backend schema
      mobile: formData.mobileNumber,
      email: formData.emailAddress,
      quarter: formData.quarterNumber,
      location: formData.location,
      complaint_type: formData.complaintType,
      description: formData.description,
      status: 'Submitted',
      admin_remarks: ''
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComplaint),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      setComplaintId(newComplaintId);
      setIsSuccess(true);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error submitting complaint:', error);
      if (error.name === 'AbortError') {
        alert('Connection timed out. Failed to submit complaint.');
      } else {
        alert('Failed to submit complaint. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAnother = () => {
    setIsSuccess(false);
    setFormData(initialFormState);
    setComplaintId('');
    setErrors({});
  };

  if (isSuccess) {
    return (
      <div className="submit-page-container">
        <div className="form-card success-card">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2>Complaint Submitted Successfully!</h2>
          <h3 style={{ color: '#166534', marginTop: 0, marginBottom: '16px', fontWeight: 600 }}>शिकायत सफलतापूर्वक दर्ज की गई!</h3>
          <div className="complaint-id-box">
            <span className="id-label">Your Complaint ID:</span>
            <span className="id-value">{complaintId}</span>
          </div>
          <div className="success-actions">
            <button className="primary-form-btn" onClick={() => navigate('/track-status')}>
              Track Complaint
            </button>
            <button className="secondary-form-btn" onClick={submitAnother}>
              Submit Another Complaint
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-page-container">
      <div className="submit-page-wrapper">
        <div className="form-header">
          <h2 className="submit-title">Submit Your Complaint</h2>
          <h3 className="submit-subtitle">अपनी शिकायत दर्ज करें</h3>
        </div>
        
        <div className="form-card">
          <form onSubmit={handleSubmit} className="complaint-form">
            <div className="form-grid-2col">
              {/* LEFT COLUMN */}
              <div className="form-col">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name * / पूरा नाम *</label>
                  <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your name / अपना नाम दर्ज करें" className={errors.fullName ? 'error-input' : ''} />
                  {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="emailAddress">Email Address (Optional) / ईमेल पता (वैकल्पिक)</label>
                  <input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress} onChange={handleChange} placeholder="For notifications / सूचनाओं के लिए" />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location/Area * / स्थान/क्षेत्र *</label>
                  <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., M Zone, Nil Bhavan, K L Zone" className={errors.location ? 'error-input' : ''} />
                  {errors.location && <span className="error-text">{errors.location}</span>}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="form-col">
                <div className="form-group">
                  <label htmlFor="mobileNumber">Mobile Number * / मोबाइल नंबर *</label>
                  <input type="tel" id="mobileNumber" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="10-digit mobile number / 10 अंकों का मोबाइल नंबर" maxLength="10" className={errors.mobileNumber ? 'error-input' : ''} />
                  {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="quarterNumber">Quarter Number * / क्वार्टर नंबर *</label>
                  <input type="text" id="quarterNumber" name="quarterNumber" value={formData.quarterNumber} onChange={handleChange} placeholder="e.g., B-104" className={errors.quarterNumber ? 'error-input' : ''} />
                  {errors.quarterNumber && <span className="error-text">{errors.quarterNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="complaintType">Complaint Type * / शिकायत का प्रकार *</label>
                  <select id="complaintType" name="complaintType" value={formData.complaintType} onChange={handleChange} className={errors.complaintType ? 'error-input' : ''}>
                    <option value="">Select Type / प्रकार चुनें</option>
                    <option value="Electrical / बिजली">Electrical / बिजली</option>
                    <option value="Plumbing / नलसाजी">Plumbing / नलसाजी</option>
                    <option value="Carpentry / बढ़ईगीरी">Carpentry / बढ़ईगीरी</option>
                    <option value="Civil Work / सिविल कार्य">Civil Work / सिविल कार्य</option>
                    <option value="Garbage/Cleaning / कचरा/सफाई (RWA)">Garbage/Cleaning / कचरा/सफाई (RWA)</option>
                    <option value="Other / अन्य">Other / अन्य</option>
                  </select>
                  {errors.complaintType && <span className="error-text">{errors.complaintType}</span>}
                </div>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description of Issue * / समस्या का विवरण *</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Please describe the problem in detail... / कृपया समस्या का विस्तार से वर्णन करें..." className={errors.description ? 'error-input description-input' : 'description-input'}></textarea>
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>

            <div className="form-group full-width">
              <label>Upload Images (Max 3) / फोटो अपलोड करें (अधिकतम 3)</label>
              <div className="upload-container">
                <div className="upload-area">
                  <input type="file" id="images" name="images" onChange={handleImageChange} className="upload-input" accept="image/jpeg, image/png" multiple disabled={formData.images.length >= 3} />
                  <div className="upload-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p className="upload-text">Click or drag images here / यहाँ क्लिक करें या फोटो खींचें</p>
                    <p className="upload-helper">Supported: JPG, PNG (Max 2MB each) / समर्थित: JPG, PNG (प्रत्येक अधिकतम 2MB)</p>
                  </div>
                </div>
                {formData.images.length > 0 && (
                  <div className="image-preview-container">
                    {formData.images.map((img, index) => (
                      <div key={index} className="image-preview">
                        <img src={img.preview} alt={`Preview ${index}`} />
                        <button type="button" className="remove-image-btn" onClick={() => removeImage(index)} aria-label="Remove image">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-submit-container">
              <button type="submit" className="primary-form-btn submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span> Processing...
                  </>
                ) : (
                  'Submit Complaint / शिकायत दर्ज करें'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
