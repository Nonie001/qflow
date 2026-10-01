import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/language-provider";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { RemoveLegacyPush } from "@/components/customer/remove-legacy-push";
import { getLocale } from "@/lib/i18n-server";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "ms" ? "QFlow | Bina Islamic Cooperative" : "QFlow | สหกรณ์อิสลามบีนา จำกัด",
    description: locale === "ms" ? "Tempah dan semak giliran di Bina Islamic Cooperative" : "ระบบรับคิวและติดตามสถานะคิวของสหกรณ์อิสลามบีนา จำกัด",
    icons: { icon: "/bina-logo.jpg" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale === "ms" ? "ms-MY" : "th"} className={`${prompt.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLocale={locale}>
          <RealtimeRefresh supabaseUrl={process.env.SUPABASE_URL ?? ""} />
          <RemoveLegacyPush />
          {children}
          <Toaster richColors position="top-center" />
        </LanguageProvider>
      </body>
    </html>
  );
}
