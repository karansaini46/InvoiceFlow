import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/Button";
import { api } from "@/lib/axios";
import { type AuthSession, useAuthStore } from "@/store/auth";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-base)] px-6 py-10">
      <section className="glass-card relative z-10 w-full max-w-md animate-fade-in-up p-8 sm:p-10">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: "var(--accent)", boxShadow: "0 0 24px var(--accent-glow)" }}
          >
            IF
          </span>
          <span
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)", fontFamily: "Syne, sans-serif" }}
          >
            InvoiceFlow
          </span>
        </div>

        <div className="mt-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Welcome back
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              className="input-dark"
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-2 text-sm text-[#F87171]">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              className="input-dark"
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-2 text-sm text-[#F87171]">{errors.password.message}</p>
            ) : null}
          </div>

          {formError ? <div className="error-banner text-sm">{formError}</div> : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          Need an account?{" "}
          <Link className="font-medium text-[var(--accent)] transition hover:text-[#818CF8]" to="/register">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}
