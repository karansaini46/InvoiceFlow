import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/Button";
import { api } from "@/lib/axios";
import { type AuthSession, useAuthStore } from "@/store/auth";

const registerSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm your password."),
    email: z.string().trim().email("Enter a valid email address."),
    name: z.string().trim().min(1, "Name is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async ({ confirmPassword: _confirmPassword, ...values }) => {
    setFormError(null);

    try {
      const response = await api.post<AuthSession>("/auth/register", values);
      login(response.data);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error)) {
        const message = error.response?.data.message ?? "Unable to create account.";

        if (error.response?.status === 409) {
          setError("email", { message });
          return;
        }

        setFormError(message);
        return;
      }

      setFormError("Unable to create account.");
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
            Create your account
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Start sending polished invoices in minutes
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="field-label" htmlFor="name">
              Name
            </label>
            <input
              className="input-dark"
              id="name"
              type="text"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name ? (
              <p className="mt-2 text-sm text-[#F87171]">{errors.name.message}</p>
            ) : null}
          </div>

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
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-2 text-sm text-[#F87171]">{errors.password.message}</p>
            ) : null}
          </div>

          <div>
            <label className="field-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              className="input-dark"
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="mt-2 text-sm text-[#F87171]">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {formError ? <div className="error-banner text-sm">{formError}</div> : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link className="font-medium text-[var(--accent)] transition hover:text-[#818CF8]" to="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
