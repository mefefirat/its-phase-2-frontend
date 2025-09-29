// Full test with updated pharmaValidator

function isValidGTIN(gtin14) {
    if (!/^\d{14}$/.test(gtin14)) return false;
    const d = gtin14.split("").map(Number);
    const check = d[13];
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const weight = (i % 2 === 0) ? 3 : 1;
      sum += d[12 - i] * weight;
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

function parseParenthesizedGS1(s) {
    const out = {};
    
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

function parseGS1(raw) {
  if (raw.includes('(') && raw.includes(')')) {
    return parseParenthesizedGS1(raw);
  }
  // Normal parsing logic would go here...
  return {};
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
  } else if (!isValidGTIN(gtin)) {
    errors.push("GTIN (01) hatalı");
  }

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

// Test data - your example
const testBarcode = '(01)08699550011111(21)0000000000010158(10)173350(17)271229';
console.log('Testing parenthesized barcode:', testBarcode);

try {
  const result = pharmaValidator(testBarcode);
  console.log('Validation result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n--- Checking individual components ---');
console.log('GTIN:', '08699550011111', 'Valid?', isValidGTIN('08699550011111'));
console.log('Expiry:', '271229', 'Parsed?', parseExpiry('271229'));
