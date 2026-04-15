import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Use same RPC as backend for consistency
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({
      // Force wallet to use the correct chain
      shimDisconnect: false,
    }),
  ],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
  },
})