// Parse GS1 Application Identifiers from structured barcodes
const GS1_AIS = {
  '01': 'gtin',     // 14 digits
  '10': 'lotCode',  // variable length
  '11': 'prodDate', // YYMMDD
  '17': 'expDate',  // YYMMDD
  '30': 'quantity', // variable
};

export const parseGS1 = (rawCode) => {
  // Try to extract AIs — fall back to raw code if not GS1
  const result = { raw: rawCode };
  // GS1 codes start with FNC1 or are structured with AIs
  // Simple check: if code starts with known AI
  if (/^\d{2}/.test(rawCode)) {
    // Attempt AI parsing
    let pos = 0;
    while (pos < rawCode.length) {
      const ai = rawCode.substring(pos, pos + 2);
      if (GS1_AIS[ai]) {
        // Simple extraction for lot code (AI 10)
        if (ai === '10') {
          // AI 10 is variable length up to FNC1 or end
          // In a simplified parsing, we'll assume it's the rest of the string for now,
          // or needs to be properly split if FNC1 is present.
          result[GS1_AIS[ai]] = rawCode.substring(pos + 2);
          break;
        } else if (ai === '01') {
          result[GS1_AIS[ai]] = rawCode.substring(pos + 2, pos + 16);
          pos += 16;
        } else {
          // Other variable or fixed length extraction logic would go here
          break;
        }
      } else {
        break;
      }
    }
  }
  return result;
};
