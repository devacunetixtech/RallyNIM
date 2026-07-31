import axios from 'axios';
import crypto from 'crypto';
import * as Nimiq from '@nimiq/core';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export class NimiqService {
  private rpcUrl: string;
  private escrowAddress: string;

  constructor() {
    this.rpcUrl = config.network === 'mainnet'
      ? 'https://rpc.nimiqwatch.com'
      : 'https://rpc.testnet.nimiqwatch.com';
    this.escrowAddress = config.escrowWalletAddress;
  }

  /**
   * Helper to normalize Nimiq address representation (removes spaces, uppercase)
   */
  private normalizeAddress(address: string | undefined | null): string {
    if (!address) return '';
    return address.replace(/\s+/g, '').toUpperCase();
  }

  /**
   * Verifies a campaign funding transaction on the Nimiq Testnet blockchain.
   */
  public async verifyFundingTransaction(
    txHash: string,
    expectedSender: string,
    expectedAmountInNIM: number,
    campaignId: string
  ): Promise<boolean> {
    try {
      logger.info(`Verifying funding transaction ${txHash} on Nimiq Testnet`);

      // JSON-RPC call to Nimiq Node
      const response = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: '2.0',
          method: 'getTransactionByHash',
          params: [txHash],
          id: 1,
        },
        { timeout: 5000 }
      );

      let tx = response.data?.result;
      if (!tx) {
        throw new Error(`Transaction ${txHash} not found on-chain.`);
      }

      // Handle NimiqWatch wrapped format
      if (tx && tx.data) {
        tx = tx.data;
      }

      // Validate sender
      const cleanSender = this.normalizeAddress(expectedSender);
      const rawSender = tx.fromAddress || tx.from;
      const txSender = this.normalizeAddress(rawSender);
      if (cleanSender !== txSender) {
        throw new Error(`Transaction sender mismatch. Expected ${expectedSender}, got ${rawSender || 'undefined'}`);
      }

      // Validate recipient (Escrow address)
      const cleanEscrow = this.normalizeAddress(this.escrowAddress);
      const rawRecipient = tx.toAddress || tx.to;
      const txRecipient = this.normalizeAddress(rawRecipient);
      if (cleanEscrow !== txRecipient) {
        throw new Error(`Transaction recipient mismatch. Expected Escrow ${this.escrowAddress}, got ${rawRecipient || 'undefined'}`);
      }

      // Validate amount (1 NIM = 100,000 Luna)
      const expectedLuna = expectedAmountInNIM * 100000;
      const txLuna = parseInt(tx.value, 10);
      if (isNaN(txLuna) || txLuna !== expectedLuna) {
        throw new Error(`Transaction amount mismatch. Expected ${expectedLuna} Luna, got ${tx.value} Luna`);
      }

      // Validate campaign ID in extra data
      // Extra data is typically stored as a hex string in the input/data field
      if (tx.data || tx.input) {
        const hexData = tx.data || tx.input;
        if (typeof hexData === 'string') {
          const decodedCampaignId = Buffer.from(hexData.replace(/^0x/, ''), 'hex').toString('utf8');
          if (decodedCampaignId !== campaignId) {
            logger.warn(`Transaction extra data (${decodedCampaignId}) does not match Campaign ID (${campaignId})`);
          }
        }
      }

      logger.info(`Funding transaction verified successfully for Campaign ${campaignId}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to verify transaction on-chain: ${error.message}`);
      throw error;
    }
  }

  /**
   * Broadcasts a payout transaction from the Escrow Hot Wallet to a participant.
   */
  public async executeRewardPayout(
    recipientAddress: string,
    amountInNIM: number
  ): Promise<string> {
    try {
      logger.info(`Initiating payout of ${amountInNIM} NIM to ${recipientAddress}`);

      // Normalization
      const targetAddress = this.normalizeAddress(recipientAddress);

      // Check if hot wallet private key is configured
      if (!config.hotWalletPrivateKey || config.hotWalletPrivateKey.length !== 64) {
        throw new Error('HOT_WALLET_PRIVATE_KEY is not configured or invalid. Cannot execute payout.');
      }

      // Live transaction creation, signing, and broadcasting
      logger.info('Using configured HOT_WALLET_PRIVATE_KEY for live on-chain payout...');
      const privateKey = Nimiq.PrivateKey.deserialize(Buffer.from(config.hotWalletPrivateKey, 'hex'));
      const keyPair = Nimiq.KeyPair.derive(privateKey);
      const senderAddress = keyPair.toAddress();
      const recipient = Nimiq.Address.fromUserFriendlyAddress(targetAddress);
      
      const value = BigInt(Math.round(amountInNIM * 100000)); // NIM to Lunas
      const fee = BigInt(150); // 150 Lunas fee (0.0015 NIM) to ensure validators mine it
      const networkId = config.network === 'mainnet' ? 24 : 5; // MainAlbatross = 24, TestAlbatross = 5

      // Get current block height
      logger.info('Fetching current block height for transaction validity start height...');
      const blockRes = await axios.post(this.rpcUrl, {
        jsonrpc: '2.0',
        method: 'getBlockNumber',
        params: [],
        id: 1
      });
      
      if (blockRes.data.error) {
        throw new Error(`RPC blockNumber query error: ${JSON.stringify(blockRes.data.error)}`);
      }
      
      const blockNumber = blockRes.data.result.data !== undefined 
        ? Number(blockRes.data.result.data) 
        : Number(blockRes.data.result);

      logger.info(`Current block height: ${blockNumber}. Building transaction...`);
      const tx = Nimiq.TransactionBuilder.newBasic(
        senderAddress,
        recipient,
        value,
        fee,
        blockNumber,
        networkId
      );

      // Sign transaction
      keyPair.signTransaction(tx);
      const txHex = tx.toHex();

      logger.info('Broadcasting signed transaction to Nimiq network...');
      const broadcastRes = await axios.post(this.rpcUrl, {
        jsonrpc: '2.0',
        method: 'sendRawTransaction',
        params: [txHex],
        id: 1
      });

      if (broadcastRes.data.error) {
        throw new Error(`RPC sendRawTransaction broadcast error: ${JSON.stringify(broadcastRes.data.error)}`);
      }

      const txHash = broadcastRes.data.result.data !== undefined
        ? broadcastRes.data.result.data
        : broadcastRes.data.result;

      logger.info(`Payout successfully broadcasted. Transaction Hash: ${txHash}`);
      return txHash;
    } catch (error: any) {
      logger.error(`Failed to execute payout: ${error.message}`);
      throw error;
    }
  }
}

export const nimiqService = new NimiqService();
