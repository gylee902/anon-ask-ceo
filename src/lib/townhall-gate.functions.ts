import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

type GateSession = { verified?: boolean };

function gateSessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "townhall-gate",
    maxAge: 60 * 60 * 24 * 180, // 180일 (반기 동안 재입력 없이 접속)
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function normalizeEmployeeNo(input: string) {
  return input.trim().replace(/\s+/g, "");
}

export const gateStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<GateSession>(gateSessionConfig());
  return { verified: session.data.verified === true };
});

export const gateVerify = createServerFn({ method: "POST" })
  .inputValidator((data: { employeeNo: string }) => data)
  .handler(async ({ data }) => {
    const employeeNo = normalizeEmployeeNo(data.employeeNo ?? "");
    if (!employeeNo) return { ok: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("authorized_employees")
      .select("id")
      .eq("employee_no", employeeNo)
      .limit(1);
    if (error) throw error;

    if (!rows || rows.length === 0) return { ok: false as const };

    const session = await useSession<GateSession>(gateSessionConfig());
    await session.update({ verified: true });
    return { ok: true as const };
  });
