import express from "express";
import cors from "cors";
import axios from "axios";
import client from "prom-client";

const app = express();
app.use(cors());

const port = process.env.PORT || 4000;
const PROM = process.env.PROMETHEUS_BASE_URL || "http://prometheus:9090";

// ---------- /metrics (metrics ของ API เอง) ----------
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).send(String(err));
  }
});

// ---------- /api/system (ดึงข้อมูลจาก Prometheus) ----------
const Q_CPU_PER_CORE = `
  100 - (rate(node_cpu_seconds_total{mode="idle"}[1m]) * 100)
`;
const Q_MEM = `
  100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))
`;
const Q_DISK = `
  100 * (1 - (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"}))
`;

async function queryCpuPerCore() {
  const url = `${PROM}/api/v1/query`;
  const { data } = await axios.get(url, { params: { query: Q_CPU_PER_CORE } });
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

app.get("/api/system", async (_req, res) => {
  try {
    const now = new Date();
    const ts = now.toLocaleTimeString();

    const [cpu, mem, disk] = await Promise.all([
      queryCpuPerCore(),
      instantQuery(Q_MEM),
      instantQuery(Q_DISK)
    ]);

    console.log('Prometheus query result:', { cpu, mem, disk });

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
