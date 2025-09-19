import { AppShell } from '@mantine/core';
import type { ReactNode } from 'react';
import { Header } from '@/components/ui/rf/layout/Header';
import { Footer } from '../ui/rf/layout/Footer';


interface RFDeviceLayoutProps { children: ReactNode; }

export function RFDeviceLayout({ children }: RFDeviceLayoutProps) {


  return (
    <AppShell
      header={{ height: 48 }}
      navbar={{ width: 350, breakpoint: 'sm' }}
      padding="md"
      withBorder={false}
      footer={{ height: 48 }}
      className="oraxai-rf"
    >
      <AppShell.Header 
        className="header" 
        style={{
          backgroundColor: '#ebebeb', 
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
         <Header />
       
       
      </AppShell.Header>
      <AppShell.Main p={10} mt={50}> {children}</AppShell.Main>
      

    </AppShell>
  );
}