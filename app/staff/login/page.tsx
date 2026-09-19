import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/staff/login-form";

export default function StaffLoginPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users className="size-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">QFlow เจ้าหน้าที่</h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-base font-medium text-muted-foreground">
            เข้าสู่ระบบเพื่อเรียกคิว
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
