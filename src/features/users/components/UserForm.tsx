import { TextInput, Button, Grid, Text, LoadingOverlay, Group, Switch, Paper, Title, ThemeIcon, PasswordInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useUserStore } from '../store/userStore';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconUser, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { User } from '../types/user';

interface UserFormProps {
  initialData?: Partial<User>;
  editMode?: boolean;
  userId?: string;
}

interface UserFormData extends Partial<User> {
  password?: string;
  password_confirmation?: string;
}

export default function UserForm({ initialData, editMode = false, userId }: UserFormProps) {
  const { addUser, editUser, fetchUserById } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  
  // URL'den editMode ve userId'yi belirle
  const isEditModeFromUrl = location.pathname.includes('/edit/');
  const userIdFromUrl = isEditModeFromUrl ? params.id : undefined;
  
  // Props'tan gelen değerler varsa onları kullan, yoksa URL'den al
  const finalEditMode = editMode || isEditModeFromUrl;
  const finalUserId = userId || userIdFromUrl;

  const form = useForm<UserFormData>({
    initialValues: initialData || {
      username: '',
      email: '',
      full_name: '',
      is_active: true,
      password: '',
      password_confirmation: '',
    },
    validate: {
      username: (value) => (!value || value.trim() === '' ? 'Lütfen Kullanıcı Adı giriniz' : null),
      email: (value) => (!value || !/^\S+@\S+$/.test(value) ? 'Lütfen geçerli bir E-posta adresi giriniz' : null),
      full_name: (value) => (!value || value.trim().length < 2 ? 'Lütfen Ad Soyad giriniz' : null),
      password: (value) => {
        if (!finalEditMode && (!value || value.length < 6)) {
          return 'Şifre en az 6 karakter olmalıdır';
        }
        return null;
      },
      password_confirmation: (value, values) => {
        if (!finalEditMode && (!value || value !== values.password)) {
          return 'Şifre tekrarı eşleşmiyor';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      if (finalEditMode && finalUserId) {
        await fetchUserData();
      }
    };

    initializeForm();
  }, [finalEditMode, finalUserId]);

  const fetchUserData = async () => {
    if (!finalUserId) return;
    
    setIsLoading(true);
    try {
      const userData = await fetchUserById(finalUserId);
      const computedFullName = userData.full_name 
        || [userData.first_name, userData.last_name].filter(Boolean).join(' ').trim();
      form.setValues({
        ...userData,
        full_name: computedFullName,
      });
    } catch (error: any) {
      notifications.show({
        title: 'Hata',
        message: 'Kullanıcı bilgileri yüklenirken bir hata oluştu',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: UserFormData) => {
    setIsSubmitting(true);
    try {
      // Password fields'ları values'dan çıkar
      const { password, password_confirmation, ...userData } = values;
      // full_name'den first_name ve last_name türet
      const name = (userData.full_name || '').trim();
      const [derivedFirstName, ...rest] = name.split(/\s+/);
      const derivedLastName = rest.join(' ').trim();
      const payload: Partial<User> = {
        ...userData,
        first_name: derivedFirstName || userData.first_name,
        last_name: derivedLastName || userData.last_name,
      };
      
      if (finalEditMode && finalUserId) {
        await editUser(finalUserId, payload);
      } else {
        // Yeni kullanıcı oluştururken password'ü dahil et
        const createUserData: Partial<User> = { ...payload };
        if (password) {
          (createUserData as any).password = password;
        }
        await addUser(createUserData);
      }
      
      navigate('/definitions/users');
    } catch (error: any) {
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/definitions/users');
  };

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconUser color="#fff" stroke={1.5} />
          </ThemeIcon>
          {finalEditMode ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
        </Title>
        <Button 
          leftSection={<IconArrowLeft size={16} />} 
          variant="light" 
          onClick={handleBack}
          size="xs"
        >
          Geri Dön
        </Button>
      </Group>
      
      <LoadingOverlay visible={isLoading} />
      <form onSubmit={form.onSubmit(handleSubmit)} autoComplete='off'>
        
        <Paper p="lg" withBorder mb="lg">
          <Text size="sm" fw={500} c="dimmed" mb="xs">Kullanıcı Bilgileri</Text>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Kullanıcı Adı"
                placeholder="Ör: john.doe"
                {...form.getInputProps('username')}
                withAsterisk
                required
                disabled={finalEditMode}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="E-posta"
                placeholder="Ör: john.doe@example.com"
                {...form.getInputProps('email')}
                withAsterisk
                required
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Ad Soyad"
                placeholder="Ör: John Doe"
                {...form.getInputProps('full_name')}
                withAsterisk
                required
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {!finalEditMode && (
          <Paper p="lg" withBorder mb="lg">
            <Text size="sm" fw={500} c="dimmed" mb="xs">Şifre Bilgileri</Text>
            <Grid>
              <Grid.Col span={6}>
                <PasswordInput
                  label="Şifre"
                  placeholder="En az 6 karakter"
                  {...form.getInputProps('password')}
                  withAsterisk
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <PasswordInput
                  label="Şifre Tekrarı"
                  placeholder="Şifrenizi tekrar giriniz"
                  {...form.getInputProps('password_confirmation')}
                  withAsterisk
                  required
                />
              </Grid.Col>
            </Grid>
          </Paper>
        )}

        <Paper p="lg" withBorder mb="lg">
          <Switch
            label="Kullanıcı Aktif mi?"
            {...form.getInputProps('is_active', { type: 'checkbox' })}
          />
        </Paper>

        <Group justify="flex-end" mt="lg">
          <Button type="submit" size="xs" loading={isSubmitting}>
            {finalEditMode ? 'Güncelle' : 'Kaydet'}
          </Button>
        </Group>
        
      </form>
    </>
  );
} 