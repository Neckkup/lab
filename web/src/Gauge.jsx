import React from 'react';

const Gauge = ({ value = 0, label = '' }) => {
  const clampedValue = Math.max(0, Math.min(value, 100));
  const circumference = 2 * Math.PI * 45; // r = 45
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div style={{ textAlign: 'center', width: 120 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          stroke="#e6e6e6"
          fill="transparent"
          strokeWidth="10"
          r="45"
          cx="60"
          cy="60"
        />
        <circle
          stroke="#3498db"
          fill="transparent"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r="45"
          cx="60"
          cy="60"
          style={{
            transition: 'stroke-dashoffset 0.3s ease',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />
        <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="20" fill="#333">
          {`${clampedValue.toFixed(1)}%`}
        </text>
      </svg>
      <div style={{ marginTop: 8, fontSize: 14, fontWeight: 'bold' }}>{label}</div>
    </div>
  );
};

export default Gauge;
