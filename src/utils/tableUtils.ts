export interface TableColumn<T> {
    key: keyof T;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }
  
  export const createTableColumn = <T>(
    key: keyof T,
    label: string,
    options?: Partial<Omit<TableColumn<T>, 'key' | 'label'>>
  ): TableColumn<T> => ({
    key,
    label,
    ...options,
  });