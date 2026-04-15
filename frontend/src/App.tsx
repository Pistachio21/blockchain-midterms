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

  // Check if user is on correct network
  const isOnSepolia = chainId === sepolia.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <header className="bg-slate-900/90 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                SocialChain
              </h1>
              <p className="text-xs text-slate-400 -mt-1">Pay-to-Like Platform</p>
            </div>
          </div>
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-white">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                {userEarnings && (
                  <div className="text-xs text-accent-400 font-medium">
                    ✨ {formatEther(userEarnings)} ETH earned
                  </div>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 transition-all duration-200 font-medium text-sm border border-slate-600"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-5 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-200 font-medium"
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
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md p-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Wrong Network Detected
              </h2>
              <p className="text-slate-500 mb-6">
                Please switch to Sepolia testnet to continue
              </p>
              <button
                onClick={handleSwitchToSepolia}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200 font-medium"
              >
                Switch to Sepolia
              </button>
            </div>
          )
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Welcome to SocialChain
            </h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Connect your wallet to start posting, liking, and earning ETH on the blockchain.
            </p>
            <button
              onClick={handleConnect}
              className="px-8 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-200 font-medium text-lg"
            >
              Connect Wallet
            </button>
            <p className="text-xs text-slate-400 mt-4">
              Requires MetaMask or compatible wallet
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
