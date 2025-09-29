// Test parenthesized parsing
function parseParenthesizedGS1(s) {
    const out = {};
    
    console.log('Input:', s);
    
    // Parantez içindeki AI'ları ve değerlerini yakalayalım: (AI)value(AI)value...
    const regex = /\((\d{2,4})\)([^(]*)/g;
    let match;
    
    while ((match = regex.exec(s)) !== null) {
      const ai = match[1];
      let value = match[2];
      
      console.log('Match found:', match);
      console.log('AI:', ai, 'Raw value:', value);
      
      // Sonraki parantez pozisyonunu bul
      const nextParenPos = s.indexOf('(', match.index + match[0].length);
      console.log('Next paren pos:', nextParenPos);
      
      if (nextParenPos !== -1) {
        // Sonraki paranteze kadar olan kısmı al
        value = s.slice(match.index + match[1].length + 3, nextParenPos);
      } else {
        // Son AI ise, string sonuna kadar al
        value = s.slice(match.index + match[1].length + 3);
      }
      
      console.log('Final value for AI', ai, ':', value);
      out[ai] = value;
      console.log('---');
    }
    
    return out;
}

const testBarcode = '(01)8699550011111(21)0000000000010158(10)173350(17)271229';
console.log('Result:', parseParenthesizedGS1(testBarcode));
