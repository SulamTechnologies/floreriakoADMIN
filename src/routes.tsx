import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "./components/AppLayout";
import { useAuthStore } from "./store/auth";
import LoginPage from "./pages/LoginPage";

const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));

function RequireSudo({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const Fallback = (
  <div className="flex h-full items-center justify-center py-20">
    <div className="w-7 h-7 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
  </div>
);

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireSudo>
        <AppLayout />
      </RequireSudo>
    ),
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      {
        path: "products",
        element: <Suspense fallback={Fallback}><ProductsPage /></Suspense>,
      },
      {
        path: "orders",
        element: <Suspense fallback={Fallback}><OrdersPage /></Suspense>,
      },
      {
        path: "categories",
        element: <Suspense fallback={Fallback}><CategoriesPage /></Suspense>,
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
