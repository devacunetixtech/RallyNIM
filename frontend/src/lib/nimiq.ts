import { init, type NimiqProvider } from '@nimiq/mini-app-sdk';
import HubApi from '@nimiq/hub-api';

/**
 * NimiqWalletService
 *
 * Implements a dual-environment wallet architecture:
 * 1. Nimiq Pay App (MiniApp Mode): Injected native RPC bridge via @nimiq/mini-app-sdk.
 * 2. Standard Web Browsers (Desktop/Mobile): Popup-based RPC via @nimiq/hub-api.
 */

let minipayProvider: NimiqProvider | null = null;
let hubApiInstance: HubApi | null = null;
let activeAddress: string | null = null;

// Restore address from local storage across page refreshes
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('nimiq_wallet_address');
  activeAddress = stored ? stored.replace(/\s+/g, '').toLowerCase() : null;
}

/**
 * Helper to convert Uint8Array bytes to hex string
 */
function toHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray, (byte) => ('0' + (byte & 0xff).toString(16)).slice(-2)).join('');
}

/**
 * Helper to convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, (i * 2) + 2), 16);
  }
  return bytes;
}

/**
 * Returns true if we are running inside the Nimiq Pay / Minipay host.
 */
export function isInsideNimiqPay(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).nimiq);
}

const network = import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

/**
 * Get the block explorer transaction link based on network environment
 */
export function getExplorerUrl(txHash: string): string {
  return network === 'mainnet'
    ? `https://nimiq.watch/#/transaction/${txHash}`
    : `https://testnet.nimiq.watch/#/transaction/${txHash}`;
}

/**
 * Get or initialize the standard Nimiq Hub API client
 */
function getHubApi(): HubApi {
  if (!hubApiInstance) {
    const hubUrl = network === 'mainnet' ? 'https://hub.nimiq.com' : 'https://hub.nimiq-testnet.com';
    hubApiInstance = new HubApi(hubUrl);
  }
  return hubApiInstance;
}

/**
 * Automatically query the injected Nimiq Pay provider on load to get the active account address.
 */
export async function syncNimiqPayAddress(): Promise<string | null> {
  if (!isInsideNimiqPay()) return null;
  try {
    if (!minipayProvider) {
      minipayProvider = await init({ timeout: 2000 });
    }
    if (minipayProvider) {
      const accounts = await minipayProvider.listAccounts();
      if (accounts && !(accounts as any).error && (accounts as string[]).length > 0) {
        const address = (accounts as string[])[0];
        const normalized = address.replace(/\s+/g, '').toLowerCase();
        activeAddress = normalized;
        localStorage.setItem('nimiq_wallet_address', normalized);
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Failed to sync Nimiq Pay address:', err);
  }
  return null;
}

/**
 * Connect the wallet. Automatically detects environment and uses the appropriate provider.
 */
export async function connectWallet(): Promise<string> {
  if (isInsideNimiqPay()) {
    // 1. Nimiq Pay MiniApp Flow
    try {
      minipayProvider = await init({ timeout: 5000 });
    } catch (err: any) {
      console.warn('MiniApp SDK init failed, falling back to Hub API:', err);
      return connectViaHub();
    }

    const accounts = await minipayProvider.listAccounts();
    if (!accounts || (accounts as any).error) {
      throw new Error('Could not retrieve wallet accounts from Nimiq Pay.');
    }

    const address = (accounts as string[])[0];
    if (!address) {
      throw new Error('No accounts found in Nimiq Pay wallet.');
    }

    const normalized = address.replace(/\s+/g, '').toLowerCase();
    activeAddress = normalized;
    localStorage.setItem('nimiq_wallet_address', normalized);
    return normalized;
  } else {
    // 2. Standard Web Browser / Desktop Flow
    return connectViaHub();
  }
}

/**
 * Connect wallet using Nimiq Hub API popup
 */
async function connectViaHub(): Promise<string> {
  const result = await getHubApi().chooseAddress({
    appName: 'RallyNIM',
  });

  if (!result || !result.address) {
    throw new Error('No address selected from Nimiq Hub.');
  }

  const normalized = result.address.replace(/\s+/g, '').toLowerCase();
  activeAddress = normalized;
  localStorage.setItem('nimiq_wallet_address', normalized);
  return normalized;
}

/**
 * Formats a raw Nimiq address into user-friendly uppercase spaced format
 */
export function toUserFriendlyAddress(address: string): string {
  const clean = address.replace(/\s+/g, '').toUpperCase();
  const groups = clean.match(/.{1,4}/g);
  return groups ? groups.join(' ') : address;
}

/**
 * Sign an arbitrary message. Automatically chooses the active environment provider.
 */
export async function signMessage(message: string): Promise<{ publicKey: string; signature: string }> {
  if (isInsideNimiqPay()) {
    // Nimiq Pay MiniApp Flow
    if (!minipayProvider) {
      minipayProvider = await init({ timeout: 5000 });
    }
    const result = await minipayProvider.sign(message);
    if ((result as any).error) {
      throw new Error((result as any).error.message || 'Failed to sign message.');
    }
    return result as { publicKey: string; signature: string };
  } else {
    // Standard Web Browser / Desktop Flow
    const formattedSigner = activeAddress ? toUserFriendlyAddress(activeAddress) : undefined;
    const encodedMessage = new TextEncoder().encode(message);

    try {
      const result = await getHubApi().signMessage({
        appName: 'RallyNIM',
        message: encodedMessage,
        signer: formattedSigner,
      });

      if (!result) {
        throw new Error('Message signing cancelled or failed.');
      }

      // If signer was returned, synchronize the activeAddress
      if (result.signer) {
        const normalizedSigner = result.signer.replace(/\s+/g, '').toLowerCase();
        if (activeAddress !== normalizedSigner) {
          activeAddress = normalizedSigner;
          localStorage.setItem('nimiq_wallet_address', normalizedSigner);
        }
      }

      return {
        publicKey: toHexString(result.signerPublicKey),
        signature: toHexString(result.signature),
      };
    } catch (err: any) {
      console.warn('signMessage failed with signer constraint, retrying without signer parameter:', err);

      // Fallback: request signature without signer constraint (lets user choose their account in Hub)
      const result = await getHubApi().signMessage({
        appName: 'RallyNIM',
        message: encodedMessage,
      });

      if (!result) {
        throw new Error('Message signing cancelled or failed.');
      }

      // Synchronize the activeAddress with the selected signer
      if (result.signer) {
        const normalizedSigner = result.signer.replace(/\s+/g, '').toLowerCase();
        activeAddress = normalizedSigner;
        localStorage.setItem('nimiq_wallet_address', normalizedSigner);
      }

      return {
        publicKey: toHexString(result.signerPublicKey),
        signature: toHexString(result.signature),
      };
    }
  }
}

/**
 * Send a NIM transaction.
 * @param recipient  Nimiq address string (with or without spaces)
 * @param amountNIM  Amount in NIM
 * @param dataHex    Optional hex-encoded extra data string
 */
export async function sendTransaction(
  recipient: string,
  amountNIM: number,
  dataHex?: string
): Promise<string> {
  const lunas = Math.round(amountNIM * 100_000);

  if (isInsideNimiqPay()) {
    // Nimiq Pay MiniApp Flow
    if (!minipayProvider) {
      minipayProvider = await init({ timeout: 5000 });
    }

    let result: string | { error: any };
    if (dataHex) {
      result = await minipayProvider.sendBasicTransactionWithData({
        recipient,
        value: lunas,
        data: dataHex,
      });
    } else {
      result = await minipayProvider.sendBasicTransaction({ recipient, value: lunas });
    }

    if (typeof result !== 'string' && (result as any).error) {
      throw new Error((result as any).error.message || 'Transaction failed.');
    }

    return result as string; // transaction hash
  } else {
    // Standard Web Browser / Desktop Flow via Hub checkout popup
    const result = await getHubApi().checkout({
      appName: 'RallyNIM',
      recipient,
      value: lunas,
      extraData: dataHex ? hexToBytes(dataHex) : undefined,
    });

    if (!result || !result.hash) {
      throw new Error('Transaction cancelled or failed.');
    }

    return result.hash;
  }
}

/**
 * Fetch the live balance for the connected address via the Nimiq RPC.
 */
export async function getBalance(): Promise<number> {
  if (!activeAddress) return 0;

  const normalized = activeAddress.replace(/\s+/g, '').toUpperCase();

  // If inside Nimiq Pay, try querying their injected provider first to bypass any webview/CORS restrictions
  if (isInsideNimiqPay()) {
    try {
      if (!minipayProvider) {
        minipayProvider = await init({ timeout: 2000 });
      }
      if (minipayProvider) {
        // Ensure provider has an RPC URL configured. If not, set it to our default testnet/mainnet node.
        const hasRpc = minipayProvider.getRPC();
        if (!hasRpc) {
          const defaultRpc = network === 'mainnet' ? 'https://rpc.nimiqwatch.com' : 'https://rpc.testnet.nimiqwatch.com';
          minipayProvider.setRPCUrl(defaultRpc);
        }

        const data = await minipayProvider.request<any>({
          method: 'getAccountByAddress',
          params: [normalized],
        });
        if (data && data.balance != null) {
          return data.balance / 100_000;
        }
      }
    } catch (err) {
      console.warn('Nimiq Pay balance request failed, falling back to standard fetch:', err);
    }
  }

  // Fallback / Standard Web Browser Flow
  const rpcUrl = network === 'mainnet' ? 'https://rpc.nimiqwatch.com' : 'https://rpc.testnet.nimiqwatch.com';

  try {
    const res = await fetch(rpcUrl, {
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
  minipayProvider = null;
  activeAddress = null;
  localStorage.removeItem('nimiq_wallet_address');
}

/** Return the currently-connected address, or null if not connected. */
export function getActiveAddress(): string | null {
  return activeAddress;
}
