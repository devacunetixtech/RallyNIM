import axios from 'axios';

async function main() {
  const rpcUrl = 'https://rpc.testnet.nimiqwatch.com';
  // Lowercase address
  const address = 'NQ51 3QKM SJGD DU04 S4E6 3RU1 TF1Q D3M5 N610'.replace(/\s+/g, '').toLowerCase();
  
  console.log('Lowercase address:', address);

  try {
    const res = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      method: 'getAccountByAddress',
      params: [address],
      id: 1,
    });
    console.log('getAccountByAddress response:', JSON.stringify(res.data));
  } catch (err: any) {
    console.error('getAccountByAddress error:', err.message);
  }
}

main().catch(console.error);
