# QFlow

ระบบรับคิวสำหรับสาขาเดียว ใช้ Next.js 16, React 19 และ Google Sheets ผ่าน Google Apps Script ไม่มี dependency หรือบริการ Supabase

## เริ่มใช้งาน

1. ใช้ Node.js 22 ขึ้นไป แล้วรัน `npm install`
2. สร้าง Google Sheet ส่วนตัวสำหรับ QFlow โดยเฉพาะ ไม่ต้องแชร์ให้ลูกค้า และไม่ต้อง Publish to web
3. เปิด Extensions → Apps Script แล้ววางโค้ดจาก `google-apps-script/Code.gs`
4. ใน Project Settings → Script Properties ตั้งค่า:
   - `SPREADSHEET_ID`: ส่วนระหว่าง `/d/` และ `/edit` ใน URL ของชีต
   - `API_SECRET`: ค่าสุ่มอย่างน้อย 32 ตัวอักษร สร้างด้วย `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
5. ตั้ง timezone เป็น Asia/Bangkok และใช้ V8 runtime (มี manifest ตัวอย่างที่ `google-apps-script/appsscript.json`)
6. เลือกฟังก์ชัน `setup` แล้วกด Run และอนุญาตการเข้าถึง Sheets สคริปต์จะสร้างแท็บและบริการตัวอย่าง รันซ้ำได้โดยไม่ลบข้อมูลเดิม
7. Deploy → New deployment → Web app → Execute as **Me**, Who has access **Anyone** แล้วคัดลอก URL ที่ลงท้าย `/exec` ทุกคำขอต้องมี secret ที่ส่งจาก Next.js server จึงอ่าน/เขียนได้ หากองค์กรไม่อนุญาต deployment แบบนี้ต้องให้ผู้ดูแล Google Workspace เปิดสิทธิ์ก่อน
8. คัดลอก `.env.example` เป็น `.env.local` ตั้ง `GOOGLE_APPS_SCRIPT_URL` และ `GOOGLE_APPS_SCRIPT_SECRET` ให้ตรงกับ deployment และ `API_SECRET`
9. สร้าง `SESSION_SECRET` ด้วยคำสั่งสุ่มด้านบนอีกครั้ง ใช้คนละค่ากับ API secret
10. ตั้งบัญชีแอดมินหนึ่งบัญชีใน `.env.local` เช่น `ADMIN_USERNAME=admin` และ `ADMIN_PASSWORD=1234` ควรเปลี่ยนเป็นรหัสที่คาดเดายากก่อนนำขึ้นใช้งานจริง
11. รัน `npm run dev` แล้วเปิด http://localhost:3000

เมื่อ deploy เว็บจริง ให้ตั้ง environment variables เดียวกันบน hosting และใช้ HTTPS สำหรับ session cookies และ Web Push เมื่อแก้ Apps Script ให้ Deploy → Manage deployments → Edit → New version → Deploy โดยคง URL เดิม

## หน้าการใช้งาน

- `/` และ `/queue`: ลูกค้ากรอกชื่อและเลือกบริการเพื่อรับคิว ไม่มีเมนูส่วนเจ้าหน้าที่
- `/queue/[id]`: ดูคิวของตนเอง ต้องใช้เบราว์เซอร์ที่รับคิว มีคุกกี้ HttpOnly ลงลายเซ็นอายุ 48 ชั่วโมง การส่ง URL ให้คนอื่นจะไม่ให้สิทธิ์ดูคิว
- `/staff/login`: ล็อกอินเจ้าหน้าที่และ admin
- `/admin/call`: เรียก/เรียกซ้ำ/เริ่ม/จบ/ข้ามคิวภายในหน้าแอดมิน
- `/admin`: รายงานวันนี้ จัดการบริการ และดูคิวทั้งหมด
- `/display`: จอ TV ต้องล็อกอิน staff/admin บนอุปกรณ์นั้นก่อน

ระบบมีบัญชีแอดมินจาก environment เพียงบัญชีเดียว รหัสผ่านไม่ถูกส่งไปฝั่ง client และไม่เก็บในชีต Session อายุ 8 ชั่วโมง เมื่อเปลี่ยนชื่อผู้ใช้หรือรหัสผ่านใน environment แล้ว session เดิมจะใช้ไม่ได้ การล็อกอินจำกัด 10 ครั้งต่อชื่อผู้ใช้ในช่วงพัก 15 นาทีด้วย Apps Script CacheService (เป็นการจำกัดแบบ best effort เพราะ Google อาจล้าง cache ก่อนกำหนด) รหัส `1234` เหมาะสำหรับทดสอบในเครื่องเท่านั้น ก่อนเปิดเว็บสาธารณะควรใช้รหัสที่คาดเดายากและตั้ง rate limit เพิ่มที่ hosting/WAF

## ข้อมูลและการอัปเดต

แท็บ `services`, `counters`, `queues`, `push_subscriptions`, `notifications` สร้างโดย `setup()` ห้ามเปลี่ยนหัวคอลัมน์/ลบแถวคิว/แก้คิวด้วยมือขณะระบบทำงาน ให้จัดการผ่านเว็บเพื่อให้ทุกการเขียนผ่าน ScriptLock เดียวกัน เมื่ออัปเดตจากรุ่นเดิมให้รัน `setup()` อีกครั้งเพื่อเพิ่มคอลัมน์ชื่อผู้รับบริการโดยไม่ลบข้อมูลเดิม ตัวเลขคิวแยกตามบริการและวันไทย การเรียกคิวรวมเรียงตามเวลามาถึง ช่องหนึ่งมีคิวที่กำลังเรียก/ให้บริการได้ครั้งละหนึ่งคิว

หน้าเจ้าหน้าที่ จอ TV และหน้าคิวลูกค้าตรวจอัปเดตทุก 10 วินาทีเฉพาะแท็บที่เปิดอยู่ ความหน่วงจริงขึ้นกับ Google Apps Script และเครือข่าย ไม่ใช่ realtime websocket หน้าลูกค้าแจ้งเตือนเมื่ออัปเดตไม่สำเร็จ ส่วนรายงาน admin โหลดใหม่เมื่อเปิด/รีเฟรชหน้า

การรับคิวมี request ID สำหรับ retry คำขอเดิมภายในหน้าที่เปิดอยู่ จึงไม่ออกคิวซ้ำเมื่อคำขอแรกสำเร็จแต่การตอบกลับขาดหาย การเรียกคิวซ้ำที่ช่องเดิมจะคืนคิวที่ยังให้บริการอยู่ การเขียน Sheets หลายครั้งไม่ใช่ transaction แบบฐานข้อมูล จึงควรสำรองชีตและไม่ใช้กับภาระงานสูงโดยไม่ทดสอบปริมาณงานจริง

Next.js เท่านั้นที่เรียก Apps Script; secret ไม่ส่งไป browser ไม่มี API สาธารณะสำหรับอ่านตารางคิวทั้งหมด ไม่มี automatic retry สำหรับคำสั่งเขียน เพื่อหลีกเลี่ยงการเขียนซ้ำหลัง timeout

## Push notifications (ไม่บังคับ)

รัน `npx web-push generate-vapid-keys` แล้วใส่ค่าลง environment ก่อน build เว็บ เมื่อลูกค้ารับคิวแล้วเปิดการแจ้งเตือน ระบบบันทึก subscription ในชีต รองรับหลายคิวต่อ browser endpoint และส่งแจ้งเตือนรับคิว/ใกล้ถึงคิว/ถูกเรียก การเรียกซ้ำประกาศบนจอ TV แต่ไม่ส่ง Push ซ้ำ Push เป็น best effort; การส่งล้มเหลวไม่ย้อนหรือทำให้คำสั่งคิวที่สำเร็จแล้วแสดงว่าล้มเหลว ไม่มี background worker สำหรับ retry หลังเซิร์ฟเวอร์หยุดทำงาน

## การตรวจสอบ

```sh
npm run lint
npm run test
npx tsc --noEmit --incremental false
npm run build
```

ชุดทดสอบใช้ Apps Script/Sheets จำลองในหน่วยความจำ ครอบคลุมเลขคิว การ retry การเรียกคิวและเปลี่ยนสถานะ สิทธิ์ secret และ signed token ต้องทดสอบ deployment Google จริงอีกครั้งก่อนเปิดใช้งาน ไม่มีการย้ายข้อมูลจากระบบเก่าอัตโนมัติ

เอกสาร Google: [Web Apps](https://developers.google.com/apps-script/guides/web), [LockService](https://developers.google.com/apps-script/reference/lock), [Script Properties](https://developers.google.com/apps-script/guides/properties), [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas)
