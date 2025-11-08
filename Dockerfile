# กำหนด Image พื้นฐานที่จะใช้สร้าง Image ของเรา ในที่นี้คือ Ubuntu 22.04
FROM ubuntu:22.04

# กำหนด Working Directory หรือโฟลเดอร์หลักที่จะทำงานภายใน Container
WORKDIR /app

# ติดตั้งโปรแกรมที่จำเป็นสำหรับการ Build และรันโปรเจก
# RUN คือคำสั่งสำหรับรัน command line ในระหว่างการสร้าง Image
RUN apt-get update && apt-get install -y curl ca-certificates gnupg && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*


# เปลี่ยน Working Directory ไปที่ /app/api
WORKDIR /app/api

# คัดลอกไฟล์ package.json และ package-lock.json ของ API เข้าไปก่อน
COPY api/package.json api/package-lock.json* ./

# ติดตั้ง Dependencies ของ API (ไม่รวม devDependencies)
RUN npm install --omit=dev

# คัดลอกไฟล์โค้ดทั้งหมดของ API เข้าไป
COPY api/ .

# เปลี่ยน Working Directory ไปที่ /app/web
WORKDIR /app/web

# คัดลอกไฟล์ package.json และ package-lock.json ของ Web เข้าไป
COPY web/package.json web/package-lock.json* ./

# ติดตั้ง Dependencies ทั้งหมดของ Web
RUN npm install

# คัดลอกไฟล์โค้ดทั้งหมดของ Web เข้าไป
COPY web/ .

# ตั้งค่า VITE_API_URL เพื่อให้โค้ด Frontend รู้ว่า API endpoint คือ /api
ENV VITE_API_URL=/api

# รันคำสั่ง build เพื่อสร้างไฟล์ static ของ React app
RUN npm run build

# กลับมาที่ Working Directory หลัก
WORKDIR /app

# ติดตั้ง 'serve' ซึ่งเป็น web server ขนาดเล็กสำหรับรันไฟล์ static ที่ build เสร็จแล้ว
RUN npm install -g serve

# คัดลอกไฟล์ start.sh จาก Host เข้ามาใน Image
COPY start.sh .

# ให้สิทธิ์ในการรัน (executable permission) กับไฟล์ start.sh
RUN chmod +x ./start.sh

# EXPOSE คือการประกาศว่า Container นี้จะเปิด Port อะไรบ้าง (เพื่อการสื่อสารภายใน Docker)
EXPOSE 4000 3000

# CMD คือคำสั่งที่จะรันเมื่อ Container เริ่มทำงาน (มีได้แค่คำสั่งเดียวใน Dockerfile)
CMD ["./start.sh"]
