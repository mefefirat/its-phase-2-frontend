import {
    IconDashboard,
    IconBell,
    IconTruck,
    IconChartBar,
    IconSettings,
    IconPackageImport,
    IconLocation,
    IconClipboardList,
    IconChecklist,
    IconMapPin,
    IconPackageExport,
    IconTruckDelivery,
    IconBuilding,
    IconPackage,
    IconPackages,
    IconUsers,
    IconUser,
    IconReportAnalytics,
    IconPlugConnected,
    IconList,
    IconBuildings,
    IconAdjustments,
    IconPrinter,
    IconLayout,
    IconPill,
    IconShoppingCart,
    IconShoppingCartX,
    IconHospital,
    IconReceipt,
    IconRotate,
    IconBan,
    IconInfoCircle,
    IconShieldCheck,
    IconSearch,
    IconPackageExport as IconPackageSend,
    IconPackageImport as IconPackageReceive,
    IconArrowBackUp,
    IconCirclePlus
} from "@tabler/icons-react";
  
  export interface SubMenuItem {
    id: string;
    label: string;
    path: string;
    icon: React.ComponentType<any>;
  }
  
  export interface MenuGroup {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    items: SubMenuItem[];
    // Role-based visibility - specify which roles can access this group
    allowedRoles?: ('admin' | 'teamleader' | 'workkerf1' | 'workkerf2')[];
  }
  
  export interface MenuItem {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    title: string;
    titleIcon: React.ComponentType<any>;
    groups: MenuGroup[];
  }
  
  export const menuConfig: MenuItem[] = [
    {
      id: 'its-phase-2',
      label: 'ITS',
      icon: IconPill, // İlaç Takip Sistemi için uygun ikon
      title: 'İlaç Takip Sistemi / Üretim',
      titleIcon: IconPill,
      groups: [
        {
          
            id: 'its-phase-2-jobs',
            title: 'Faz-II İşlemler',
            icon: IconClipboardList,
            allowedRoles: ['admin', 'teamleader', 'workkerf2'],
            items: [
              {
                id: 'its-phase-2-jobs-new',
                label: 'Yeni İş Başlat',
                path: '/jobs/add',
                icon: IconCirclePlus
              }
              ,
              {
                id: 'its-phase-2-jobs-draft',
                label: 'Taslak İşler',
                path: '/jobs?status=draft',
                icon: IconRotate
              },
              {
                id: 'its-phase-2-jobs-half-completed',
                label: 'Yarım Kalan İşler',
                path: '/jobs?status=in_progress',
                icon: IconRotate
              },
              {
                id: 'its-phase-2-jobs-completed',
                label: 'Tamamlanmış İşler',
                path: '/jobs',
                icon: IconChecklist
              }
            ]
          },

          {
          
            id: 'its-phase-1-jobs',
            title: 'Faz-I İşlemler',
            icon: IconClipboardList,
            allowedRoles: ['admin', 'teamleader', 'workkerf1'],
            items: [
              {
                id: 'its-phase-1-jobs-new',
                label: 'İş Emri Oluştur',
                path: '/qrcodes/add',
                icon: IconCirclePlus
              },
              {
                id: 'its-phase-1-jobs-new',
                label: 'İş Emri Listesi',
                path: '/qrcodes/?status=pending',
                icon: IconList
              }
              ,
              {
                id: 'its-phase-1-jobs-draft',
                label: 'Tamamlanmış İşler',
                path: '/qrcodes/?status=completed',
                icon: IconChecklist
              },
             
            ]
          }, 
        {
          id: 'its-phase-2-definitions',
          title: 'Tanımlamalar',
          icon: IconPackage,
          allowedRoles: ['admin'],
          items: [
            {
              id: 'its-phase-2-companies',
              label: 'Firmalar',
              path: '/definitions/companies',
              icon: IconPackageImport
            },
            {
              id: 'its-phase-2-materials',
              label: 'Ürünler',
              path: '/definitions/materials',
              icon: IconList
            },
            {
              id: 'its-phase-2-users',
              label: 'Kullanıcılar',
              path: '/definitions/users',
              icon: IconList
            }
          ]
        },
        /*
        {
          id: 'its-phase-2-settings',
          title: 'Ayarlar',
          icon: IconPackage,
          allowedRoles: ['admin', 'teamleader'],
          items: [
            {
              id: 'its-phase-2-printer',
              label: 'Printer Ayarları',
              path: '/settings/printer',
              icon: IconPackageImport
            },
           ]
        }*/
        
      ]
    }
  ];