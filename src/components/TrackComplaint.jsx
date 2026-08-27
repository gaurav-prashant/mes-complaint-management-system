import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TIMELINE_STEPS = [
  { label: 'Complaint Submitted', hindi: 'शिकायत दर्ज' },
  { label: 'Complaint Received', hindi: 'शिकायत प्राप्त' },
  { label: 'Under Review', hindi: 'समीक्षा में' },
  { label: 'Work in Progress', hindi: 'कार्य प्रगति पर' },
  { label: 'Resolved', hindi: 'समाधान' }
];


export default function TrackComplaint() {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const number = mobileNumber.trim();
    
    if (!number || !/^\d{10}$/.test(number)) {
      setError('Please enter a valid 10-digit mobile number. / कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);
    setHasSearched(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const response = await fetch(`${API_BASE}/complaints`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Network response was not ok');
      }
      
      const allComplaints = data.complaints || [];
      
      const foundInDb = allComplaints.filter(c => c.mobile === number);

      if (foundInDb.length > 0) {
        // deduplicate by complaintId just in case
        const uniqueResults = Array.from(new Map(foundInDb.map(item => [item.complaintId || item._id, item])).values());
        setResults(uniqueResults);
      }
      setHasSearched(true);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(err);
      if (err.name === 'AbortError') {
        setError('Connection timed out. Unable to fetch tracking data.');
      } else {
        setError('Unable to fetch tracking data. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStepIndex = (status) => {
    return TIMELINE_STEPS.findIndex(step => step.label.toLowerCase() === status.toLowerCase());
  };

  return (
    <div className="track-page-container">
      <div className="track-page-wrapper">
        <div className="track-page-header">
          <h2>Track Your Complaint</h2>
          <p>Enter your registered mobile number to see the status of your complaints.</p>
        </div>

        <div className="track-search-card">
          <form onSubmit={handleSearch} className="track-form">
            <div className="track-form-group">
              <label htmlFor="mobileNumber">Mobile Number</label>
              <input 
                type="tel" 
                id="mobileNumber" 
                value={mobileNumber} 
                onChange={(e) => setMobileNumber(e.target.value)} 
                placeholder="Enter 10-digit mobile number" 
                maxLength="10"
                className={error ? 'track-input error-input' : 'track-input'}
              />
              {error && <span className="track-error-text">{error}</span>}
            </div>
            
            <button type="submit" className="track-btn" disabled={isLoading}>
              {isLoading ? 'Checking status...' : 'Track Status'}
            </button>
          </form>
        </div>

        {hasSearched && results.length === 0 && (
          <div className="track-no-results">
            <h3>No complaints found</h3>
            <p>इस मोबाइल नंबर से कोई शिकायत नहीं मिली।</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="track-results-container">
            {results.map((result) => {
              const displayId = result.complaintId || result._id;
              const displayType = result.complaintType || result.complaint_type || result.type || 'N/A';
              const displayDate = result.submittedAt || result.created_at || 'N/A';

              return (
              <div key={displayId} className="track-result-card">
                <div className="track-result-details">
                  <div className="track-detail-row">
                    <div className="track-detail-col">
                      <span className="track-detail-label">Complainant Name</span>
                      <span className="track-detail-value">{result.name || result.fullName || 'N/A'}</span>
                    </div>
                    <div className="track-detail-col">
                      <span className="track-detail-label">Complaint ID</span>
                      <span className="track-detail-value">{displayId}</span>
                    </div>
                  </div>

                  <div className="track-detail-row">
                    <div className="track-detail-col">
                      <span className="track-detail-label">Status</span>
                      <span className="track-detail-value track-highlight">{result.status}</span>
                    </div>
                    <div className="track-detail-col">
                      <span className="track-detail-label">Submitted Date</span>
                      <span className="track-detail-value">{displayDate}</span>
                    </div>
                  </div>

                  <div className="track-detail-row">
                    <div className="track-detail-col">
                      <span className="track-detail-label">Complaint Type</span>
                      <span className="track-detail-value">{displayType}</span>
                    </div>
                    <div className="track-detail-col">
                      <span className="track-detail-label">Location / Area</span>
                      <span className="track-detail-value">{result.location || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="track-detail-row">
                    <div className="track-detail-col">
                      <span className="track-detail-label">Quarter Number</span>
                      <span className="track-detail-value">{result.quarter || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="track-detail-row track-full-width">
                    <div className="track-detail-col">
                      <span className="track-detail-label">Description</span>
                      <span className="track-detail-value track-desc-box">{result.description}</span>
                    </div>
                  </div>
                </div>


                <div className="track-timeline">
                  {TIMELINE_STEPS.map((step, index) => {
                    const currentIndex = getCurrentStepIndex(result.status);
                    const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;
                    
                    let stepStatus = 'pending';
                    if (index < effectiveIndex) stepStatus = 'completed';
                    else if (index === effectiveIndex) stepStatus = 'active';

                    return (
                      <div key={index} className={`track-timeline-step ${stepStatus}`}>
                        <div className="track-step-indicator">
                          {stepStatus === 'completed' ? '✓' : (stepStatus === 'active' ? '●' : '○')}
                        </div>
                        <div className="track-step-content">
                          <span className="track-step-label">{step.label}</span>
                        </div>
                        {index < TIMELINE_STEPS.length - 1 && <div className="track-step-line"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
            
            <div className="track-actions-bottom">
              <button className="track-secondary-btn" onClick={() => navigate('/submit-complaint')}>
                Submit New Complaint
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
