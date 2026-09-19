import "server-only";

/** Only the Next.js server holds the Apps Script credential. Never retry writes
 * automatically: a timeout can occur after Google has committed the operation. */
export async function sheets<T>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const key = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!url || !key) throw new Error("กรุณาตั้งค่า Google Sheets ตาม README ก่อนใช้งาน");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, action, args }),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
    redirect: "follow",
  });
  if (!response.ok) throw new Error("เชื่อมต่อ Google Sheets ไม่สำเร็จ");
  let result: { ok: boolean; data: T; error?: string };
  try { result = await response.json(); }
  catch { throw new Error("Apps Script ไม่ได้ส่ง JSON กลับมา กรุณาตรวจการ Deploy และสิทธิ์เข้าถึง"); }
  if (!result.ok) throw new Error(result.error || "Google Sheets request failed");
  return result.data;
}
