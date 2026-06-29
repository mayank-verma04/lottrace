// Parse GS1 Application Identifiers from structured barcodes
const GS1_AIS = {
  '01': { key: 'gtin', length: 14 },
  '10': { key: 'lotCode', variable: true },
  '11': { key: 'prodDate', length: 6 },
  '17': { key: 'expDate', length: 6 },
  '30': { key: 'quantity', variable: true },
};

export const parseGS1 = (rawCode) => {
  const result = { raw: rawCode };
  let code = rawCode;
  
  // Clean FNC1 starting prefixes (e.g., ]C1)
  if (code.startsWith(']C1')) {
    code = code.substring(3);
  }

  // GS1-128 parsing
  let pos = 0;
  let looksLikeGS1 = false;
  
  while (pos < code.length) {
    const ai = code.substring(pos, pos + 2);
    const def = GS1_AIS[ai];
    
    if (def) {
      looksLikeGS1 = true;
      pos += 2;
      
      if (def.variable) {
        // Find next GS/FNC1 separator (\x1D)
        const endIdx = code.indexOf('\x1D', pos);
        if (endIdx === -1) {
          result[def.key] = code.substring(pos);
          break; // end of string
        } else {
          result[def.key] = code.substring(pos, endIdx);
          pos = endIdx + 1;
        }
      } else {
        result[def.key] = code.substring(pos, pos + def.length);
        pos += def.length;
      }
    } else {
      // Unknown AI: cannot determine length, so stop parsing
      break;
    }
  }

  // Fallback: if not parsed as GS1, assume the raw code is the lot code
  if (!looksLikeGS1 && !result.lotCode) {
    result.lotCode = rawCode;
  }
  
  return result;
};
