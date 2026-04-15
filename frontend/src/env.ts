// Frontend environment variables for contract configuration

export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`
export const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '11155111', 10)

if (!contractAddress) {
  throw new Error('VITE_CONTRACT_ADDRESS is not defined in .env.local')
}