import { TextInput, Button, Grid, Text, LoadingOverlay, Group, Paper, Title, ThemeIcon, Select, NumberInput, Divider, Badge, ActionIcon, Table } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMaterialStore } from '../store/materialStore';
import type { MaterialPackHierarchyItem } from '../types/material';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconPackage, IconArrowLeft, IconX, IconDeviceFloppy } from '@tabler/icons-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Material } from '../types/material';
import { useGlobalStore } from '@/store/globalStore';

interface MaterialFormProps {
  initialData?: Partial<Material>;
  editMode?: boolean;
  materialId?: string;
}

export default function MaterialForm({ initialData, editMode = false, materialId }: MaterialFormProps) {
  const { addMaterial, editMaterial, fetchMaterialById, fetchPackHierarchies, addPackHierarchy, removePackHierarchy, packHierarchies } = useMaterialStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  
  const isEditModeFromUrl = location.pathname.includes('/edit/');
  const materialIdFromUrl = isEditModeFromUrl ? params.id : undefined;
  
  const finalEditMode = editMode || isEditModeFromUrl;
  const finalMaterialId = materialId || materialIdFromUrl;

  const form = useForm<Partial<Material>>({
    initialValues: initialData || {
      material_name: '',
      sku: '',
      gtin: '',
    },
    validate: {
      material_name: (value) => (!value || value.trim().length < 2 ? 'Lütfen Ürün Adı giriniz' : null),
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      if (finalEditMode && finalMaterialId) {
        await fetchMaterialData();
        await fetchPackHierarchies(finalMaterialId);
      } 
    };

    initializeForm();
  }, [finalEditMode, finalMaterialId]);

  const fetchMaterialData = async () => {
    if (!finalMaterialId) return;
    setIsLoading(true);
    try {
      const materialData = await fetchMaterialById(finalMaterialId);
      form.setValues({
        material_name: materialData.material_name,
        sku: materialData.sku ?? '',
        gtin: materialData.gtin ?? '',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Hata',
        message: 'Ürün bilgileri yüklenirken bir hata oluştu',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed type list and prefix mapping
  const PACK_TYPES = [
    { code: 'P', label: 'Palet', prefix: '0' },
    { code: 'C', label: 'Koli', prefix: '1' },
    { code: 'S', label: 'Bağ', prefix: '2' },
    { code: 'B', label: 'Koli içi Kutu', prefix: '3' },
    { code: 'E', label: 'Küçük Bağ', prefix: '4' },
  ];

  // Local state for creating a new hierarchy node (simplified form)
  const [newNode, setNewNode] = useState<Omit<MaterialPackHierarchyItem, 'id' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'>>({
    material_id: finalMaterialId || '',
    parent_id: null,
    code: '',
    label: '',
    capacity_items: 0,
    barcode_prefix: '',
  });

  useEffect(() => {
    if (finalMaterialId) {
      setNewNode((prev) => ({ ...prev, material_id: finalMaterialId }));
    }
  }, [finalMaterialId]);

  const normalizeCode = (s?: string) => (s ?? '').toString().trim().toUpperCase();
  const availableTypes = PACK_TYPES.filter(t => !packHierarchies.some(h => normalizeCode(h.code) === normalizeCode(t.code)));

  const handleAddHierarchy = async () => {
    if (!finalMaterialId) return;
    if (!newNode.code) return;
    // prevent duplicates of same type in chain
    const exists = packHierarchies.some(h => normalizeCode(h.code) === normalizeCode(newNode.code));
    if (exists) return;

    const last = packHierarchies[packHierarchies.length - 1];
    const selected = PACK_TYPES.find(t => t.code === newNode.code)!;

    const payload = {
      material_id: finalMaterialId,
      parent_id: last?.id ?? null,
      code: selected.code,
      label: selected.label,
      capacity_items: Number(newNode.capacity_items) || 0,
      barcode_prefix: selected.prefix,
    } as Omit<MaterialPackHierarchyItem, 'id' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'>;

    await addPackHierarchy(payload);
    await fetchPackHierarchies(finalMaterialId);
    setNewNode({ material_id: finalMaterialId, parent_id: null, code: '', label: '', capacity_items: 0, barcode_prefix: '' });
  };

  const handleSubmit = async (values: Partial<Material>) => {
    try {
      setIsSubmitting(true);
      const { currentCompany } = useGlobalStore.getState();
      if (!currentCompany?.code) {
        notifications.show({
          title: 'Hata',
          message: 'Firma seçili değil. Lütfen önce bir firma seçiniz.',
          color: 'red',
        });
        return;
      }
      const payload: Partial<Material> = {
        // company_code formdan gelmeyecek, global store'dan servis içinde de eklenecek
        material_name: (values.material_name || '').trim(),
        sku: values.sku && values.sku.toString().trim() !== '' ? String(values.sku).trim() : undefined,
        gtin: values.gtin && values.gtin.toString().trim() !== '' ? String(values.gtin).trim() : undefined,
      };

      if (finalEditMode && finalMaterialId) {
        await editMaterial(finalMaterialId, payload);
        notifications.show({
          title: 'Başarılı',
          message: 'Ürün başarıyla güncellendi',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        navigate('/definitions/materials');
      } else {
        const created = await addMaterial(payload);
        notifications.show({
          title: 'Başarılı',
          message: 'Ürün başarıyla eklendi',
          color: 'green',
          icon: <IconCheck size={16} />,
        }); 
        if (created?.id) {
          navigate(`/definitions/materials/edit/${created.id}`);
        } else {
          navigate('/definitions/materials');
        }
      }
    } catch (error: any) {
      console.error(finalEditMode ? 'Error updating material:' : 'Error adding material:', error);
      let errorMessage = finalEditMode ? 'Ürün güncellenirken bir hata oluştu' : 'Ürün eklenirken bir hata oluştu';
      if (error.response) {
        errorMessage = error.response.data?.message || `Hata: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Sunucuya ulaşılamıyor';
      } else {
        errorMessage = error.message || errorMessage;
      }
      notifications.show({
        title: 'Hata',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/definitions/materials');
  };

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconPackage color="#fff" stroke={1.5} />
          </ThemeIcon>
          {finalEditMode ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
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
          <Text size="sm" fw={500} c="dimmed" mb="xs">Ürün Bilgileri</Text>
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Ürün Adı"
                placeholder="Ör: Parasetamol 500mg 20 Tablet"
                {...form.getInputProps('material_name')}
                withAsterisk
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="SKU"
                placeholder="Ör: SKU-001234"
                {...form.getInputProps('sku')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="GTIN"
                placeholder="Ör: 08600001234567"
                {...form.getInputProps('gtin')}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        <Group justify="flex-end" mt="lg" mb="lg">
        <Button variant="light" size="xs" onClick={handleBack} leftSection={<IconX size={16} />}>
          Vazgeç
        </Button>
          <Button 
            type="submit" 
            size="xs" 
            loading={isSubmitting}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Kaydet
          </Button>
        </Group>

        {finalEditMode && finalMaterialId && (
          <Paper p="lg" withBorder mb="lg">
            <Group justify="space-between" mb="sm">
              <Text size="sm" fw={500} c="dimmed">Paketleme Hiyerarşisi</Text>
              <Badge color="gray" variant="light">{packHierarchies.length} seviye</Badge>
            </Group>

            <Grid mb="md">
              <Grid.Col span={6}>
                <Select
                  label="Tip Seç"
                  placeholder="Seçiniz"
                  data={availableTypes.map(t => ({ value: t.code, label: `${t.label} (${t.code})` }))}
                  value={newNode.code || null}
                  onChange={(val) => setNewNode((prev) => ({ ...prev, code: val || '' }))}
                  disabled={availableTypes.length === 0}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Kapasite"
                  min={0}
                  value={newNode.capacity_items}
                  onChange={(val) => setNewNode((prev) => ({ ...prev, capacity_items: Number(val) || 0 }))}
                />
              </Grid.Col>
              <Grid.Col span={12} style={{ textAlign: 'right' }}>
                <Button size="xs" onClick={handleAddHierarchy} leftSection={<IconPlus size={16} />} disabled={!newNode.code || availableTypes.length === 0}>Ekle</Button>
              </Grid.Col>
            </Grid>

            <Divider mb="sm" />

            <Table striped withTableBorder withColumnBorders stickyHeader stickyHeaderOffset={0}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tip</Table.Th>
                  <Table.Th>Ürün Kapasitesi</Table.Th>
                  <Table.Th style={{ width: 60 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {packHierarchies.map((h) => (
                  <Table.Tr key={h.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <Badge color={h.parent_id ? 'blue' : 'teal'}>{h.code}</Badge>
                        <Text>{h.label}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text>{h.capacity_items}</Text>
                    </Table.Td>
                    <Table.Td>
                      {h.id && (
                        <ActionIcon color="red" variant="light" onClick={() => h.id && removePackHierarchy(h.id!)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}

        
      </form>
    </>
  );
}


