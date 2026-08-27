import React from 'react';
import { Link } from 'react-router-dom';

export default function CTA() {
  return (
    <div className="cta" style={{ marginBottom: '0 !important' }}>
      <h2>Ready to Get Started?</h2>
      <p>Join thousands of satisfied users who trust our complaint management system</p>
      <Link to="/submit-complaint" className="cta-btn">
        <span style={{ marginRight: '8px' }}>📄</span> Submit Your First Complaint <span style={{ marginLeft: '8px' }}>→</span>
      </Link>
    </div>
  );
}
