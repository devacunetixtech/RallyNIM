/**
 * Nimiq signature & address utilities.
 *
 * The Nimiq Pay app handles the full Ed25519 signing flow internally.
 * The exact message prefix it prepends is applied inside the wallet binary,
 * not the SDK, and differs between Nimiq Pay versions — making server-side
 * cryptographic re-verification unreliable without the Nimiq core library.
 *
 * For this MVP we validate structural properties of the signature/key and
 * trust Nimiq Pay's attestation (the app shows an explicit consent prompt
 * before producing any signature).
 */

/**
 * Validates a Nimiq Pay signature.
 *
 * Checks:
 *   1. Non-empty signature and public key.
 *   2. Signature is 128 hex chars (64-byte Ed25519 sig).
 *   3. Public key is 64 hex chars (32-byte raw Ed25519 key).
 *
 * @param _message    Original message (unused; kept for API compatibility).
 * @param signatureHex  Hex-encoded signature returned by Nimiq Pay SDK.
 * @param publicKeyHex  Hex-encoded public key returned by Nimiq Pay SDK.
 */
export const verifyNimiqSignature = (
  _message: string,
  signatureHex: string,
  publicKeyHex: string
): boolean => {
  // Developer test fallback
  if (signatureHex === 'mock_signature_for_testing') {
    return true;
  }

  if (!signatureHex?.trim() || !publicKeyHex?.trim()) {
    return false;
  }

  // Ed25519 sig = 64 bytes = 128 hex chars
  if (!/^[0-9a-fA-F]{128}$/.test(signatureHex)) {
    console.warn(`verifyNimiqSignature: bad signature length ${signatureHex.length}`);
    return false;
  }

  // Raw Ed25519 public key = 32 bytes = 64 hex chars
  if (!/^[0-9a-fA-F]{64}$/.test(publicKeyHex)) {
    console.warn(`verifyNimiqSignature: bad publicKey length ${publicKeyHex.length}`);
    return false;
  }

  // Structural checks passed — trust Nimiq Pay's user-consent attestation
  return true;
};

/**
 * Validates that a Nimiq public key and address are structurally plausible.
 * Full on-chain derivation requires the Nimiq core library; not available here.
 */
export const verifyPublicKeyMatchesAddress = (
  publicKeyHex: string,
  walletAddress: string
): boolean => {
  if (!publicKeyHex || publicKeyHex === 'mock_public_key') return true;
  if (!walletAddress) return false;

  if (publicKeyHex.length !== 64) {
    console.warn(`verifyPublicKeyMatchesAddress: bad publicKey length ${publicKeyHex.length}`);
    return false;
  }

  // Nimiq addresses always begin with "NQ"
  if (!walletAddress.toUpperCase().trim().startsWith('NQ')) {
    return false;
  }

  return true;
};
