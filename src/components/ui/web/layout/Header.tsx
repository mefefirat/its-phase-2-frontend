import { Group, Box, Menu, Text, Avatar, Button, Badge, Divider, Alert } from '@mantine/core';
import {
  IconSettings,
  IconSearch,
  IconPhoto,
  IconMessageCircle,
  IconTrash,
  IconArrowsLeftRight,
  IconLogout,
  IconUser,
  IconBuilding,
  IconShield,
  IconAlertCircle
} from '@tabler/icons-react';
import { useCurrentUser, useIsAdmin, useGlobalStore, useCurrentCompany } from '@/store/globalStore';
import { useState } from 'react';
import { authStorage } from '@/utils/authStorage';
import { useNavigate } from 'react-router-dom';

export function Header() {
  // Global store'dan kullanıcı bilgilerini al
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const currentCompany = useCurrentCompany();
  const clearCurrentCompany = useGlobalStore((s) => s.clearCurrentCompany);
  const fullName = useGlobalStore((s) => s.fullName);
  const navigate = useNavigate();


  const handleLogout = () => {
    // Global store'u temizle ve local token'ı temizle
    const globalStore = useGlobalStore.getState();
    globalStore.reset();
    authStorage.clear();
    window.location.href = '/its-phase/login';
  };

  // User display name
  const displayName =
    fullName ||
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    'Kullanıcı';

  return (
    <>
      <Group
        h="100%"
        px="md"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box className="logo" />
        
        <Group gap="md">
          {/* Şirket seçimi uyarısı */}
          {!currentCompany && (
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              color="orange" 
              variant="light"
              radius="md"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/company-selection')}
            >
              <Text size="sm">
                <strong>Şirket Seçiniz:</strong> Devam etmek için lütfen bir şirket seçiniz
              </Text>
            </Alert>
          )}

          {/* Kullanıcı adı ve rol badges */}
          
          <Group gap="xs">
            {/* Kullanıcı adı (avatar solunda) */}
            <Text size="sm" fw={500}>{displayName}</Text>
            {/* User Avatar Menu */}
            <Menu shadow="md" width={270} position="bottom-end">
              <Menu.Target>
                <Avatar 
                  src={null} 
                  className='avatar' 
                  color="indigo"
                  style={{ cursor: 'pointer' }}
                  size="sm"
                >
                  <IconUser size={14} />
                </Avatar>
              </Menu.Target>

              <Menu.Dropdown>
                {/* User Info Header */}
                <Box p="sm">
                  <Group>
                    <Avatar color="indigo" size="md">
                      <IconUser size={16} />
                    </Avatar>
                    <div>
                      <Text fw={500} size="sm">
                        {displayName}
                      </Text>
                     
                    </div>
                  </Group>
                </Box>

                
                

                {/* Firma Bilgisi ve Firma Değiştir */}
                {currentCompany && (
                  <>
                    <Menu.Divider />
                    <Menu.Label>Seçili Firma: {currentCompany.name}</Menu.Label>
                      <Menu.Item
                        onClick={() => {
                          clearCurrentCompany();
                          navigate('/company-selection');
                        }}
                      >
                        Firma Değiştir
                      </Menu.Item>
                      <Menu.Item
                        onClick={() => {
                        
                          navigate('/its/companies');
                        }}
                      >
                        Firma Listesi
                      </Menu.Item>
                    
                  </>
                )}

                <Menu.Divider />

                
                
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                >
                  Çıkış Yap
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Group>
    </>
  );
}