interface SelectOption {
    value: string;
    label: string;
  }
  
  export const createSelectOptions = <T extends { code: number | string; name: string }>(
    items: T[]
  ): SelectOption[] => {
    return items.map(item => ({
      value: String(item.code),
      label: item.name
    }));
  };