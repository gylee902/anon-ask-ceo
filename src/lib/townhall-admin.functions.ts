import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type AdminSession = { isAdmin?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "townhall-admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function matches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function requireAdmin() {
  const session = await useSession<AdminSession>(sessionConfig());
  if (!session.data.isAdmin) throw new Error("관리자 인증이 필요합니다.");
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env["TOWNHALL_ADMIN_PASSWORD"];
    if (!expected) throw new Error("관리자 비밀번호가 설정되지 않았습니다.");
    if (typeof data.password !== "string" || !matches(data.password, expected)) {
      return { ok: false as const };
    }
    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ isAdmin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  return { isAdmin: session.data.isAdmin === true };
});

export const adminListQuestions = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [questions, comments, likes] = await Promise.all([
    supabaseAdmin.from("questions").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("comments").select("*").order("created_at", { ascending: true }),
    supabaseAdmin.from("question_likes").select("question_id"),
  ]);
  if (questions.error) throw questions.error;
  if (comments.error) throw comments.error;
  if (likes.error) throw likes.error;
  return {
    questions: questions.data ?? [],
    comments: comments.data ?? [],
    likes: (likes.data ?? []).map((l) => l.question_id),
  };
});

export const adminUpdateQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; isAnswered?: boolean; isHidden?: boolean }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { is_answered?: boolean; is_hidden?: boolean } = {};
    if (typeof data.isAnswered === "boolean") patch.is_answered = data.isAnswered;
    if (typeof data.isHidden === "boolean") patch.is_hidden = data.isHidden;
    const { error } = await supabaseAdmin.from("questions").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export const adminUpdateComment = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; isHidden: boolean }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("comments")
      .update({ is_hidden: data.isHidden })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export const adminDeleteQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("questions").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });
