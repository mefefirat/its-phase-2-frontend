// src/Router.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { Center, Loader } from "@mantine/core";

import { LayoutProvider } from "@/components/layouts/LayoutProvider";
import { routes } from "@/routes/routes";
import { ErrorNotFound } from "@/components/ui/web/errors";
import { RouteErrorBoundary } from "@/RouteErrorBoundary";
import Login from '@/features/auth/components/Login';
import { authStorage } from '@/utils/authStorage';
import { useGlobalStore } from '@/store/globalStore';

function PrivateRoute({ element, requireCompany = true }: { element: React.ReactElement; requireCompany?: boolean }) {
  const isAuthed = authStorage.isAuthenticated();
  const currentCompany = useGlobalStore((state) => state.currentCompany);
  
  // Eğer authenticate değilse login'e yönlendir
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }
  
  // Eğer company gerekli ama seçilmemişse company-selection'a yönlendir
  if (requireCompany && !currentCompany) {
    return <Navigate to="/company-selection" replace />;
  }
  
  return element;
}

function HomeRedirect() {
  // PrivateRoute zaten company kontrolü yapıyor, burada sadece dashboard'a yönlendir
  return <Navigate to="/jobs" replace />;
}

export function Router() {
  const fallback = (
    <Center style={{ height: "100vh" }}>
      <Loader size="xl" />
    </Center>
  );

  return (
    <BrowserRouter basename="/its-phase">
      <Suspense fallback={fallback}>
        <LayoutProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute element={<HomeRedirect />} />} />
            {routes.map(({ path, element: Element }) => {
              // Company-selection sayfası için requireCompany=false
              const isCompanySelection = path === '/company-selection';
              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    <PrivateRoute 
                      element={
                        <RouteErrorBoundary>
                          <Element />
                        </RouteErrorBoundary>
                      } 
                      requireCompany={!isCompanySelection}
                    />
                  }
                />
              );
            })}
            <Route path="*" element={<ErrorNotFound />} />
          </Routes>
        </LayoutProvider>
      </Suspense>
    </BrowserRouter>
  );
}