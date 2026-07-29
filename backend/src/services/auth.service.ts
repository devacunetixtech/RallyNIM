import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/environment';
import { User, IUser } from '../models/User';
import { Passport } from '../models/Passport';
import { verifyNimiqSignature, verifyPublicKeyMatchesAddress } from '../utils/crypto';

// In-memory or Redis-based store for temporary authentication nonces
// In production, use Redis. For MVP/Single-day build, a Map is highly efficient.
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

export class AuthService {
  /**
   * Normalizes a Nimiq wallet address by stripping all spacing and lowercasing.
   */
  private normalizeAddress(address: string): string {
    return address.replace(/\s+/g, '').toLowerCase();
  }

  /**
   * Generates a unique nonce for a wallet address and stores it for 5 minutes.
   */
  public generateNonce(walletAddress: string): string {
    const cleanAddress = this.normalizeAddress(walletAddress);
    const nonce = crypto.randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    nonceStore.set(cleanAddress, { nonce, expiresAt });
    return nonce;
  }

  /**
   * Verifies the signature of the nonce and returns a JWT session.
   */
  public async verifySignature(
    walletAddress: string,
    signature: string,
    publicKey: string,
    role?: string
  ): Promise<{ token: string; refreshToken: string; user: IUser }> {
    const cleanAddress = this.normalizeAddress(walletAddress);
    const cachedData = nonceStore.get(cleanAddress);

    if (!cachedData) {
      throw new Error('Nonce not found or expired. Please request a new nonce.');
    }

    if (Date.now() > cachedData.expiresAt) {
      nonceStore.delete(cleanAddress);
      throw new Error('Nonce expired. Please request a new nonce.');
    }

    // Verify Nimiq specific message format
    const expectedMessage = `Sign this message to authenticate with RallyNIM. Nonce: ${cachedData.nonce}`;
    
    // Verify signature
    const isValid = verifyNimiqSignature(expectedMessage, signature, publicKey);
    if (!isValid) {
      throw new Error('Invalid signature. Authentication failed.');
    }

    // Verify public key matches address
    const matchesAddress = verifyPublicKeyMatchesAddress(publicKey, cleanAddress);
    if (!matchesAddress) {
      throw new Error('Public key does not match the provided wallet address.');
    }

    // Nonce is verified, remove from store to prevent replay attacks
    nonceStore.delete(cleanAddress);

    // Fetch or create user
    const searchAddressRegex = new RegExp('^' + cleanAddress.split('').join('\\s*') + '$', 'i');
    let user = await User.findOne({
      $or: [
        { walletAddress: cleanAddress },
        { walletAddress: { $regex: searchAddressRegex } }
      ]
    });

    if (!user) {
      // First-time user: Create/find empty Passport
      let passport = await Passport.findOne({
        $or: [
          { walletAddress: cleanAddress },
          { walletAddress: { $regex: searchAddressRegex } }
        ]
      });

      if (!passport) {
        passport = new Passport({
          walletAddress: cleanAddress,
          eventsAttended: [],
          campaignsCompleted: [],
          totalNIMEarned: 0,
          badges: [],
          achievements: [],
          streak: 0,
        });
        await passport.save();
      } else if (passport.walletAddress !== cleanAddress) {
        // Upgrade legacy spacing format in db
        passport.walletAddress = cleanAddress;
        await passport.save();
      }

      // Create User
      user = new User({
        walletAddress: cleanAddress,
        role: (role as any) || 'participant',
        passportId: passport._id,
      });
      await user.save();
    } else {
      // User found, perform self-healing cleanup if wallet address is not normalized
      let dbUpdated = false;
      if (user.walletAddress !== cleanAddress) {
        user.walletAddress = cleanAddress;
        dbUpdated = true;
      }
      if (role && user.role !== role) {
        user.role = role as any;
        dbUpdated = true;
      }
      if (dbUpdated) {
        await user.save();
      }

      // Also clean up passport if needed
      if (user.passportId) {
        const passport = await Passport.findById(user.passportId);
        if (passport && passport.walletAddress !== cleanAddress) {
          passport.walletAddress = cleanAddress;
          await passport.save();
        }
      }
    }

    // Generate session JWT tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { token, refreshToken, user };
  }

  /**
   * Generates a short-lived access JWT token.
   */
  private generateAccessToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id,
        walletAddress: user.walletAddress,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration as any }
    );
  }

  /**
   * Generates a long-lived refresh JWT token.
   */
  private generateRefreshToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id,
      },
      config.jwtSecret,
      { expiresIn: config.jwtRefreshExpiration as any }
    );
  }

  /**
   * Refreshes access token using a valid refresh token.
   */
  public async refreshSession(refreshToken: string): Promise<{ token: string; user: IUser }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtSecret) as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const token = this.generateAccessToken(user);
      return { token, user };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}

export const authService = new AuthService();
