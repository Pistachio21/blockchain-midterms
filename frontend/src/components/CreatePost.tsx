import { useEffect, useState, useRef } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useAccount, useChainId } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { contractConfig } from '../contracts'

interface CreatePostProps {
  onPostCreated: () => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const wagmiChainId = useChainId()
  const { connector } = useAccount()
  const { switchChain } = useSwitchChain()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash,
  })
  const currentChainId = wagmiChainId
  const isOnSepolia = currentChainId === sepolia.id

  // Track success for reset handling
  const prevSuccessRef = useRef(isSuccess)

  const handleSwitchToSepolia = () => {
    switchChain({ chainId: sepolia.id })
  }

  // Handle transaction success - check for state change
  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current) {
      // Use requestAnimationFrame to avoid synchronous setState
      requestAnimationFrame(() => {
        setImageUrl('')
        setCaption('')
        setIsSubmitting(false)
        setError('')
        onPostCreated()
      })
    }
    prevSuccessRef.current = isSuccess
  }, [isSuccess, onPostCreated])

  // Debug logging
  useEffect(() => {
    console.log('Wagmi detected chainId:', currentChainId, 'Expected:', sepolia.id)
  }, [currentChainId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim() || !caption.trim()) return

    // Get the actual chain from the wallet connector directly
    let walletActualChainId: number | undefined
    try {
      walletActualChainId = await connector?.getChainId()
    } catch {
      // Fallback to wagmi chainId if connector fails
      walletActualChainId = currentChainId
    }

    console.log('Submitting - Wagmi chain:', currentChainId, 'Wallet actual:', walletActualChainId)

    // Double check against both wagmi AND the actual wallet
    if (walletActualChainId !== sepolia.id) {
      setError(`Wrong network! Please switch your wallet to Sepolia. Currently on: ${walletActualChainId === 1 ? 'Ethereum Mainnet' : 'Chain ' + walletActualChainId}`)
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      console.log('Calling writeContract with address:', contractConfig.address)
      const result = writeContract({
        ...contractConfig,
        chainId: sepolia.id,
        functionName: 'createPost',
        args: [imageUrl.trim(), caption.trim()],
      })
      console.log('writeContract result:', result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Error creating post:', message)
      setError('Failed to create post. ' + message)
      setIsSubmitting(false)
    }
  }

  // Handle transaction errors
  const displayError = writeError?.message || txError?.message || error

  const isLoading = isPending || isConfirming || isSubmitting

  // If not on Sepolia, show only the switch network UI and do not render the form
  if (!isOnSepolia) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md p-6 mb-8 animate-fade-in">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Create New Post</h2>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            Please switch to Sepolia testnet
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Current: {currentChainId === 1 ? 'Ethereum Mainnet' : currentChainId === 11155111 ? 'Sepolia' : `Chain ${currentChainId}`}
          </p>
          <button
            onClick={handleSwitchToSepolia}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200 font-medium"
          >
            Switch to Sepolia
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md p-6 mb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Create New Post</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all duration-200"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-slate-700 mb-2">
            Caption
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write your caption here..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all duration-200 resize-none"
            required
            disabled={isLoading}
          />
        </div>
        {displayError && (
          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {displayError}
          </div>
        )}
        {hash && (
          <div className="text-sm mt-2">
            <span className={txError ? 'text-red-500' : 'text-slate-500'}>
              <span className="font-mono">Tx: {hash.slice(0, 10)}...{hash.slice(-8)}</span>
              <span className="ml-2">
                {isConfirming ? '⏳ Confirming...' : isPending ? '⏳ Signing...' : ''}
                {txError && ' ❌ Failed'}
              </span>
            </span>
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading || !imageUrl.trim() || !caption.trim()}
          className="w-full bg-gradient-to-r from-accent-500 to-accent-600 text-white py-3 px-4 rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Post...
            </span>
          ) : 'Create Post'}
        </button>
      </form>
      {imageUrl && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-600 mb-3">Preview:</p>
          <div className="relative overflow-hidden rounded-xl bg-slate-100">
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-full h-auto max-h-64 object-contain"
              onLoad={(e) => {
                (e.target as HTMLImageElement).classList.remove('hidden')
              }}
              onError={(e) => {
                const img = e.target as HTMLImageElement
                img.style.display = 'none'
                const container = img.parentElement
                if (container) {
                  const errorText = container.querySelector('.preview-error')
                  if (!errorText) {
                    const error = document.createElement('p')
                    error.className = 'preview-error text-red-500 text-sm p-4'
                    error.textContent = '⚠️ Failed to load image'
                    container.appendChild(error)
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}