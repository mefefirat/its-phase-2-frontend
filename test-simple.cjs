// Test simple regex
function parseParenthesizedGS1(s) {
    const out = {};
    
    console.log('Input:', s);
    
    // Daha basit regex: (AI) + sonraki parantheze kadar olan değer
    const regex = /\((\d{2,4})\)([^(]*?)(?=\(|$)/g;
    let match;
    
    while ((match = regex.exec(s)) !== null) {
      const ai = match[1];
      const value = match[2];
      
      console.log('AI:', ai, 'Value:', value);
      out[ai] = value;
    }
    
    return out;
}

const testBarcode = '(01)8699550011111(21)0000000000010158(10)173350(17)271229';
console.log('Result:', parseParenthesizedGS1(testBarcode));
