import { http, createConfig } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Use public Sepolia RPC - faster than default
const SEPOLIA_RPC = 'https://rpc.sepolia.org'

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
    [mainnet.id]: http(),
  },
})