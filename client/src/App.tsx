import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { DashboardPage } from "@/pages/DashboardPage";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <InvoicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id"
        element={
          <ProtectedRoute>
            <InvoiceDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
