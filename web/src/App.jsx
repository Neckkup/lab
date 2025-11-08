import React, { useEffect, useState, useMemo } from "react";
import Gauge from './Gauge';
import MetricChart from './MetricChart';
import CpuChart from './CpuChart';

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const MAX_DATA_POINTS = 120;

export default function App() {
  const [data, setData] = useState({ cpu: [], memory: [], disk: [] });
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. ดึงรายชื่อเครื่องทั้งหมดเมื่อ component โหลด
  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const res = await fetch(`${API_BASE}/instances`);
        const json = await res.json();
        setInstances(json);
        if (json.length > 0) {
          setSelectedInstance(json[0]); // เลือกเครื่องแรกเป็น default
        }
        setLoading(false);
      } catch (e) {
        console.error("Failed to fetch instances", e);
        setLoading(false);
      }
    };
    fetchInstances();
  }, []);

  // 2. ดึงข้อมูล metrics เมื่อมีการเลือกเครื่อง
  useEffect(() => {
    if (!selectedInstance) return;

    // รีเซ็ตข้อมูลเมื่อเปลี่ยนเครื่อง
    setData({ cpu: [], memory: [], disk: [] });

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/system?instance=${selectedInstance}`);
        const json = await res.json();
        
        setData(prevData => ({
          cpu: [...prevData.cpu, ...json.cpu].slice(-MAX_DATA_POINTS),
          memory: [...prevData.memory, ...json.memory].slice(-MAX_DATA_POINTS),
          disk: [...prevData.disk, ...json.disk].slice(-MAX_DATA_POINTS),
        }));
      } catch (e) {
        console.error(`Failed to fetch metrics for ${selectedInstance}`, e);
      }
    };
    
    fetchMetrics(); // ดึงข้อมูลครั้งแรกทันที
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id); // clear interval เมื่อ component unmount หรือ selectedInstance เปลี่ยน
  }, [selectedInstance]);

  const metrics = useMemo(() => ([
    { key: "cpu", label: "CPU Usage" },
    { key: "memory", label: "Memory Usage" },
    { key: "disk", label: "Disk Usage" }
  ]), []);

  const handleInstanceChange = (e) => {
    setSelectedInstance(e.target.value);
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "sans-serif", padding: 24, textAlign: 'center' }}>
        <h1>Loading Dashboard...</h1>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 1200, margin: 'auto' }}>
      <header style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1>Monitor Dashboard</h1>
        <p>Real-time metrics from Prometheus via Node API</p>
      </header>

      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <label htmlFor="instance-select" style={{ marginRight: 8, fontWeight: 'bold' }}>Select Instance:</label>
        <select id="instance-select" value={selectedInstance} onChange={handleInstanceChange} style={{ padding: 8, fontSize: 16 }}>
          {instances.map(inst => (
            <option key={inst} value={inst}>{inst}</option>
          ))}
        </select>
      </div>

      {!selectedInstance && <p style={{ textAlign: 'center' }}>Please select an instance to view metrics.</p>}

      {selectedInstance && metrics.map(({ key, label }) => {
        const currentData = data[key];
        let currentValue = 0;
        
        if (currentData.length > 0) {
          const lastDataPoint = currentData[currentData.length - 1];
          if (key === 'cpu') {
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
