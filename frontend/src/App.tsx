import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useReadContract } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { sepolia } from 'wagmi/chains'
import { useState } from 'react'
import { formatEther } from 'viem'
import { CreatePost } from '../src/components/CreatePost'
import { PostFeed } from '../src/components/PostFeed'
import { contractConfig } from './contracts'

function App() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [refreshFeed, setRefreshFeed] = useState(0)

  const { data: userEarnings } = useReadContract({
    ...contractConfig,
    functionName: 'totalEarnedByUser',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const handleConnect = () => {
    connect({ connector: injected() })
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const handleSwitchToSepolia = () => {
    switchChain({ chainId: sepolia.id })
  }

  const isOnSepolia = chainId === sepolia.id

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Pay-to-Like Social Platform</h1>
          {isConnected ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                {userEarnings && (
                  <div className="text-xs text-green-600">
                    💰 {formatEther(userEarnings)} ETH earned
                  </div>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isConnected ? (
          isOnSepolia ? (
            <>
              <CreatePost onPostCreated={() => setRefreshFeed(prev => prev + 1)} />
              <PostFeed refreshTrigger={refreshFeed} />
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Please switch to Sepolia testnet
              </h2>
              <button
                onClick={handleSwitchToSepolia}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-lg"
              >
                Switch to Sepolia
              </button>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Connect your wallet to start posting and liking
            </h2>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
