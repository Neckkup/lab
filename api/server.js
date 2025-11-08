import express from "express";
import cors from "cors";
import axios from "axios";
import client from "prom-client";

const app = express();
app.use(cors());

const port = process.env.PORT || 4000;
const PROM = process.env.PROMETHEUS_BASE_URL || "http://prometheus:9090";

// --- Endpoints ---

// Endpoint สำหรับให้ Prometheus ดึง metric ของ API เอง
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).send(String(err));
  }
});

// [ใหม่] Endpoint สำหรับดึงรายชื่อเครื่อง (instance) ทั้งหมด
app.get("/api/instances", async (_req, res) => {
  try {
    const url = `${PROM}/api/v1/query`;
    const { data } = await axios.get(url, { params: { query: 'up{job="node"}' } });
    if (data.status !== "success" || !data.data || !data.data.result) {
      return res.json([]);
    }
    const instances = data.data.result.map(item => item.metric.instance);
    res.json(instances);
  } catch (e) {
    console.error("Error in /api/instances:", e);
    res.status(500).json({ error: "failed to query prometheus for instances", detail: String(e) });
  }
});


// --- Queries ---
const Q_CPU_PER_CORE = (instance) => `
  100 - (rate(node_cpu_seconds_total{mode="idle",instance="${instance}"}[1m]) * 100)
`;
const Q_MEM = (instance) => `
  100 * (1 - (node_memory_MemAvailable_bytes{instance="${instance}"} / node_memory_MemTotal_bytes{instance="${instance}"}))
`;
const Q_DISK = (instance) => `
  100 * (1 - (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay",instance="${instance}"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay",instance="${instance}"}))
`;

// --- Query Functions ---
async function queryCpuPerCore(instance) {
  const url = `${PROM}/api/v1/query`;
  const { data } = await axios.get(url, { params: { query: Q_CPU_PER_CORE(instance) } });
  if (data.status !== "success" || !data.data || !data.data.result) return {};
  
  const cpuData = {};
  for (const result of data.data.result) {
    const coreLabel = result.metric.cpu;
    const value = parseFloat(result.value?.[1] ?? "0");
    cpuData[`core${coreLabel}`] = Number(value.toFixed(2));
  }
  return cpuData;
}

async function instantQuery(query) {
  const url = `${PROM}/api/v1/query`;
  const { data } = await axios.get(url, { params: { query } });
  if (data.status !== "success" || !data.data || !data.data.result?.[0]) return null;
  const value = parseFloat(data.data.result[0].value?.[1] ?? "0");
  return Number(value.toFixed(2));
}

// --- Main Data Endpoint ---
app.get("/api/system", async (req, res) => {
  try {
    const { instance } = req.query;
    if (!instance) {
      return res.status(400).json({ error: "instance parameter is required" });
    }

    const now = new Date();
    const ts = now.toLocaleTimeString();

    const [cpu, mem, disk] = await Promise.all([
      queryCpuPerCore(instance),
      instantQuery(Q_MEM(instance)),
      instantQuery(Q_DISK(instance))
    ]);

    console.log(`Prometheus query for ${instance}:`, { cpu, mem, disk });

    res.json({
      cpu: [{ t: ts, ...cpu }],
      memory: [{ t: ts, value: mem || 0 }],
      disk: [{ t: ts, value: disk || 0 }]
    });
  } catch (e) {
    console.error("Error in /api/system:", e);
    res.status(500).json({ error: "failed to query prometheus", detail: String(e) });
  }
});


app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
