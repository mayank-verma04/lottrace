const crypto = require('crypto');

/**
 * Computes a SHA-256 hash for an event payload combined with the previous hash in the chain.
 * @param {Object} eventPayload - The event data to hash (excluding volatile fields)
 * @param {string} prevHash - The hash of the previous event for this organization
 * @returns {string} - The new record_hash
 */
const computeEventHash = (eventPayload, prevHash) => {
  // Create a stable string representation
  // Sort keys to ensure consistent serialization
  const stableStringify = (obj) => {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
    const sortedKeys = Object.keys(obj).sort();
    return `{${sortedKeys.map(k => `"${k}":${stableStringify(obj[k])}`).join(',')}}`;
  };

  const payloadString = stableStringify(eventPayload);
  const dataToHash = `${prevHash}|${payloadString}`;
  
  return crypto.createHash('sha256').update(dataToHash).digest('hex');
};

module.exports = { computeEventHash };
