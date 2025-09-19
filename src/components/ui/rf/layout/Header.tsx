import { Group, Box, Menu, Text, Avatar, Button } from '@mantine/core';
import {
    IconSettings,
    IconSearch,
    IconPhoto,
    IconMessageCircle,
    IconTrash,
    IconArrowsLeftRight,
    IconMenu2,
    IconArrowLeft,
  } from '@tabler/icons-react';
  import keycloak from "@/config/keycloak";

import { useNavigate } from 'react-router-dom';
export function Header() {
  const navigate = useNavigate();

    const handleLogout = () => {
        // Remember me verilerini temizle
        localStorage.removeItem('keycloak-remember-me');
        localStorage.removeItem('keycloak-username');
        
        // Keycloak logout
        keycloak.logout();
      };

    const handleBack = () => {
        // Geri gitme işlemi
        
        navigate('/rf');
    };

  return (
    <Group 
    h="100%" 
    px="0" 
    style={{
      justifyContent: 'space-between', 
      alignItems: 'center',
      display: 'flex',
      
    }}
  >
    {/* Sol taraf - Hamburger Menü */}
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Button 
          variant="transparent" 
          size="sm" 
          leftSection={<IconMenu2 size={30} />}
          style={{ color: 'inherit', padding: '0', margin: '0' }}
        />
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Uygulama</Menu.Label>
        <Menu.Item leftSection={<IconSettings size={14} />}>
          Ayarlar
        </Menu.Item>
        <Menu.Item leftSection={<IconMessageCircle size={14} />}>
          Mesajlar
        </Menu.Item>
        <Menu.Item leftSection={<IconPhoto size={14} />}>
          Galeri
        </Menu.Item>
        <Menu.Item
          leftSection={<IconSearch size={14} />}
          rightSection={
            <Text size="xs" c="dimmed">
              ⌘K
            </Text>
          }
        >
          Ara
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Tehlikeli Bölge</Menu.Label>
        <Menu.Item
          leftSection={<IconArrowsLeftRight size={14} />}
        >
          Verilerimi Transfer Et
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={handleLogout}
        >
          Çıkış Yap
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>

    {/* Orta - Logo */}
    <Box className="logo" style={{ flex: 1, textAlign: 'center' }}>
      <img 
        src="/orax-ai-wms-logo.svg" 
        alt="Logo" 
        style={{ height: '28px' }}
      />
    </Box>

    {/* Sağ taraf - Geri İkonu */}
    <Button 
      variant="transparent" 
      size="sm" 
      onClick={handleBack}
      style={{ color: 'inherit', padding: '8px' }}
    >
      <IconArrowLeft size={30} />
    </Button>
  </Group>
  );
}



