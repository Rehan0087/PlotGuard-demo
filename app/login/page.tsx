"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Loader2, LogIn, User, Building2, MapPin, Scale, Shield } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LanguageToggle } from "@/components/shell/language-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useT } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n";
import { useSessionStore } from "@/store/session";
import { roleHome } from "@/lib/nav";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, verifyDemoCredentials } from "@/lib/demo-accounts";
import type { LoginFailure, DemoAccount } from "@/lib/demo-accounts";
import type { Role } from "@/lib/types";

function makeSchema(t: Dictionary) {
  return z.object({
    email: z.string().min(1, t.common.required).email(t.login.errorTitle),
    password: z.string().min(1, t.common.required),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

const ROLE_ICONS: Record<Role, any> = {
  citizen: User,
  "land-office": Building2,
  "field-agent": MapPin,
  mediator: Scale,
  admin: Shield,
};

function LoginFormContent() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as Role | null;

  const login = useSessionStore((s) => s.login);
  const role = useSessionStore((s) => s.role);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const hasHydrated = useSessionStore((s) => s.hasHydrated);
  const [failure, setFailure] = useState<LoginFailure | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(makeSchema(t)),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace(roleHome(role));
    }
  }, [hasHydrated, isAuthenticated, role, router]);

  // Pre-fill role from URL query param if present
  useEffect(() => {
    if (roleParam) {
      const match = DEMO_ACCOUNTS.find((a) => a.role === roleParam);
      if (match) {
        setValue("email", match.email);
        setValue("password", DEMO_PASSWORD);
      }
    }
  }, [roleParam, setValue]);

  function onSubmit(values: FormValues) {
    const result = verifyDemoCredentials(values.email, values.password);
    if (!result.ok) {
      setFailure(result);
      return;
    }
    setFailure(null);
    login(result.account.role);
    router.push(roleHome(result.account.role));
  }

  function handleDirectRoleLogin(account: DemoAccount) {
    setFailure(null);
    setValue("email", account.email);
    setValue("password", DEMO_PASSWORD);
    login(account.role);
    router.push(roleHome(account.role));
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/30 font-sans">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              {t.common.appName}
            </h1>
            <p className="text-sm text-muted-foreground">{t.login.tagline}</p>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {failure ? (
                  <Alert variant="destructive">
                    <AlertTitle>
                      {failure.code === "unknown-email"
                        ? t.login.errorTitle
                        : t.login.wrongPasswordTitle}
                    </AlertTitle>
                    <AlertDescription>
                      {failure.code === "unknown-email"
                        ? t.login.errorBody
                        : t.login.wrongPasswordBody}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="email">{t.login.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t.login.emailPlaceholder}
                    aria-invalid={Boolean(errors.email)}
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">{t.login.passwordLabel}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t.login.passwordPlaceholder}
                    aria-invalid={Boolean(errors.password)}
                    {...register("password")}
                  />
                  {errors.password ? (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  ) : null}
                </div>

                <Button type="submit" className="w-full bg-[#074726] hover:bg-[#05351c] text-white font-semibold h-10" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogIn className="size-4" />
                  )}
                  {isSubmitting ? t.login.submitting : t.login.submit}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick 1-Click Role Login Section */}
          <div className="space-y-3">
            <div className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.login.demoAccountsLabel} (1-Click Direct Login)
            </div>
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const IconComponent = ROLE_ICONS[account.role] || User;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleDirectRoleLogin(account)}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:border-[#074726] hover:shadow-md group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#074726] group-hover:bg-[#074726] group-hover:text-white transition-colors shrink-0">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-sm text-slate-800 group-hover:text-[#074726] transition-colors">
                          {account.name} {account.title ? `(${account.title})` : ""}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {account.email}
                        </div>
                      </div>
                    </div>
                    <span className="ml-2 shrink-0 rounded-full bg-emerald-100 text-[#074726] px-2.5 py-1 text-xs font-semibold">
                      {t.roles[account.role]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground pt-1">
              {t.login.demoPasswordHint}{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground font-semibold">
                {DEMO_PASSWORD}
              </code>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
