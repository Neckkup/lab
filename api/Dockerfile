# ใช้ Node.js 20 Alpine เป็น base image
FROM node:20-alpine

# กำหนด working directory ภายใน container
WORKDIR /app

# คัดลอกไฟล์ package.json และ package-lock.json
COPY package.json package-lock.json* ./

# ติดตั้ง dependencies (ใช้ --omit=dev เพื่อไม่ติดตั้ง devDependencies ใน production)
RUN npm install --omit=dev

# คัดลอกไฟล์ซอร์สโค้ดทั้งหมด
COPY . .

# เปิดพอร์ตที่ API จะใช้งาน
EXPOSE 4000

# คำสั่งที่จะรันเมื่อ container เริ่มทำงาน
CMD ["npm", "start"]
