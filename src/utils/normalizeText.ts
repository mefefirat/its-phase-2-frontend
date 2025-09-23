export function normalizeText(input: string): string {
    if (!input) return "";
  
    const map: Record<string, string> = {
      'ç': 'c',
      'Ç': 'C',
      'ğ': 'g',
      'Ğ': 'G',
      'ı': 'i',
      'İ': 'I',
      'ö': 'o',
      'Ö': 'O',
      'ş': 's',
      'Ş': 'S',
      'ü': 'u',
      'Ü': 'U',
    };
  
    // Türkçe karakterleri dönüştür
    const replaced = input
      .split("")
      .map(char => map[char] || char)
      .join("");
  
    // Tamamını büyük harfe çevir
    return replaced.toUpperCase();
  }