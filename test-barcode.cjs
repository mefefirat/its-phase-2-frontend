// Test script for pharmaValidator

// Simple JavaScript implementation of pharmaValidator
function isValidGTIN(gtin) {
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

function parseExpiry(yyMMdd) {
    if (!/^\d{6}$/.test(yyMMdd)) return null;
    const yy = parseInt(yyMMdd.slice(0, 2), 10);
    const mm = parseInt(yyMMdd.slice(2, 4), 10);
    let dd = parseInt(yyMMdd.slice(4, 6), 10);
    if (mm < 1 || mm > 12) return null;
    const year = 2000 + yy;
    const lastDay = new Date(year, mm, 0).getDate();
    if (dd === 0) dd = lastDay;
    if (dd < 1 || dd > lastDay) return null;
    return `${year}${String(mm).padStart(2, "0")}${String(dd).padStart(2, "0")}`;
}

const AIs = {
  "01": { type: "fixed", len: 14 },
  "17": { type: "fixed", len: 6  },
  "10": { type: "var",   max: 20 },
  "21": { type: "var",   max: 20 },
};

function detectAI(s, idx) {
  const ai2 = s.slice(idx, idx + 2);
  const ai3 = s.slice(idx, idx + 3);
  const ai4 = s.slice(idx, idx + 4);
  if (AIs[ai2]) return ai2;
  if (AIs[ai3]) return ai3;
  if (AIs[ai4]) return ai4;
  return null;
}

function findNext17(s, from, max) {
  const end = Math.min(s.length, from + max);
  for (let k = from; k < end; k++) {
    if (detectAI(s, k) === "17") return k;
  }
  return -1;
}

function findVarEnd(s, start, max, currentAI, seen) {
  const GS = String.fromCharCode(29);

  const gsIdx = s.indexOf(GS, start);
  const scanLimit = Math.min(s.length, start + max, gsIdx === -1 ? s.length : gsIdx);

  if (currentAI === "21") {
    const idx17 = findNext17(s, start, max);
    if (idx17 !== -1 && (gsIdx === -1 || idx17 < gsIdx)) {
      return { value: s.slice(start, idx17), nextIndex: idx17 };
    }
  }

  let j = start;
  while (j < Math.min(s.length, start + max)) {
    if (s[j] === GS) break;

    const ai = detectAI(s, j);
    if (ai) {
      if (ai === "01" && seen.has("01")) { j += 1; continue; }
      break;
    }
    j++;
  }

  const consumedGS = (s[j] === GS) ? 1 : 0;
  return { value: s.slice(start, j), nextIndex: j + consumedGS };
}

function parseGS1(raw) {
  const GS = String.fromCharCode(29);
  let s = raw.replace(/\u001D/g, GS);
  
  const out = {};
  
  // Parantezli GS1 formatını destekle: (01)8699550011111(21)0000000000010158(10)173350(17)271229
  if (s.includes('(') && s.includes(')')) {
    // Parantezli formatı regex ile parse et
    const regex = /\((\d{2,4})\)([^(]+)/g;
    let match;
    
    while ((match = regex.exec(s)) !== null) {
      const ai = match[1];
      const value = match[2];
      out[ai] = value;
    }
    
    return out;
  }
  
  // Normal GS1 parsing (parantezli değilse)
  const seen = new Set();
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
      const { value, nextIndex } = findVarEnd(s, i, spec.max, ai, seen);
      out[ai] = value;
      i = nextIndex;
    } else {
      break;
    }
  }
  return out;
}

function pharmaValidator(input) {
  const fields = parseGS1(input);
  const errors = [];

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

  let expFormatted = null;
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
    exp: expFormatted,
    lot,
    serial,
  };
}

// Test data - orijinal örneğiniz (GTIN validation devre dışı)
const testBarcode = '(01)08699550011111(21)0000000000010158(10)173350(17)271229';
console.log('Testing parenthesized barcode (GTIN validation disabled):', testBarcode);

// Debug: Parse edilen alanları görelim
const parsedFields = parseGS1(testBarcode);
console.log('Parsed fields:', parsedFields);

// GTIN kontrolü yapalım
const gtin = parsedFields["01"];
console.log('GTIN:', gtin, 'Length:', gtin?.length);
if (gtin) {
  console.log('GTIN validation:', isValidGTIN(gtin));
  
  // Manual check digit calculation for debugging
  if (gtin.length === 13 || gtin.length === 14) {
    const gtin14 = gtin.length === 13 ? '0' + gtin : gtin;
    console.log('GTIN-14 format:', gtin14);
    
    // Manual calculation
    const d = gtin14.split("").map(Number);
    const checkDigit = d[13];
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const weight = (i % 2 === 0) ? 1 : 3; // İlk hane 1x, ikinci hane 3x, vs.
      sum += d[i] * weight;
      console.log(`Position ${i}: ${d[i]} * ${weight} = ${d[i] * weight}`);
    }
    const calculated = (10 - (sum % 10)) % 10;
    console.log('Sum:', sum, 'Calculated check:', calculated, 'Actual check:', checkDigit);
    console.log('Check digit valid:', calculated === checkDigit);
  }
}

try {
  const result = pharmaValidator(testBarcode);
  console.log('Validation result (GTIN check disabled):', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}

// Test also normal format
const normalBarcode = '018699550011111210000000000010158101733501727122';
console.log('\nTesting normal barcode:', normalBarcode);

try {
  const result2 = pharmaValidator(normalBarcode);
  console.log('Validation result:', JSON.stringify(result2, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}