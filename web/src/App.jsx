import React, { useEffect, useState, useMemo } from "react";
import Gauge from './Gauge';
import MetricChart from './MetricChart';
import CpuChart from './CpuChart'; // Import component ใหม่

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const MAX_DATA_POINTS = 120; // แสดงข้อมูล 120 จุด (10 นาที)

export default function App() {
  const [data, setData] = useState({ cpu: [], memory: [], disk: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/system`);
        const json = await res.json();
        
        setData(prevData => ({
          cpu: [...prevData.cpu, ...json.cpu].slice(-MAX_DATA_POINTS),
          memory: [...prevData.memory, ...json.memory].slice(-MAX_DATA_POINTS),
          disk: [...prevData.disk, ...json.disk].slice(-MAX_DATA_POINTS),
        }));
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, []);

  const metrics = useMemo(() => ([
    { key: "cpu", label: "CPU Usage" },
    { key: "memory", label: "Memory Usage" },
    { key: "disk", label: "Disk Usage" }
  ]), []);

  if (loading) {
    return (
      <div style={{ fontFamily: "sans-serif", padding: 24, textAlign: 'center' }}>
        <h1>Loading Dashboard...</h1>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <header style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1>DevOps Monitor Dashboard</h1>
        <p>Real-time metrics from Prometheus via Node API</p>
      </header>

      {metrics.map(({ key, label }) => {
        const currentData = data[key];
        let currentValue = 0;
        
        if (currentData.length > 0) {
          const lastDataPoint = currentData[currentData.length - 1];
          if (key === 'cpu') {
            // คำนวณค่าเฉลี่ยของ CPU ทุก core สำหรับ Gauge
            const coreValues = Object.keys(lastDataPoint)
              .filter(k => k.startsWith('core'))
              .map(k => lastDataPoint[k]);
            currentValue = coreValues.length > 0 ? coreValues.reduce((a, b) => a + b, 0) / coreValues.length : 0;
          } else {
            currentValue = lastDataPoint.value;
          }
        }
        
        return (
          <div key={key} style={{ 
            border: '1px solid #eee', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 32,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ marginBottom: 24, textAlign: 'center' }}>{label}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Gauge value={currentValue} label={key === 'cpu' ? 'Average' : 'Current'} />
              {key === 'cpu' ? (
                <CpuChart data={currentData} />
              ) : (
                <MetricChart data={currentData} label={`${label} (%)`} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
