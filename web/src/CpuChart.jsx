import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// สีสำหรับกราฟแต่ละเส้น
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const CpuChart = ({ data }) => {
  // ดึง key ของแต่ละ core จากข้อมูลล่าสุด (เช่น 'core0', 'core1')
  const coreKeys = data.length > 0 ? Object.keys(data[data.length - 1]).filter(k => k.startsWith('core')) : [];

  return (
    <div style={{ height: 280, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          {coreKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={`CPU ${key.replace('core', '')}`}
              stroke={COLORS[index % COLORS.length]}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CpuChart;
