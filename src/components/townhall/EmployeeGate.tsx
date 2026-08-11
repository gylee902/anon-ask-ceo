import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import ciAsset from "@/assets/kolon-global-ci.png.asset.json";
import { gateStatus, gateVerify } from "@/lib/townhall-gate.functions";

export function EmployeeGate({ children }: { children: ReactNode }) {
  const status = useServerFn(gateStatus);
  const verify = useServerFn(gateVerify);

  const [verified, setVerified] = useState<boolean | null>(null);
  const [employeeNo, setEmployeeNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await status();
      setVerified(res.verified);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!employeeNo.trim()) return;
    setChecking(true);
    setError(null);
    try {
      const res = await verify({ data: { employeeNo } });
      if (!res.ok) {
        setError("등록되지 않은 사번입니다. 사번을 다시 확인해주세요.");
        return;
      }
      setVerified(true);
    } catch {
      setError("확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setChecking(false);
    }
  }

  if (verified === null) {
    return <div className="min-h-screen bg-background" />;
  }

  if (verified) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="brand-gradient relative overflow-hidden text-brand-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-brand-foreground/10 blur-3xl"
        />
        <div className="relative mx-auto flex w-full max-w-md flex-col items-center px-4 pb-20 pt-12 text-center sm:px-8 sm:pb-24 sm:pt-14">
          <img
            src={ciAsset.url}
            alt="코오롱글로벌 CI"
            className="h-7 w-auto sm:h-8"
            loading="eager"
          />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-foreground/60 sm:text-xs">
            CEO Town Hall
          </p>
          <h1 className="mt-3 text-xl font-bold leading-snug tracking-tight sm:text-2xl">
            사번을 입력하고
            <br />
            타운홀 사전 Q&amp;A에 참여해주세요
          </h1>
        </div>
      </div>

      <main className="relative z-10 mx-auto -mt-8 w-full max-w-md px-4 pb-14 sm:px-8">
        <form onSubmit={handleSubmit} className="card-surface p-5 pt-6 sm:p-6">
          <label htmlFor="employee-no" className="text-sm font-semibold text-foreground">
            사번
          </label>
          <input
            id="employee-no"
            value={employeeNo}
            onChange={(e) => {
              setEmployeeNo(e.target.value);
              setError(null);
            }}
            inputMode="numeric"
            autoComplete="off"
            placeholder="사번을 입력해주세요"
            className="mt-2 w-full rounded-lg border border-input bg-surface px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-ring/30"
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={checking || !employeeNo.trim()}
            className="mt-4 w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            {checking ? "확인 중..." : "입장하기"}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-4 text-xs leading-relaxed text-muted-foreground sm:px-5">
          본 페이지의 열람 및 작성 권한은 8/10자 임직원 명부 기준으로 생성되었습니다.
          <br />
          본 페이지의 접속이 안되는 경우 기업문화팀(02-3677-4353)으로 문의하시기 바랍니다.
        </div>
      </main>
    </div>
  );
}
