export interface INimiqWalletService {
  connect(): Promise<string>;
  getAccount(): Promise<string | null>;
  signMessage(message: string): Promise<string>;
  sendTransaction(recipient: string, amountInNIM: number, data?: string): Promise<string>;
  getBalance(): Promise<number>;
}

class NimiqWalletService implements INimiqWalletService {
  private activeAddress: string | null = null;

  constructor() {
    // Attempt to restore session address if stored locally
    if (typeof window !== 'undefined') {
      const savedAddress = localStorage.getItem('nimiq_wallet_address');
      if (savedAddress) {
        this.activeAddress = savedAddress;
      }
    }
  }

  async connect(): Promise<string> {
    const win = window as any;
    if (!win.MiniAppSDK) {
      throw new Error('Nimiq Minipay SDK not found. Please open this app inside Nimiq Minipay.');
    }

    try {
      const sdk = win.MiniAppSDK.getInstance();
      const account = await sdk.requestAddress();
      this.activeAddress = account.address;
      localStorage.setItem('nimiq_wallet_address', account.address);
      return account.address;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to request address from Nimiq SDK');
    }
  }

  async getAccount(): Promise<string | null> {
    return this.activeAddress;
  }

  async signMessage(message: string): Promise<string> {
    const win = window as any;
    if (!win.MiniAppSDK) {
      throw new Error('Nimiq Minipay SDK not found.');
    }
    if (!this.activeAddress) {
      throw new Error('No active wallet connected.');
    }

    try {
      const sdk = win.MiniAppSDK.getInstance();
      const signatureResult = await sdk.signMessage({
        message,
        address: this.activeAddress
      });
      return signatureResult.signature;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to sign message using Nimiq SDK');
    }
  }

  async sendTransaction(recipient: string, amountInNIM: number, data?: string): Promise<string> {
    const win = window as any;
    if (!win.MiniAppSDK) {
      throw new Error('Nimiq Minipay SDK not found.');
    }
    if (!this.activeAddress) {
      throw new Error('No active wallet connected.');
    }

    try {
      const sdk = win.MiniAppSDK.getInstance();
      const lunaAmount = amountInNIM * 100000;
      const txResult = await sdk.sendTransaction({
        sender: this.activeAddress,
        recipient,
        value: lunaAmount,
        fee: 0,
        extraData: data ? new TextEncoder().encode(data) : undefined
      });
      return txResult.hash;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to send transaction via Nimiq SDK');
    }
  }

  async getBalance(): Promise<number> {
    if (!this.activeAddress) return 0;
    
    // Normalize address by removing spaces
    const normalized = this.activeAddress.replace(/\s+/g, '');
    
    try {
      const rpcUrl = 'https://rpc.testnet.nimiqwatch.com';
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getAccountByAddress',
          params: [normalized],
          id: 1
        })
      });
      
      const data = await response.json();
      if (data.result) {
        if (data.result.data && typeof data.result.data.balance === 'number') {
          return data.result.data.balance / 100000;
        }
        if (data.result.data === null) {
          return 0;
        }
      }
    } catch (error) {
      console.error('Failed to fetch real balance from Nimiq RPC:', error);
    }

    return 0;
  }

  // Helper method to disconnect
  public disconnect() {
    this.activeAddress = null;
    localStorage.removeItem('nimiq_wallet_address');
  }
}

export const nimiqWallet = new NimiqWalletService();
