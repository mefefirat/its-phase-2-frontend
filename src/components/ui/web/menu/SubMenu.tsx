import React from 'react';
import { Box, Title, Group, ThemeIcon, Button } from '@mantine/core';
import type { MenuItem } from '@/constants/menuConfig';
import { MenuGroup } from './MenuGroup';

interface SubMenuProps {
  menuItem: MenuItem;
  selectedSubmenu: string;
  onNavigate: (path: string) => void;
}

export const SubMenu: React.FC<SubMenuProps> = ({ 
  menuItem, 
  selectedSubmenu, 
  onNavigate 
}) => {
  const TitleIcon = menuItem.titleIcon;
  
  return (

    <>
      <Box className="sub-menu-title">
        <Title order={4}>
          <ThemeIcon 
            className="sub-menu-title-icon" 
            size={30} 
            radius="md" 
            color="blue"
          >
            <TitleIcon color="#fff" stroke={1.5} />
          </ThemeIcon>
          {menuItem.title}
        </Title>
      </Box>
      <Group className="sub-menu-group-wrapper">
        {menuItem.groups.map(group => (
          <MenuGroup
            key={group.id}
            group={group}
            selectedSubmenu={selectedSubmenu}
            onNavigate={onNavigate}
          />
        ))}
      </Group>
    </>
  );
};