// utils/pharmaValidator.ts

function isValidGTIN(gtin: string): boolean {
    // 13 veya 14 haneli GTIN kabul et
    if (!/^\d{13,14}$/.test(gtin)) return false;
    
    // 13 haneliyse başına 0 ekleyerek 14 haneli yap
    const gtin14 = gtin.length === 13 ? '0' + gtin : gtin;
    
    const d = gtin14.split("").map(Number);
    const check = d[13]; // Son hane check digit
    let sum = 0;
    
    // GTIN-14 check digit hesaplama: soldan sağa, çift pozisyonlar 3x, tek pozisyonlar 1x
    for (let i = 0; i < 13; i++) {
      const weight = (i % 2 === 0) ? 1 : 3; // İlk hane 1x, ikinci hane 3x, vs.
      sum += d[i] * weight;
    }
    const calc = (10 - (sum % 10)) % 10;
    return calc === check;
  }
  
  function parseExpiry(ddMMYY: string): string | null {
    if (!/^\d{6}$/.test(ddMMYY)) return null;
    let dd = parseInt(ddMMYY.slice(0, 2), 10);
    const mm = parseInt(ddMMYY.slice(2, 4), 10);
    const yy = parseInt(ddMMYY.slice(4, 6), 10);
    if (mm < 1 || mm > 12) return null;
    const year = 2000 + yy;
    const lastDay = new Date(year, mm, 0).getDate();
    if (dd === 0) dd = lastDay;
    if (dd < 1 || dd > lastDay) return null;
    return `${year}${String(mm).padStart(2, "0")}${String(dd).padStart(2, "0")}`;
  }
  
  type AISpec = { type: "fixed" | "var"; len?: number; max?: number; minLen?: number };
  const AIs: Record<string, AISpec> = {
    "01": { type: "var", minLen: 13, max: 14 }, // GTIN - 13 veya 14 hane
    "17": { type: "fixed", len: 6  }, // DDMMYY
    "10": { type: "var",   max: 20 }, // LOT
    "21": { type: "var",   max: 20 }, // SERIAL
  };
  
  function detectAI(s: string, idx: number): string | null {
    const ai2 = s.slice(idx, idx + 2);
    const ai3 = s.slice(idx, idx + 3);
    const ai4 = s.slice(idx, idx + 4);
    if (AIs[ai2]) return ai2;
    if (AIs[ai3]) return ai3;
    if (AIs[ai4]) return ai4;
    return null;
  }
  
  /** s içinde, [from..from+max) aralığında ilk GEÇERLİ (17) AI başlangıcını bulur */
  function findNext17(s: string, from: number, max: number): number {
    const end = Math.min(s.length, from + max);
    for (let k = from; k < end; k++) {
      if (detectAI(s, k) === "17") return k;
    }
    return -1;
  }
  
  /**
   * Var alan sonunu bulur.
   * - GS varsa GS'e kadar
   * - currentAI === '21' ise, GS'ten önce görünen ilk GEÇERLİ (17) konumunda kes (ITS pratik kuralı)
   * - aksi halde bir sonraki geçerli AI başlangıcında kes
   * - serial içerisine gömülü geçen yeniden '01' varsa ve zaten görüldüyse, onu veri kabul edip ilerle
   */
  function findVarEnd(
    s: string,
    start: number,
    max: number,
    currentAI: "10" | "21",
    seen: Set<string>
  ) {
    const GS = String.fromCharCode(29);
  
    // 1) GS pozisyonu
    const gsIdx = s.indexOf(GS, start);
    const scanLimit = Math.min(s.length, start + max, gsIdx === -1 ? s.length : gsIdx);
  
    // 2) (21) için (17) önceliği
    if (currentAI === "21") {
      const idx17 = findNext17(s, start, max);
      if (idx17 !== -1 && (gsIdx === -1 || idx17 < gsIdx)) {
        return { value: s.slice(start, idx17), nextIndex: idx17 };
      }
    }
  
    // 3) Genel tarama
    let j = start;
    while (j < Math.min(s.length, start + max)) {
      if (s[j] === GS) break;
  
      const ai = detectAI(s, j);
      if (ai) {
        // tekrar (01) sahte tetiklenirse veri kabul et
        if (ai === "01" && seen.has("01")) { j += 1; continue; }
        break; // sonraki gerçek AI bulundu
      }
      j++;
    }
  
    const consumedGS = (s[j] === GS) ? 1 : 0;
    return { value: s.slice(start, j), nextIndex: j + consumedGS };
  }
  
  function parseGS1(raw: string) {
    const GS = String.fromCharCode(29);
    let s = raw.replace(/\u001D/g, GS);
    
    // Parantezli GS1 formatını destekle: (01)8699550011111(21)0000000000010158(10)173350(17)271229
    if (s.includes('(') && s.includes(')')) {
      return parseParenthesizedGS1(s);
    }
    
    const out: Record<string, string> = {};
    const seen = new Set<string>();

    let i = 0;
    while (i < s.length) {
      const ai = detectAI(s, i);
      if (!ai) break;
      i += ai.length;
      const spec = AIs[ai];
      seen.add(ai);

      if (spec.type === "fixed" && spec.len) {
        if (i + spec.len > s.length) break;
        out[ai] = s.slice(i, i + spec.len);
        i += spec.len;
      } else if (spec.type === "var" && spec.max) {
        if (ai === "01") {
          // GTIN özel durumu - 13 veya 14 hane olmalı
          const remainingLength = s.length - i;
          let gtinLength = 0;
          
          // Sonraki AI'ı bul
          let nextAI = -1;
          for (let j = i + 13; j <= Math.min(i + 14, s.length); j++) {
            const testAI = detectAI(s, j);
            if (testAI) {
              nextAI = j;
              gtinLength = j - i;
              break;
            }
          }
          
          // Eğer sonraki AI bulunamazsa, kalan tüm string'i al (ama 13-14 hane ile sınırla)
          if (nextAI === -1) {
            gtinLength = Math.min(remainingLength, 14);
            if (gtinLength < 13) gtinLength = remainingLength; // Eğer 13'ten azsa tümünü al
          }
          
          // 13 veya 14 hane değilse hata
          if (gtinLength !== 13 && gtinLength !== 14) {
            gtinLength = Math.min(Math.max(gtinLength, 13), 14);
          }
          
          out[ai] = s.slice(i, i + gtinLength);
          i += gtinLength;
        } else {
          const { value, nextIndex } = findVarEnd(s, i, spec.max, ai as "10" | "21", seen);
          out[ai] = value;
          i = nextIndex;
        }
      } else {
        break;
      }
    }
    return out;
  }

  function parseParenthesizedGS1(s: string): Record<string, string> {
    const out: Record<string, string> = {};
    
    // Parantez içindeki AI'ları ve değerlerini yakalayalım: (AI)value(AI)value...
    // Daha basit regex: (AI) + sonraki parantheze kadar olan değer
    const regex = /\((\d{2,4})\)([^(]*?)(?=\(|$)/g;
    let match;
    
    while ((match = regex.exec(s)) !== null) {
      const ai = match[1];
      const value = match[2];
      
      if (AIs[ai]) {
        out[ai] = value;
      }
    }
    
    return out;
  }
  
  export function pharmaValidator(input: string) {
    const fields = parseGS1(input);
    const errors: string[] = [];
  
    const gtin   = fields["01"];
    const expiry = fields["17"];
    const lot    = fields["10"];
    const serial = fields["21"];
  
  if (!gtin) {
    errors.push("GTIN (01) eksik");
  }
  // GTIN check digit validation devre dışı
  // else if (!isValidGTIN(gtin)) {
  //   errors.push("GTIN (01) hatalı");
  // }
  
    let expFormatted: string | null = null;
    if (!expiry) {
      errors.push("Son kullanma tarihi (17) eksik");
    } else {
      expFormatted = parseExpiry(expiry);
      if (!expFormatted) errors.push("Son kullanma tarihi (17) hatalı");
    }
  
    if (!lot)    errors.push("Lot (10) eksik");
    if (!serial) errors.push("Seri (21) eksik");
  
    if (errors.length > 0) {
      return { status: false, message: errors.join(", ") };
    }
  
    return {
      status: true,
      gtin,
      exp: expFormatted!,
      lot,
      serial,
    };
  }
  