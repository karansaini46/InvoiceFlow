import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { api } from "@/lib/axios";
import { type AuthSession, useAuthStore } from "@/store/auth";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M2.5 12C4.5 7.5 7.667 5.25 12 5.25C16.333 5.25 19.5 7.5 21.5 12C19.5 16.5 16.333 18.75 12 18.75C7.667 18.75 4.5 16.5 2.5 12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M12 15A3 3 0 1012 9a3 3 0 000 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M3 3L21 21M10.6 10.6A2 2 0 0013.4 13.4M9.88 4.24A10.9 10.9 0 0112 4c5 0 8.5 4 9.5 8a11.8 11.8 0 01-3.13 5.13M6.11 6.11A12.4 12.4 0 002.5 12c1 4 4.5 8 9.5 8a10.9 10.9 0 004.11-.78" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    mode: "onBlur",
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const response = await api.post<AuthSession>("/auth/login", values);
      login(response.data);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error)) {
        setFormError(error.response?.data.message ?? "Unable to sign in.");
        return;
      }
      setFormError("Unable to sign in.");
    }
  });

  return (
    <main className="layout-container">
      <section className="flex-col justify-center items-center w-full" style={{ display: 'flex', backgroundColor: 'var(--bg-base)', position: 'relative' }}>
        <div className="tech-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }}></div>
        <div className="page-enter technical-panel" style={{ width: '100%', maxWidth: '420px', padding: '48px 32px', borderRadius: '8px', position: 'relative', zIndex: 1, backgroundColor: 'rgba(17,17,17,0.8)', backdropFilter: 'blur(12px)' }} key={location.pathname}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--accent-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary-text)', fontWeight: 700, fontSize: '12px' }}>
                IF
              </div>
              <span style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '-0.01em' }}>InvoiceFlow</span>
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 className="text-h2 font-display" style={{ marginBottom: '8px', letterSpacing: '-0.02em', fontSize: '28px' }}>Sign In</h1>
            <p className="text-body text-muted font-mono" style={{ fontSize: '13px' }}>Welcome back. Please enter your details.</p>
          </div>

          <form className="flex-col gap-4" style={{ display: 'flex' }} onSubmit={onSubmit}>
            <Input
              label="Email"
              autoComplete="email"
              autoFocus
              id="email"
              type="email"
              placeholder="name@company.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                autoComplete="current-password"
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
                style={{ paddingRight: '40px' }}
              />
              <button
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{ position: 'absolute', right: '12px', top: '34px', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                onClick={() => setShowPw((value) => !value)}
                type="button"
              >
                <EyeIcon open={showPw} />
              </button>
            </div>

            {formError ? <div style={{ color: 'var(--error-text)', fontSize: '13px', textAlign: 'center' }}>{formError}</div> : null}

            <Button className="w-full mt-2 font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }} loading={isSubmitting} size="lg" type="submit" variant="primary">
              Initialize Session
            </Button>
          </form>

          <p className="mt-8 text-center text-body">
            Don&apos;t have an account?{" "}
            <Link className="font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }} to="/register">
              Create Account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
