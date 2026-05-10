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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            InvoiceFlow
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Register</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Create a secure account before sending invoices.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-800" htmlFor="name">
              Name
            </label>
            <input
              className="mt-2 block w-full rounded-md border-slate-300 text-slate-950 shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
              id="name"
              type="text"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name ? (
              <p className="mt-2 text-sm text-red-700">{errors.name.message}</p>
            ) : null}
          </div>

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
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-2 text-sm text-red-700">{errors.password.message}</p>
            ) : null}
          </div>

          <div>
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="confirmPassword"
            >
              Confirm password
            </label>
            <input
              className="mt-2 block w-full rounded-md border-slate-300 text-slate-950 shadow-sm focus:border-emerald-600 focus:ring-emerald-600"
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="mt-2 text-sm text-red-700">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {formError ? <p className="text-sm text-red-700">{formError}</p> : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-medium text-emerald-700 hover:text-emerald-800" to="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
