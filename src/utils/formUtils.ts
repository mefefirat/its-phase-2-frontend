export const createFormField = <T>(
    name: keyof T,
    label: string,
    required: boolean = false,
    placeholder?: string
  ) => ({
    name,
    label,
    required,
    placeholder,
  });
  
  export const createFormSection = (title: string, fields: any[]) => ({
    title,
    fields,
  });
  