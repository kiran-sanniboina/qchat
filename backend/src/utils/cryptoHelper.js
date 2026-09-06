const crypto = require('crypto');

/**
 * Derives a 256-bit AES key from a string or hex material using SHA-256
 */
function deriveKey(keyMaterial) {
  return crypto.createHash('sha256').update(keyMaterial).digest();
}

/**
 * Computes SHA-256 message hash
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 */
function encryptAESGCM(plaintext, keyMaterial) {
  const key = deriveKey(keyMaterial);
  const iv = crypto.randomBytes(12); // 96-bit standard IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    combined: Buffer.concat([encrypted, tag]).toString('base64')
  };
}

/**
 * Decrypts AES-256-GCM encrypted payload
 */
function decryptAESGCM(payload, keyMaterial) {
  try {
    const key = deriveKey(keyMaterial);
    const iv = Buffer.from(payload.iv, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error('AES-GCM Decryption failed: invalid key, ciphertext, or auth tag.');
  }
}

module.exports = {
  deriveKey,
  sha256,
  encryptAESGCM,
  decryptAESGCM
};

