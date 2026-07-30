import { Client, ClientConfiguration } from '@nimiq/core';

async function main() {
  const config = new ClientConfiguration();
  config.network('testalbatross');
  const built = config.build();
  console.log('Built configuration networkId:', built.networkId);
  console.log('Built configuration network_id:', (built as any).network_id);
}

main().catch(console.error);
