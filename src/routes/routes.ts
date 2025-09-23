// src/routes/routes.ts
import { lazy } from "react";
import type { LazyExoticComponent, FC } from "react";

export interface AppRoute {
  path: string;
  element: LazyExoticComponent<FC>;
}

export const routes: AppRoute[] = [
  // Company Selection - Global feature
  { 
    path: "/company-selection", 
    element: lazy(() => import("@/components/CompanySelection")) 
  },
  
  { 
    path: "/definitions/companies", 
    element: lazy(() => import("@/features/companies")) 
  },
  { 
    path: "/definitions/companies/add", 
    element: lazy(() => import("@/features/companies/components/CompanyForm")) 
  },
  { 
    path: "/definitions/companies/edit/:id", 
    element: lazy(() => import("@/features/companies/components/CompanyForm")) 
  },
  { 
    path: "/definitions/materials", 
    element: lazy(() => import("@/features/materials")) 
  },
  { 
    path: "/definitions/materials/add", 
    element: lazy(() => import("@/features/materials/components/MaterialForm")) 
  },
  { 
    path: "/definitions/materials/edit/:id", 
    element: lazy(() => import("@/features/materials/components/MaterialForm")) 
  },
  { 
    path: "/definitions/users", 
    element: lazy(() => import("@/features/users")) 
  },
  { 
    path: "/definitions/users/edit/:id", 
    element: lazy(() => import("@/features/users/components/UserForm")) 
  },
  { 
    path: "/definitions/users/add", 
    element: lazy(() => import("@/features/users/components/UserForm")) 
  },
  { 
    path: "/jobs", 
    element: lazy(() => import("@/features/jobs")) 
  },
  { 
    path: "/jobs/add", 
    element: lazy(() => import("@/features/jobs/components/AddJob")) 
  },
  { 
    path: "/jobs/edit/:id", 
    element: lazy(() => import("@/features/jobs/components/EditJob")) 
  },
  { 
    path: "/jobs/scan/:id", 
    element: lazy(() => import("@/features/jobs/components/JobScan")) 
  },
  
  // Settings routes
  { 
    path: "/settings/printer", 
    element: lazy(() => import("@/features/settings/components/PrinterSettings")) 
  },
  
];