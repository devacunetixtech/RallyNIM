import { init, type NimiqProvider } from '@nimiq/mini-app-sdk';

/**
 * NimiqWalletService
 *
 * Uses the official @nimiq/mini-app-sdk package.
 * - `init()` resolves to a `NimiqProvider` when running inside Nimiq Pay.
 * - `window.nimiq` is injected by the Nimiq Pay host before the page loads.
 * - All methods throw clear errors if called outside Nimiq Pay.
 */

let provider: NimiqProvider | null = null;
let activeAddress: string | null = null;

// Restore address from local storage across page refreshes
if (typeof window !== 'undefined') {
  activeAddress = localStorage.getItem('nimiq_wallet_address');
}

/**
 * Returns true if we are running inside the Nimiq Pay / Minipay host.
 * The host injects `window.nimiq` synchronously before any page script runs.
 */
export function isInsideNimiqPay(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).nimiq);
}

/**
 * Initialise the SDK provider and request the user's wallet address.
 * Must be called from a user gesture (button click).
 */
export async function connectWallet(): Promise<string> {
  // Init the provider — resolves when inside Nimiq Pay, rejects otherwise
  try {
    provider = await init({ timeout: 5000 });
  } catch (err: any) {
    throw new Error(
      'Not running inside Nimiq Pay. Please open this app in the Nimiq Minipay application.'
    );
  }

  // Fetch the list of accounts; the first one is the active address
  const accounts = await provider.listAccounts();

  if (!accounts || (accounts as any).error) {
    throw new Error('Could not retrieve wallet accounts from Nimiq Pay.');
  }

  const address = (accounts as string[])[0];
  if (!address) {
    throw new Error('No accounts found in Nimiq Pay wallet.');
  }

  activeAddress = address;
  localStorage.setItem('nimiq_wallet_address', address);
  return address;
}

/**
 * Sign an arbitrary text message. Returns { publicKey, signature }.
 */
export async function signMessage(message: string): Promise<{ publicKey: string; signature: string }> {
  if (!provider) throw new Error('Wallet not connected. Call connectWallet() first.');

  const result = await provider.sign(message);

  if ((result as any).error) {
    throw new Error((result as any).error.message || 'Failed to sign message.');
  }

  return result as { publicKey: string; signature: string };
}

/**
 * Send a basic NIM transaction.
 * @param recipient  Nimiq address string (with or without spaces)
 * @param amountNIM  Amount in NIM (will be converted to Lunas internally)
 * @param dataHex    Optional hex-encoded extra data string
 */
export async function sendTransaction(
  recipient: string,
  amountNIM: number,
  dataHex?: string
): Promise<string> {
  if (!provider) throw new Error('Wallet not connected. Call connectWallet() first.');

  const lunas = Math.round(amountNIM * 100_000);

  let result: string | { error: any };

  if (dataHex) {
    result = await provider.sendBasicTransactionWithData({
      recipient,
      value: lunas,
      data: dataHex,
    });
  } else {
    result = await provider.sendBasicTransaction({ recipient, value: lunas });
  }

  if (typeof result !== 'string' && (result as any).error) {
    throw new Error((result as any).error.message || 'Transaction failed.');
  }

  return result as string; // transaction hash
}

/**
 * Fetch the live testnet balance for the connected address via the Nimiq RPC.
 */
export async function getBalance(): Promise<number> {
  if (!activeAddress) return 0;

  const normalized = activeAddress.replace(/\s+/g, '');

  try {
    const res = await fetch('https://rpc.testnet.nimiqwatch.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getAccountByAddress',
        params: [normalized],
        id: 1,
      }),
    });

    const data = await res.json();
    if (data?.result?.data?.balance != null) {
      return data.result.data.balance / 100_000;
    }
  } catch (err) {
    console.error('Failed to fetch Nimiq balance:', err);
  }

  return 0;
}

/** Disconnect: clear the cached provider and address. */
export function disconnectWallet() {
  provider = null;
  activeAddress = null;
  localStorage.removeItem('nimiq_wallet_address');
}

/** Return the currently-connected address, or null if not connected. */
export function getActiveAddress(): string | null {
  return activeAddress;
}
