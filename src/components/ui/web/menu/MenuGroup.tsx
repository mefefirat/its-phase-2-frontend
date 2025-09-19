import React from 'react';
import { Group, Title } from '@mantine/core';
import type { MenuGroup as MenuGroupType } from '@/constants/menuConfig';
import { SubMenuItem } from './SubMenuItem';

interface MenuGroupProps {
  group: MenuGroupType;
  selectedSubmenu: string;
  onNavigate: (path: string) => void;
}

export const MenuGroup: React.FC<MenuGroupProps> = ({ 
  group, 
  selectedSubmenu, 
  onNavigate 
}) => {
  const Icon = group.icon;
  
  // Check if any menu item in this group is selected
  const isGroupActive = group.items.some(item => 
    selectedSubmenu === item.path || selectedSubmenu.startsWith(item.path + '/')
  );
  
  return (
    <Group className="sub-menu-group">
      <Title className={`sub-menu-group-title ${isGroupActive ? 'active' : ''}`}>
        <Icon 
          size={22} 
          color={isGroupActive ? '#228BE6' : '#616161'} 
          style={{marginRight: '6px'}} 
          stroke={1.5} 
        />
        {group.title}
      </Title>
      <Group className="sub-menu-group-item" gap="md">
        {group.items.map(item => (
          <SubMenuItem
            key={item.id}
            item={item}
            isSelected={selectedSubmenu === item.path}
            onNavigate={onNavigate}
          />
        ))}
      </Group>
    </Group>
  );
};
