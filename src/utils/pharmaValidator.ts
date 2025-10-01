// ===============================
// GS1 Pharma Parse & Validate TS
// ===============================

export type PharmaGs1 = {
  gtin?: string;       // (01) 14 hane
  serial?: string;     // (21) 1–20
  lot?: string;        // (10) 1–20
  expiry?: string;     // (17) YYMMDD
  expiryIso?: string;  // YYYY-MM-DD (geçerliyse)
  expiryText?: string; // DD.MM.YYYY (geçerliyse)
  isValidGtin: boolean;
  items: Array<{ ai: "01" | "10" | "17" | "21"; value: string }>;
};

// Hata metinleri (UI'da i18n için uygun)
export const PharmaError = {
  MissingGTIN: "GTIN (01) eksik",
  InvalidGTIN: "GTIN (01) hatalı (Mod10 kontrolü)",
  MissingExpiry: "Son kullanma tarihi (17) eksik",
  InvalidExpiry: "Son kullanma tarihi (17) hatalı (YYMMDD olmalı ve gerçek bir tarih olmalı)",
  MissingLot: "Lot (10) eksik",
  InvalidLotLen: "Lot (10) uzunluğu 1–20 olmalı",
  MissingSerial: "Seri (21) eksik",
  InvalidSerialLen: "Seri (21) uzunluğu 1–20 olmalı",
} as const;

export type PharmaError = typeof PharmaError[keyof typeof PharmaError];

export type PharmaValidationOk = {
  status: true;
  message: "OK";
  errors: [];
  gtin: string;
  exp: string;       // YYYY-MM-DD
  expText: string;   // DD.MM.YYYY
  lot: string;
  serial: string;
  items: Array<{ ai: "01" | "10" | "17" | "21"; value: string }>;
};

export type PharmaValidationErr = {
  status: false;
  message: string;          // virgülle birleştirilmiş hata metinleri
  errors: PharmaError[];    // tek tek hatalar
  gtin?: string;
  exp: string | null;       // YYYY-MM-DD veya null
  expText: string | null;   // DD.MM.YYYY veya null
  lot?: string;
  serial?: string;
  items: Array<{ ai: "01" | "10" | "17" | "21"; value: string }>;
};

export type PharmaValidationResult = PharmaValidationOk | PharmaValidationErr;

// -------------------------------
// Yardımcılar
// -------------------------------

function rawDigit(ch: string): number {
  const n = ch.charCodeAt(0) - 48;
  if (n < 0 || n > 9) throw new Error(`Rakam bekleniyordu, alındı: "${ch}"`);
  return n;
}

/** GTIN-14 Mod10 doğrulaması */
export function validateGTIN14(gtin: string): boolean {
  if (!/^\d{14}$/.test(gtin)) return false;
  let sum = 0, w = 3;
  // Sağdan ikinci haneden sola: 3,1,3,1...
  for (let i = gtin.length - 2; i >= 0; i--) {
    const n = gtin.charCodeAt(i) - 48;
    sum += n * w;
    w = w === 3 ? 1 : 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(gtin[13]);
}

/** YYMMDD'nin geçerli tarih olup olmadığını kontrol eder (2000–2099). */
function isValidYYMMDD(yyMMdd: string): boolean {
  if (!/^\d{6}$/.test(yyMMdd)) return false;
  const yy = Number(yyMMdd.slice(0, 2));
  const mm = Number(yyMMdd.slice(2, 4));
  const dd = Number(yyMMdd.slice(4, 6));
  const yyyy = 2000 + yy;

  if (mm < 1 || mm > 12) return false;

  const daysInMonth = (y: number, m: number) =>
    [31, (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

  if (dd < 1 || dd > daysInMonth(yyyy, mm)) return false;

  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  return (
    d.getUTCFullYear() === yyyy &&
    d.getUTCMonth() === mm - 1 &&
    d.getUTCDate() === dd
  );
}

/** YYMMDD -> YYYY-MM-DD, geçersizse null */
export function parseExpiry(yyMMdd: string): string | null {
  if (!isValidYYMMDD(yyMMdd)) return null;
  const yy = Number(yyMMdd.slice(0, 2));
  const mm = yyMMdd.slice(2, 4);
  const dd = yyMMdd.slice(4, 6);
  const yyyy = 2000 + yy;
  return `${yyyy}-${mm}-${dd}`;
}

/** YYYY-MM-DD -> DD.MM.YYYY (gösterim) */
function toDdMmYyyy(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

// -------------------------------
// GS1 Parsingi
// -------------------------------

/**
 * Sadece (01) GTIN, (17) SKT, (10) Lot, (21) Seri'yi parse eder.
 * FNC1 / GS ayracı: ASCII 29
 */
export function parseGs1Pharma(rawInput: string): PharmaGs1 {
  const GS = String.fromCharCode(29); // FNC1 / Group Separator

  // 1) Normalize
  let raw = (rawInput ?? "").trim();

  // Semboloji tanıtıcıları: ]d2 (GS1 DataMatrix), ]C1 (GS1-128), ]Q3 (GS1 QR)
  if (/^\](d2|D2|C1|Q3)/.test(raw)) raw = raw.slice(3);

  // FNC1 normalizasyonu (bazı okuyucular farklı yazabilir)
  raw = raw
    .replace(/\u001D/g, GS)       // gerçek ASCII 29
    .replace(/<GS>|<FNC1>/gi, GS);// metin temsilleri

  // 2) Hedef AI'ler ve sabit uzunluklar
  const FIXED: Record<"01" | "17", number> = { "01": 14, "17": 6 };
  const KNOWN = new Set<"01" | "10" | "17" | "21">(["01", "10", "17", "21"]);

  const fields: Array<{ ai: "01" | "10" | "17" | "21"; value: string }> = [];
  let i = 0;

  while (i < raw.length) {
    // FNC1 karakterini atla
    if (raw[i] === GS) { i++; continue; }

    // AI (2 hane)
    const ai = raw.slice(i, i + 2) as "01" | "10" | "17" | "21";
    if (!KNOWN.has(ai)) {
      // Hata yerine: bilinmeyen segmentleri nazikçe atla (exception fırlatma!)
      // Bir sonraki GS'ye kadar ilerleyelim:
      let j = i + 2;
      while (j < raw.length && raw[j] !== GS) j++;
      i = (raw[j] === GS) ? j + 1 : j;
      continue;
    }
    i += 2;

    if (ai in FIXED) {
      // Sabit uzunluklu alan
      const n = FIXED[ai as "01" | "17"];
      const value = raw.slice(i, i + n);
      if (value.length < n) {
        // Eksikse bu alanı yok say ve ilerle (exception fırlatma!)
        i = raw.length;
        continue;
      }
      fields.push({ ai, value });
      i += n;
    } else {
      // Değişken uzunluklu alan (10, 21): FNC1 gelene veya akış sonuna kadar
      const start = i;
      let j = i;
      while (j < raw.length && raw[j] !== GS) j++;
      const value = raw.slice(start, j);
      fields.push({ ai, value });
      if (raw[j] === GS) j++; // FNC1'i tüket
      i = j;
    }
  }

  // 3) Alanlara eriş
  const get = (ai: "01" | "10" | "17" | "21") => fields.find(f => f.ai === ai)?.value;

  const gtin   = get("01");
  const serial = get("21");
  const lot    = get("10");
  const expiry = get("17");

  // 4) GTIN doğrulama
  const isValidGtin =
    !!gtin &&
    /^\d{14}$/.test(gtin) &&
    ((): boolean => {
      let sum = 0, w = 3;
      for (let k = 12; k >= 0; k--) {
        const n = rawDigit(gtin[k]);
        sum += n * w;
        w = w === 3 ? 1 : 3;
      }
      const check = (10 - (sum % 10)) % 10;
      return check === Number(gtin[13]);
    })();

  // 5) SKT biçimleri (varsa ve geçerliyse)
  let expiryIso: string | undefined;
  let expiryText: string | undefined;
  const iso = expiry ? parseExpiry(expiry) : null;
  if (iso) {
    expiryIso = iso;
    expiryText = toDdMmYyyy(iso);
  }

  return { gtin, serial, lot, expiry, expiryIso, expiryText, isValidGtin, items: fields };
}

// -------------------------------
// Yüksek seviye doğrulayıcı (Exception YOK)
// -------------------------------

/**
 * Hata varsa bile alanları birlikte döndürür. Exception fırlatmaz.
 */
export function pharmaValidator(input: string): PharmaValidationResult {
  let parsed: PharmaGs1;
  try {
    parsed = parseGs1Pharma(input);
  } catch {
    // Teoride parse artık exception atmıyor; yine de emniyet kemeri:
    return {
      status: false,
      message: "Geçersiz GS1 verisi",
      errors: [
        PharmaError.MissingGTIN,
        PharmaError.MissingExpiry,
        PharmaError.MissingLot,
        PharmaError.MissingSerial,
      ],
      gtin: undefined,
      exp: null,
      expText: null,
      lot: undefined,
      serial: undefined,
      items: [],
    };
  }

  const errors: PharmaError[] = [];

  const gtin   = parsed.gtin;
  const expiry = parsed.expiry;
  const lot    = parsed.lot;
  const serial = parsed.serial;

  // GTIN
  if (!gtin) {
    errors.push(PharmaError.MissingGTIN);
  } else if (!parsed.isValidGtin) {
    errors.push(PharmaError.InvalidGTIN);
  }

  // Expiry
  let expIso: string | null = null;
  let expText: string | null = null;

  if (!expiry) {
    errors.push(PharmaError.MissingExpiry);
  } else {
    expIso = parseExpiry(expiry);
    if (!expIso) {
      errors.push(PharmaError.InvalidExpiry);
    } else {
      expText = toDdMmYyyy(expIso);
    }
  }

  // Lot (10): 1–20 char
  if (!lot) {
    errors.push(PharmaError.MissingLot);
  } else if (lot.length < 1 || lot.length > 20) {
    errors.push(PharmaError.InvalidLotLen);
  }

  // Serial (21): 1–20 char
  if (!serial) {
    errors.push(PharmaError.MissingSerial);
  } else if (serial.length < 1 || serial.length > 20) {
    errors.push(PharmaError.InvalidSerialLen);
  }

  // Başarı/başarısız – ama alanlar her iki durumda da döner
  if (errors.length > 0) {
    return {
      status: false,
      message: errors.join(", "),
      errors,
      gtin,
      exp: expIso,       // geçersizse null
      expText,           // geçersizse null
      lot,
      serial,
      items: parsed.items,
    };
  }

  // Başarılı
  return {
    status: true,
    message: "OK",
    errors: [],
    gtin: gtin!,           // garanti
    exp: expIso!,          // YYYY-MM-DD
    expText: expText!,     // DD.MM.YYYY
    lot: lot!,             // garanti
    serial: serial!,       // garanti
    items: parsed.items,
  };
}

// -------------------------------
// Küçük kullanım örneği
// -------------------------------
// const GS = String.fromCharCode(29);
// const input = "0108699591090129" + "211002212454578965" + GS + "17291031" + "10LT00121";
// console.log(pharmaValidator(input));
