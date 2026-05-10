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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            InvoiceFlow
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Login</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Sign in to manage invoices.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-800" htmlFor="email">
              Email
            </label>
            <input
              className="mt-2 block w-full rounded-md border-slate-300 text-slate-950 shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-2 text-sm text-red-700">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-800" htmlFor="password">
              Password
            </label>
            <input
              className="mt-2 block w-full rounded-md border-slate-300 text-slate-950 shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-2 text-sm text-red-700">{errors.password.message}</p>
            ) : null}
          </div>

          {formError ? <p className="text-sm text-red-700">{formError}</p> : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Need an account?{" "}
          <Link className="font-medium text-emerald-700 hover:text-emerald-800" to="/register">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}
