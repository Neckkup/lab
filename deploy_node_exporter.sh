#!/bin/bash

# ตรวจสอบว่า Docker ติดตั้งอยู่หรือไม่
if ! command -v docker &> /dev/null
then
    echo "Docker ไม่ได้ติดตั้งอยู่ กรุณาติดตั้ง Docker ก่อนดำเนินการต่อ"
    echo "ดูวิธีการติดตั้งได้ที่: https://docs.docker.com/engine/install/"
    exit 1
fi

echo "--- กำลังเตรียมการรัน Node Exporter ---"

# หยุดและลบ container เก่าของ node-exporter (ถ้ามี)
if docker ps -a --format '{{.Names}}' | grep -q "node-exporter"; then
    echo "พบ container 'node-exporter' เก่า กำลังหยุดและลบ..."
    docker stop node-exporter
    docker rm node-exporter
    echo "ลบ container เก่าเรียบร้อยแล้ว"
fi

# รัน Node Exporter ด้วย Docker
echo "กำลังรัน Node Exporter container..."
docker run -d \
  --name=node-exporter \
  --network="host" \
  --pid="host" \
  -v "/proc:/host/proc:ro" \
  -v "/sys:/host/sys:ro" \
  -v "/:/rootfs:ro" \
  prom/node-exporter:v1.8.2 \
  --path.procfs=/host/proc \
  --path.sysfs=/host/sys \
  --path.rootfs=/rootfs \
  --collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)

if [ $? -eq 0 ]; then
    echo "--- Node Exporter รันสำเร็จแล้ว! ---"
    echo "คุณสามารถตรวจสอบสถานะได้ที่ http://localhost:9100/metrics บนเครื่องนี้"
    echo ""
    echo "--- ขั้นตอนต่อไป: เพิ่มเครื่องนี้เข้า Prometheus ---"
    echo "1. ค้นหา IP Address ของเครื่องนี้ (เช่น ด้วยคำสั่ง 'ip a')"
    echo "2. บนเครื่องศูนย์กลาง (ที่รันโปรเจก Monitoring) ให้แก้ไขไฟล์ prometheus.yml"
    echo "   เพิ่ม IP Address ของเครื่องนี้ลงในส่วน 'targets' ของ 'job_name: \"node\"' เช่น:"
    echo "     - targets:"
    echo "         - \"YOUR_MACHINE_IP:9100\""
    echo "3. รีสตาร์ท Prometheus บนเครื่องศูนย์กลาง: sudo docker compose restart prometheus"
    echo ""
    echo "--- ข้อควรระวัง: Firewall ---"
    echo "หากเครื่องนี้มี Firewall (เช่น ufw, firewalld) คุณอาจต้องเปิด Port 9100"
    echo "ตัวอย่างสำหรับ ufw: sudo ufw allow 9100/tcp"
else
    echo "!!! เกิดข้อผิดพลาดในการรัน Node Exporter !!!"
fi
