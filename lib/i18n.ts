export type Locale = "th" | "ms";

export const LOCALE_COOKIE = "qflow_locale";

export function parseLocale(value: string | undefined): Locale {
  return value === "ms" ? "ms" : "th";
}

/** Thai is the source language. Malay uses standard Rumi spelling. */
export function translate(locale: Locale, thai: string, malay: string): string {
  return locale === "ms" ? malay : thai;
}

export function formatDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ms" ? "ms-MY" : "th-TH", {
    timeZone: "UTC", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatTime(iso: string | null, locale: Locale): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat(locale === "ms" ? "ms-MY" : "th-TH", {
    timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  th: { waiting: "รอเรียก", called: "ถูกเรียกแล้ว", serving: "กำลังให้บริการ", completed: "เสร็จสิ้น", skipped: "ข้ามคิว", cancelled: "ยกเลิก" },
  ms: { waiting: "Menunggu", called: "Telah dipanggil", serving: "Sedang dilayan", completed: "Selesai", skipped: "Dilangkau", cancelled: "Dibatalkan" },
};

/** Translate the built-in default labels; custom database names are displayed as entered. */
export function localizeName(name: string | null | undefined, locale: Locale): string {
  if (!name) return "-";
  if (locale === "th") return name;
  if (name === "บริการทั่วไป") return "Perkhidmatan am";
  const counter = /^ช่อง\s*(\d+)$/.exec(name);
  if (counter) return `Kaunter ${counter[1]}`;
  return name;
}

const ERROR_MS: Record<string, string> = {
  "เลือกวันที่ภายใน 30 วันนับจากวันนี้": "Pilih tarikh dalam tempoh 30 hari dari hari ini",
  "กรุณากรอกชื่อไม่เกิน 100 ตัวอักษร": "Sila masukkan nama sehingga 100 aksara",
  "บริการนี้ไม่เปิดให้รับคิว": "Perkhidmatan ini tidak menerima tempahan",
  "กรุณาเลือกบริการที่ช่องนี้รับ": "Pilih sekurang-kurangnya satu perkhidmatan untuk kaunter ini",
  "บริการที่เลือกไม่เปิดใช้งาน": "Perkhidmatan yang dipilih tidak aktif",
  "ข้อมูลช่องเรียกคิวไม่ถูกต้อง": "Maklumat kaunter tidak sah",
  "ไม่พบช่องเรียกคิว": "Kaunter tidak ditemui",
  "กรุณารันไฟล์ migration 001–003 ใน Supabase SQL Editor": "Jalankan fail migration 001–003 dalam Supabase SQL Editor",
  "ไม่พบคิวหรือไม่มีสิทธิ์เข้าถึง กรุณาเปิดจากเบราว์เซอร์ที่รับคิว": "Giliran tidak ditemui atau akses tidak dibenarkan. Buka dengan pelayar yang digunakan untuk tempahan",
  "ไม่มีสิทธิ์เข้าถึงคิวนี้": "Anda tidak dibenarkan mengakses giliran ini",
  "เชื่อมต่อ Supabase ไม่สำเร็จ": "Gagal menyambung ke Supabase",
  "ข้อมูลไม่ถูกต้อง": "Maklumat tidak sah",
  "รหัสข้อมูลไม่ถูกต้อง": "ID tidak sah",
  "ไม่พบคิว": "Giliran tidak ditemui",
  "ไม่พบคิววันนี้": "Tiada giliran hari ini",
  "ช่องบริการไม่เปิดใช้งาน": "Kaunter tidak aktif",
  "สถานะคิวไม่รองรับคำสั่งนี้": "Status giliran tidak menyokong tindakan ini",
  "มีประวัติคิวอ้างอิงอยู่ กรุณาปิดใช้งานแทนการลบ": "Terdapat sejarah giliran berkaitan. Sila nyahaktifkan dan jangan padam",
  "ข้อมูลซ้ำ กรุณาลองใหม่หรือตรวจชื่อและตัวอักษรนำหน้าคิว": "Data pendua. Semak nama dan awalan giliran, kemudian cuba lagi",
  "รหัสผ่านแอดมินไม่ถูกต้อง": "Kata laluan pentadbir tidak betul",
  "ลบข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ Supabase แล้วลองใหม่": "Gagal memadam data. Semak sambungan Supabase dan cuba lagi",
  "ใช้ตัวอักษร A-Z จำนวน 1–2 ตัว": "Gunakan satu atau dua huruf A-Z",
  "กรุณาตั้งค่า DATABASE_URL ของ Supabase ตาม README ก่อนใช้งาน": "Sediakan DATABASE_URL Supabase mengikut README sebelum digunakan",
  "กรุณาตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY": "Sediakan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY",
  "กรุณารัน supabase/migrations/001_initial.sql และ 002_api.sql ใน Supabase SQL Editor": "Jalankan migrasi 001_initial.sql dan 002_api.sql dalam Supabase SQL Editor",
  "ยังไม่ได้สร้างตาราง Supabase กรุณารัน supabase/migrations/001_initial.sql": "Jadual Supabase belum dibuat. Jalankan migrasi 001_initial.sql",
  "Record not found": "Rekod tidak ditemui",
  "Request already used": "Permintaan ini telah digunakan",
  "Too many attempts. Try again in 15 minutes.": "Terlalu banyak percubaan. Cuba lagi dalam 15 minit",
};

export function localizeError(message: string, locale: Locale): string {
  return locale === "ms" ? ERROR_MS[message] ?? message : message;
}
