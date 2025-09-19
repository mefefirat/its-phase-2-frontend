import { Button } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';

export function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show footer at all on home page (/rf)
  const isHomePage = location.pathname === '/rf';
  
  const handleBack = () => {
    navigate(-1);
  };

  // Don't render anything on home page
  if (isHomePage) {
    return null;
  }

  return (
    
      <Button
        variant="light"
        leftSection={<IconArrowLeft size={16} />}
        onClick={handleBack}
        size="sm"
        style={{ width: '100%', height: '100%' }}
        m={0}
        p={0}
        radius={0}
       
      >
        Geri
      </Button>
    
  );
}



