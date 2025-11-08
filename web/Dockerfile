# ต้องขึ้นต้นด้วย FROM ubuntu ตามเงื่อนไข
FROM ubuntu:22.04

# ติดตั้ง dependencies ที่จำเป็นเพื่อ build และ serve React
# - curl เพื่อดึง NodeSource
# - nodejs, npm ใช้ build/serve
RUN apt-get update && apt-get install -y curl ca-certificates gnupg && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y nodejs && \
    npm i -g serve && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# คัดลอกไฟล์โปรเจค (ใช้ Vite หรือ CRA ก็ได้ ตัวอย่างนี้ใช้ Vite + React)
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# สร้างไฟล์ .env สำหรับชี้ไปที่ API (สามารถ override ด้วย ENV ได้ใน compose)
ENV VITE_API_URL=/api
RUN npm run build

# เปิดพอร์ตเว็บ (เราจะ map 8080->3000 ใน compose)
EXPOSE 3000

# เสิร์ฟไฟล์ static ที่ build แล้ว
CMD ["serve", "-s", "dist", "-l", "3000"]
