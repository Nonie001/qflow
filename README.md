# Bina Queue

ระบบจองและเรียกคิวของสหกรณ์อิสลามบีนา จำกัด สร้างด้วย Next.js 16 และ Supabase PostgreSQL ลูกค้าเปิดหน้าเว็บจากริชเมนู LINE OA เพื่อจองคิวล่วงหน้าได้ 30 วัน เจ้าหน้าที่เรียกคิวและเปิดจอ TV จากเว็บเดียวกัน

## เริ่มใช้งานกับ Supabase

1. สร้างโปรเจกต์ใน [Supabase](https://supabase.com/dashboard) แล้วเปิด **SQL Editor** รันไฟล์ [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql), [`supabase/migrations/002_api.sql`](supabase/migrations/002_api.sql), [`supabase/migrations/003_counter_services.sql`](supabase/migrations/003_counter_services.sql) และ [`supabase/migrations/004_realtime.sql`](supabase/migrations/004_realtime.sql) ตามลำดับ โค้ดนี้สร้างตาราง คำสั่ง API และสัญญาณ Realtime สำหรับระบบคิว
2. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` จากโปรเจกต์ Supabase รวมทั้ง `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` ข้อมูลคิวถูกเรียกผ่าน Next.js server เท่านั้น ส่วน publishable key ใช้สมัครรับสัญญาณ Realtime ในเบราว์เซอร์
3. หากต้องการใช้ PostgreSQL โดยตรงแทน API สามารถตั้ง `DATABASE_URL` จากเมนู **Connect** ใน Supabase ได้ ระบบจะเลือกการเชื่อมต่อแบบนี้ก่อนเมื่อมีตัวแปรดังกล่าว
4. รัน `npm install` และ `npm run db:check` เพื่อเช็กการเชื่อมต่อและตาราง แล้วรัน `npm run dev` เปิด http://localhost:3000
5. เข้าสู่ระบบที่ `/staff/login` แล้วเพิ่มบริการและช่องบริการใน `/admin/services` เลือกบริการที่แต่ละช่องรับได้ก่อนเริ่มเรียกคิว ช่องเดิมที่มีอยู่ก่อน migration 003 จะรับทุกบริการเดิมจนกว่าจะปรับการตั้งค่า

หากใช้ `.env.local` เดิม ให้เพิ่มตัวแปร Supabase ที่ขาดเข้าไป เมื่อ Deploy เว็บจริงให้ตั้ง `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` บน hosting และ build ใหม่ด้วย ข้อมูลบริการ ช่องบริการ และคิวเก็บใน Supabase

## หน้าใช้งาน

- `/` และ `/queue`: ลูกค้ากรอกชื่อ เลือกบริการและวันภายใน 30 วันเพื่อรับคิว
- `/queue/[id]`: หน้าคิวส่วนตัว เปิดได้เฉพาะเบราว์เซอร์ที่มีคุกกี้คิวซึ่งลงลายเซ็นไว้ หรือเจ้าหน้าที่ที่ล็อกอิน และบันทึกบัตรคิวเป็นภาพ PNG ได้
- `/staff/login`: เข้าสู่ระบบแอดมินด้วยบัญชีใน environment
- `/admin/call`: เรียก เริ่มบริการ จบ ข้าม หรือเรียกซ้ำ
- `/admin/services`: จัดการบริการและช่องบริการ
- `/admin/queues`: คิววันนี้และคิวจองล่วงหน้า
- `/display`: จอ TV สำหรับเจ้าหน้าที่ แสดงเลขคิว ชื่อผู้รับบริการ และช่องบริการ
- `/about`: ข้อมูลสหกรณ์

เมื่อบริการ ช่องบริการ หรือคิวเปลี่ยน ฐานข้อมูลส่งสัญญาณ Realtime ให้หน้าเว็บโหลดข้อมูลล่าสุดทันที โดยสัญญาณมีเพียงชนิดข้อมูลที่เปลี่ยน ไม่มีข้อมูลลูกค้า หากการเชื่อมต่อหลุด จอ TV และหน้าเรียกคิวตรวจข้อมูลทุก 2 วินาที ส่วนหน้าแอดมินอื่น หน้าเลือกบริการ และหน้าคิวลูกค้าตรวจทุก 5 วินาที เมื่อกลับมาเปิดแท็บ ระบบจะดึงข้อมูลทันที PostgreSQL ใช้ transaction และ row lock เพื่อให้การออกเลขคิวต่อบริการ/วันไม่ซ้ำ และไม่ให้สองช่องเรียกคิวเดียวกันพร้อมกัน ความเร็วจริงขึ้นกับ hosting และตำแหน่งที่ตั้งของ Supabase ด้วย

## ใช้จาก LINE Official Account

นำเว็บขึ้น HTTPS แล้วตั้งริชเมนู LINE OA ให้เปิด `https://โดเมนของคุณ/queue` หรือเพิ่มเมนูเกี่ยวกับสหกรณ์ไปที่ `/about` รูปแบบนี้เปิดหน้าเว็บโดยตรง ไม่ต้องใช้ LIFF หรือ LINE Login การติดตามคิวต้องใช้เบราว์เซอร์เดิมที่รับคิว หากกดเมนูรับคิวอีกครั้งจะมีลิงก์กลับไปยังคิวล่าสุด

## ความปลอดภัย

`SUPABASE_SERVICE_ROLE_KEY` หรือ `DATABASE_URL` เป็นค่าฝั่ง server ห้ามใส่ในตัวแปร `NEXT_PUBLIC_` ตารางเปิด RLS และไม่มี policy สำหรับ anon; หน้าเว็บอ่านข้อมูลผ่าน server action ที่ตรวจสิทธิ์ก่อน บัญชีแอดมินมีหนึ่งบัญชีจาก environment session อายุ 8 ชั่วโมงและเปลี่ยนรหัสผ่านแล้ว session เก่าจะใช้ไม่ได้ การลองล็อกอินจำกัด 10 ครั้งต่อชื่อผู้ใช้ในช่วง 15 นาทีด้วยตาราง `login_attempts`

## ตรวจสอบ

```sh
npm run lint
npm test
npx tsc --noEmit
npm run build
```

ชุดทดสอบตรวจ schema PostgreSQL และกติกาคิวด้วยฐานข้อมูลจำลองในเครื่อง ควรทดสอบคำสั่งจอง เรียก และเปลี่ยนสถานะกับโปรเจกต์ Supabase จริงก่อนเปิดใช้งานกับสมาชิก
