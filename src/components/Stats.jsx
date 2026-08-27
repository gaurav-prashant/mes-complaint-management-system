import React from 'react'

export default function Stats({ totalCount = "5000+" }) {
  return (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-icon">
          <span className="stat-symbol">✓</span>
        </div>
        <div>
          <div className="stat-title">Total Complaints</div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-desc">Registered in system</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">
          <span className="stat-symbol">◷</span>
        </div>
        <div>
          <div className="stat-title">Average Response Time</div>
          <div className="stat-value">24hrs</div>
          <div className="stat-desc">Quick response</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">
          <span className="stat-symbol">⚡</span>
        </div>
        <div>
          <div className="stat-title">Satisfaction Rate</div>
          <div className="stat-value">95%</div>
          <div className="stat-desc">Citizen satisfaction</div>
        </div>
      </div>
    </div>
  )
}
