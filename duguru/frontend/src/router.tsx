import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";

/* ─── Lazy-loaded pages ──────────────────────────────────────────── */
const WelcomePage = lazy(() => import("@/pages/WelcomePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const NatalChartPage = lazy(() => import("@/pages/NatalChartPage"));
const HoroscopePage = lazy(() => import("@/pages/HoroscopePage"));
const CompatibilityPage = lazy(() => import("@/pages/CompatibilityPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

/* ─── Loading fallback ───────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="flex min-h-[60vh] flex-col gap-4 p-6" role="status" aria-label="Carregando página…">
      <Skeleton height="2rem" width="40%" />
      <Skeleton lines={5} />
    </div>
  );
}

/* ─── Protected Route ────────────────────────────────────────────── */
function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/boas-vindas" replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Sidebar — visível apenas em ≥ 1024 px */}
      <Sidebar />

      {/* Área principal */}
      <div className="flex flex-1 flex-col">
        {/* TopBar — visível apenas em < 1024 px (logo + controles) */}
        <TopBar />
        <main className="flex-1 pb-16 lg:pb-0">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* BottomNav — visível apenas em < 1024 px */}
      <BottomNav />
    </div>
  );
}

/* ─── Public Route (redireciona se já autenticado) ───────────────── */
function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Outlet />
    </Suspense>
  );
}

/* ─── Router ─────────────────────────────────────────────────────── */
export const router = createBrowserRouter([
  /* Rotas públicas (acessíveis sem autenticação) */
  {
    element: <PublicRoute />,
    children: [
      { path: "/boas-vindas", element: <WelcomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/cadastro", element: <RegisterPage /> },
      { path: "/esqueci-a-senha", element: <ForgotPasswordPage /> },
      { path: "/redefinir-senha", element: <ResetPasswordPage /> },
    ],
  },

  /* Rotas protegidas (requerem autenticação) */
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/mapa-natal", element: <NatalChartPage /> },
      { path: "/horoscopo", element: <HoroscopePage /> },
      { path: "/compatibilidade", element: <CompatibilityPage /> },
      { path: "/perfil", element: <ProfilePage /> },
    ],
  },

  /* Fallback — redireciona para boas-vindas */
  { path: "*", element: <Navigate to="/boas-vindas" replace /> },
]);
