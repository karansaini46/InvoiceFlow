import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { DashboardPage } from "@/pages/DashboardPage";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { InvoiceFormPage } from "@/pages/InvoiceFormPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProposalDetailPage } from "@/pages/ProposalDetailPage";
import { ProposalFormPage } from "@/pages/ProposalFormPage";
import { ProposalsListPage } from "@/pages/ProposalsListPage";
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
        path="/proposals"
        element={
          <ProtectedRoute>
            <ProposalsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/new"
        element={
          <ProtectedRoute>
            <ProposalFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/:id/edit"
        element={
          <ProtectedRoute>
            <ProposalFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/:id"
        element={
          <ProtectedRoute>
            <ProposalDetailPage />
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
        path="/invoices/new"
        element={
          <ProtectedRoute>
            <InvoiceFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id/edit"
        element={
          <ProtectedRoute>
            <InvoiceFormPage />
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
