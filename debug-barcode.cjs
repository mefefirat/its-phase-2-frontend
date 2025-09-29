// Debug script
function parseGS1Debug(raw) {
  const GS = String.fromCharCode(29);
  let s = raw.replace(/\u001D/g, GS);
  
  console.log('Original input:', raw);
  
  // Parantezli GS1 formatını destekle: (01)8699550011111(21)0000000000010158(10)173350(17)271229
  // Eğer input parantezli formatdaysa, parantezleri kaldır
  if (s.includes('(') && s.includes(')')) {
    console.log('Detected parenthesized format');
    s = s.replace(/\((\d{2,4})\)/g, '$1');
    console.log('After removing parentheses:', s);
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
    console.log(`Detecting AI at position ${idx}: ai2=${ai2}, ai3=${ai3}, ai4=${ai4}`);
    if (AIs[ai2]) return ai2;
    if (AIs[ai3]) return ai3;
    if (AIs[ai4]) return ai4;
    return null;
  }
  
  const out = {};
  let i = 0;
  
  while (i < s.length) {
    console.log(`\n--- Position ${i}, remaining: '${s.slice(i)}' ---`);
    const ai = detectAI(s, i);
    if (!ai) {
      console.log('No AI detected, breaking');
      break;
    }
    
    console.log(`Found AI: ${ai}`);
    i += ai.length;
    const spec = AIs[ai];
    
    if (spec.type === "fixed" && spec.len) {
      if (i + spec.len > s.length) {
        console.log(`Not enough data for fixed AI ${ai}, need ${spec.len} chars from position ${i}`);
        break;
      }
      const value = s.slice(i, i + spec.len);
      out[ai] = value;
      console.log(`Fixed AI ${ai}: '${value}'`);
      i += spec.len;
    } else if (spec.type === "var" && spec.max) {
      // Simplified var parsing for debug
      let endPos = i;
      while (endPos < s.length && endPos < i + spec.max) {
        const nextAI = detectAI(s, endPos);
        if (nextAI) break;
        endPos++;
      }
      const value = s.slice(i, endPos);
      out[ai] = value;
      console.log(`Var AI ${ai}: '${value}'`);
      i = endPos;
    }
  }
  
  console.log('\nFinal parsed fields:', out);
  return out;
}

// Test
const testBarcode = '(01)8699550011111(21)0000000000010158(10)173350(17)271229';
parseGS1Debug(testBarcode);
