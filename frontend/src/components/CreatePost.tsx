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
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            Please switch to Sepolia testnet to create posts
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Current network: {currentChainId === 1 ? 'Ethereum Mainnet' : currentChainId === 11155111 ? 'Sepolia' : `Chain ${currentChainId}`}
          </p>
          <button
            onClick={handleSwitchToSepolia}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-lg"
          >
            Switch to Sepolia
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
            Caption
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write your caption here..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
            disabled={isLoading}
          />
        </div>
        {displayError && (
          <div className="text-red-500 text-sm mt-2">
            {displayError}
          </div>
        )}
        {hash && (
          <div className="text-xs mt-2">
            <span className={txError ? 'text-red-500' : 'text-gray-500'}>
              Tx: {hash.slice(0, 10)}...{hash.slice(-8)}
              <span className="ml-2">
                {isConfirming ? '⏳ Confirming...' : isPending ? '⏳ Signing...' : ''}
                {txError && ' ❌ Failed: ' + txError.message}
              </span>
            </span>
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading || !imageUrl.trim() || !caption.trim()}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Creating Post...' : 'Create Post'}
        </button>
      </form>
      {imageUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full h-auto max-h-48 rounded-md object-cover"
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
                  error.className = 'preview-error text-red-500 text-xs mt-1'
                  error.textContent = 'Failed to load image'
                  container.appendChild(error)
                }
              }
            }}
          />
        </div>
      )}
    </div>
  )
}