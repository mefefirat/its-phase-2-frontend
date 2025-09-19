export const formatDate = (dateStr: string | null | undefined, showTime: boolean = true): string => {
  if (!dateStr) return '-';
  
  const date = new Date(dateStr);

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Istanbul"
  };

  if (showTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
    options.hour12 = false;
  }

  return date.toLocaleString("tr-TR", options);
};
  
  export const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR');
  };