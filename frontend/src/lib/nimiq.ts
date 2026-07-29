export interface INimiqWalletService {
  connect(): Promise<string>;
  getAccount(): Promise<string | null>;
  signMessage(message: string): Promise<string>;
  sendTransaction(recipient: string, amountInNIM: number, data?: string): Promise<string>;
  getBalance(): Promise<number>;
  isMock(): boolean;
}

class NimiqWalletService implements INimiqWalletService {
  private activeAddress: string | null = null;
  private mockBalance: number = 250; // Initial mock NIM balance
  private isMockConnection: boolean = true;

  constructor() {
    // Attempt to restore session address if stored locally
    if (typeof window !== 'undefined') {
      const savedAddress = localStorage.getItem('nimiq_wallet_address');
      if (savedAddress) {
        this.activeAddress = savedAddress;
        this.isMockConnection = localStorage.getItem('nimiq_wallet_is_mock') === 'true';
      }
    }
  }

  isMock(): boolean {
    return this.isMockConnection;
  }

  async connect(): Promise<string> {
    // Check if the Nimiq MiniAppSDK is present on the window
    const win = window as any;
    if (win.MiniAppSDK) {
      try {
        const sdk = win.MiniAppSDK.getInstance();
        const account = await sdk.requestAddress();
        this.activeAddress = account.address;
        this.isMockConnection = false;
        localStorage.setItem('nimiq_wallet_address', account.address);
        localStorage.setItem('nimiq_wallet_is_mock', 'false');
        return account.address;
      } catch (error) {
        console.error('Nimiq SDK request address failed, falling back to mock:', error);
      }
    }

    // Interactive developer fallback:
    // Prompt the user for an address or generate a random beautiful address
    let mockAddress = this.activeAddress;
    if (!mockAddress) {
      const randomHex = Array.from({ length: 9 }, () => 
        Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      ).join(' ');
      mockAddress = `NQ${randomHex}`;
      this.activeAddress = mockAddress;
      this.isMockConnection = true;
      localStorage.setItem('nimiq_wallet_address', mockAddress);
      localStorage.setItem('nimiq_wallet_is_mock', 'true');
    }
    
    return mockAddress;
  }

  async getAccount(): Promise<string | null> {
    return this.activeAddress;
  }

  async signMessage(message: string): Promise<string> {
    const win = window as any;
    if (win.MiniAppSDK && this.activeAddress && !this.activeAddress.startsWith('NQ00')) {
      try {
        const sdk = win.MiniAppSDK.getInstance();
        const signatureResult = await sdk.signMessage({
          message,
          address: this.activeAddress
        });
        return signatureResult.signature;
      } catch (error) {
        console.error('Nimiq SDK sign message failed, falling back to mock:', error);
      }
    }

    // Fallback Mock signature for local developer server
    return 'mock_signature_for_testing';
  }

  async sendTransaction(recipient: string, amountInNIM: number, data?: string): Promise<string> {
    const win = window as any;
    if (win.MiniAppSDK && this.activeAddress && !this.activeAddress.startsWith('NQ00')) {
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
      } catch (error) {
        console.error('Nimiq SDK send transaction failed, falling back to mock:', error);
      }
    }

    // Mock payout transaction deduction
    if (this.mockBalance >= amountInNIM) {
      this.mockBalance -= amountInNIM;
    }
    
    // Return mock transaction hash
    const randomHash = 'nq_tx_mock_' + Math.random().toString(36).substring(2, 15);
    return randomHash;
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
      console.error('Failed to fetch real balance from Nimiq RPC, using fallback:', error);
    }

    return this.mockBalance;
  }

  // Helper method to disconnect
  public disconnect() {
    this.activeAddress = null;
    localStorage.removeItem('nimiq_wallet_address');
  }
}

export const nimiqWallet = new NimiqWalletService();
