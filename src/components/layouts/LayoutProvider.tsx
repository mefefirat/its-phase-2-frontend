// src/components/layouts/LayoutProvider.tsx
import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainLayout } from "./MainLayout";
import { RFDeviceLayout } from "./RFDeviceLayout";
import { useCurrentCompany } from "@/store/globalStore";

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentCompany = useCurrentCompany();

  const isAuthPath = location.pathname.startsWith('/login');
  const isRFPath = location.pathname.startsWith('/rf');
  const isCompanySelectionPath = location.pathname === '/company-selection';

  useEffect(() => {
    // Skip company selection logic for RF paths, auth paths, and company selection page
    if (isRFPath || isAuthPath || isCompanySelectionPath) {
      return;
    }

    // If no company is selected and we're not on the company selection page,
    // redirect to company selection
    if (!currentCompany) {
      navigate('/company-selection', { replace: true });
    }
  }, [isRFPath, isAuthPath, isCompanySelectionPath, currentCompany, navigate]);

 
  // Skip layouts for auth pages (e.g., login) and company selection page
  if (isAuthPath || isCompanySelectionPath) {
    return <>{children}</>;
  }

  // 👇 RF Device Layout Support - Check URL path
  if (isRFPath) {
    return <RFDeviceLayout>{children}</RFDeviceLayout>;
  }

  // Otherwise use MainLayout
  return <MainLayout>{children}</MainLayout>;
}