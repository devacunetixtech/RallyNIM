import crypto from 'crypto';
import { config } from '../config/environment';

export class QrService {
  private secretKey: string;

  constructor() {
    this.secretKey = config.jwtSecret; // Reusing secret key
  }

  /**
   * Generates a signed, time-locked QR token.
   */
  public generateDynamicToken(stageId: string): string {
    const timestamp = Date.now();
    const salt = crypto.randomBytes(8).toString('hex');
    const dataToSign = `${stageId}:${timestamp}:${salt}`;
    
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(dataToSign)
      .digest('hex');

    // Return combined token: stageId.timestamp.salt.signature
    return `${stageId}.${timestamp}.${salt}.${signature}`;
  }

  /**
   * Validates a signed QR token and checks for expiration (30 seconds limit).
   */
  public verifyDynamicToken(token: string, expectedStageId: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 4) return false;

      const [stageId, timestampStr, salt, signature] = parts;

      // Validate stage matches
      if (stageId !== expectedStageId) return false;

      // Validate time limit (max 30 seconds expiration)
      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const differenceSeconds = (now - timestamp) / 1000;

      if (differenceSeconds < 0 || differenceSeconds > 30) {
        return false; // Token expired
      }

      // Re-sign to verify authenticity
      const dataToSign = `${stageId}:${timestampStr}:${salt}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(dataToSign)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }
}

export const qrService = new QrService();
