import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { BadgeCheck, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type LicenseDetails = {
  licenseId: string;
  type: string;
  expiresAt: string | null;
};

type LicenseStatus = {
  status: "active" | "unactivated" | "expired" | "invalid";
  license?: LicenseDetails;
};

const LICENSE_TYPES: Record<string, string> = {
  lifetime: "Lifetime",
  "1-year": "1 year",
  "6-months": "6 months",
  "30-days": "30 days",
  custom: "Custom expiration",
};

function ActivationScreen({
  initialStatus,
  onActivated,
}: {
  initialStatus: LicenseStatus;
  onActivated: (license: LicenseDetails) => void;
}) {
  const [serialKey, setSerialKey] = useState("");
  const [license, setLicense] = useState<LicenseDetails | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await window.desktop!.license.activate(serialKey);
      setLicense(result.license);
    } catch (activationError) {
      setError(
        activationError instanceof Error
          ? activationError.message
          : "Unable to verify this license key.",
      );
    } finally {
      setBusy(false);
    }
  }

  const message =
    initialStatus.status === "expired"
      ? "The saved license has expired. Enter a new license key to continue."
      : initialStatus.status === "invalid"
        ? "The saved license could not be verified. Enter a valid license key to continue."
        : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-7 shadow-xl sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {license ? (
            <BadgeCheck className="h-7 w-7" />
          ) : (
            <KeyRound className="h-7 w-7" />
          )}
        </div>
        {license ? (
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-foreground">
              License activated
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This license is saved on this computer and will be checked offline
              each time the app opens.
            </p>
            <dl className="my-7 space-y-3 rounded-xl border border-border bg-muted/50 p-4 text-left text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">License ID</dt>
                <dd className="font-medium">{license.licenseId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">
                  {LICENSE_TYPES[license.type] ?? license.type}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-emerald-700">Active</dd>
              </div>
              {license.expiresAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Expires</dt>
                  <dd className="font-medium">
                    {new Date(license.expiresAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
            <Button
              className="w-full"
              size="lg"
              onClick={() => onActivated(license)}
            >
              Continue
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-foreground">
                Activate your license
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the signed license key provided with your purchase.
              </p>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                License verification is performed locally. No account or
                internet connection is required.
              </p>
            </div>
            {message && (
              <p className="mt-4 text-sm text-destructive" role="status">
                {message}
              </p>
            )}
            <form className="mt-6 space-y-4" onSubmit={activate}>
              <label
                htmlFor="serial-key"
                className="block text-sm font-medium text-foreground"
              >
                Serial Key
              </label>
              <textarea
                id="serial-key"
                name="serialKey"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                rows={4}
                value={serialKey}
                onChange={(event) => setSerialKey(event.target.value)}
                placeholder="Paste your signed license key"
                aria-describedby={error ? "license-error" : undefined}
                aria-invalid={Boolean(error)}
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {error && (
                <p
                  id="license-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={busy || !serialKey.trim()}
              >
                {busy ? "Verifying…" : "Activate"}
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export function ActivationGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loadError, setLoadError] = useState("");
  const isElectron =
    typeof window !== "undefined" && Boolean(window.desktop?.license);

  useEffect(() => {
    if (!isElectron) return;
    let mounted = true;
    async function checkStatus() {
      try {
        const currentStatus = await window.desktop!.license.status();
        if (mounted) setStatus(currentStatus);
      } catch (error) {
        if (mounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to read the local license.",
          );
        }
      }
    }
    void checkStatus();
    const interval = window.setInterval(() => void checkStatus(), 60_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [isElectron]);

  if (!isElectron) return children;
  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p
          className="max-w-lg text-center text-sm text-destructive"
          role="alert"
        >
          Could not check the local license: {loadError}
        </p>
      </main>
    );
  }
  if (!status) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground" role="status">
          Checking license…
        </p>
      </main>
    );
  }
  if (status.status === "active") return children;
  return (
    <ActivationScreen
      initialStatus={status}
      onActivated={(license) => setStatus({ status: "active", license })}
    />
  );
}
