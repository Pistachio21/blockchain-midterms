import { contractAddress, chainId } from '../env'
import { tipPostAbi } from './tipPostAbi'

export const contractConfig = {
  address: contractAddress,
  abi: tipPostAbi,
  chainId,
} as const