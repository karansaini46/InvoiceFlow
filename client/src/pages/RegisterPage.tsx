import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
      <path
        d="M2.5 12C4.5 7.5 7.667 5.25 12 5.25C16.333 5.25 19.5 7.5 21.5 12C19.5 16.5 16.333 18.75 12 18.75C7.667 18.75 4.5 16.5 2.5 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M12 15A3 3 0 1012 9a3 3 0 000 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
      <path
        d="M3 3L21 21M10.6 10.6A2 2 0 0013.4 13.4M9.88 4.24A10.9 10.9 0 0112 4c5 0 8.5 4 9.5 8a11.8 11.8 0 01-3.13 5.13M6.11 6.11A12.4 12.4 0 002.5 12c1 4 4.5 8 9.5 8a10.9 10.9 0 004.11-.78"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterFormValues>({
    mode: "onBlur",
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
    <main className="grid min-h-screen bg-[var(--bg-0)] lg:grid-cols-2">
      <section className="hidden border-r border-[var(--border)] bg-[var(--bg-1)] lg:flex lg:items-center lg:justify-center">
        <div className="text-center">
          <p className="mono text-[48px] font-semibold text-[var(--accent)]">IF</p>
          <p className="mt-2 text-sm text-[var(--text-2)]">InvoiceFlow</p>
          <p className="mt-8 text-xs text-[var(--text-3)]">
            Professional invoicing · Proposals · PDF export
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <div className="page-enter w-full max-w-[360px]" key={location.pathname}>
          <h1 className="text-xl font-semibold text-[var(--text-1)]">Create account</h1>
          <p className="mb-6 mt-1 text-xs text-[var(--text-2)]">Start managing invoices in minutes</p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input autoComplete="name" className="input" id="name" type="text" {...register("name")} />
              {errors.name ? <p className="field-error">{errors.name.message}</p> : null}
            </div>

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input autoComplete="email" className="input" id="email" type="email" {...register("email")} />
              {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  autoComplete="new-password"
                  className="input pr-10"
                  id="password"
                  type={showPw ? "text" : "password"}
                  {...register("password")}
                />
                <button
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] transition-colors hover:text-[var(--text-2)]"
                  onClick={() => setShowPw((value) => !value)}
                  type="button"
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {errors.password ? <p className="field-error">{errors.password.message}</p> : null}
            </div>

            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                autoComplete="new-password"
                className="input"
                id="confirmPassword"
                type={showPw ? "text" : "password"}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="field-error">{errors.confirmPassword.message}</p>
              ) : null}
            </div>

            {formError ? <p className="pt-1 text-center text-xs text-[var(--red)]">{formError}</p> : null}

            <Button className="w-full" loading={isSubmitting} size="lg" type="submit">
              Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-[var(--text-2)]">
            Already have an account?{" "}
            <Link className="text-[var(--accent)] hover:text-[#6278f8]" to="/login">
              Sign in →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
