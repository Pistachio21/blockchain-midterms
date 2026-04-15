import { useState, useEffect, useRef } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useWatchContractEvent } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { contractConfig } from '../contracts'
import { formatEther } from 'viem'

interface Post {
  id: bigint
  creator: `0x${string}`
  imageUrl: string
  caption: string
  likes: bigint
  totalEarned: bigint
  timestamp: bigint
}

interface PostFeedProps {
  refreshTrigger: number
}

export function PostFeed({ refreshTrigger }: PostFeedProps) {
  const { address } = useAccount()
  // Use a ref to persist posts across account switches
  const postsRef = useRef<Post[]>([])
  const [, setTick] = useState(0)
  const [likingPostId, setLikingPostId] = useState<bigint | null>(null)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  const { data: postsData, refetch } = useReadContract({
    ...contractConfig,
    functionName: 'getAllPosts',
    query: {
      staleTime: 5000,
    },
  })

  const { data: likeCost } = useReadContract({
    ...contractConfig,
    functionName: 'likeCost',
  })

  const { writeContract, data: likeHash } = useWriteContract()
  const { isLoading: isLikeConfirming } = useWaitForTransactionReceipt({
    hash: likeHash,
  })

  // Watch for new posts
  useWatchContractEvent({
    address: contractConfig.address,
    abi: contractConfig.abi,
    chainId: sepolia.id,
    eventName: 'PostCreated',
    onLogs() {
      refetch()
    },
  })

  // Watch for likes
  useWatchContractEvent({
    address: contractConfig.address,
    abi: contractConfig.abi,
    chainId: sepolia.id,
    eventName: 'PostLiked',
    onLogs() {
      refetch()
    },
  })

  // Update posts when new data arrives
  useEffect(() => {
    if (postsData) {
      postsRef.current = postsData as Post[]
      setTick((n: number) => n + 1)
    }
  }, [postsData])

  useEffect(() => {
    refetch()
  }, [refreshTrigger, refetch])

  // Refetch when account changes (wallet switch)
  useEffect(() => {
    if (address) {
      refetch()
    }
  }, [address, refetch])

  const handleLike = async (postId: bigint) => {
    if (!likeCost) return

    setLikingPostId(postId)
    try {
      await writeContract({
        ...contractConfig,
        functionName: 'likePost',
        args: [postId],
        value: likeCost,
      })
    } catch (error) {
      console.error('Error liking post:', error)
      setLikingPostId(null)
    }
  }

  // Track previous state for like confirmation
  const prevLikeConfirmingRef = useRef(isLikeConfirming)
  const prevLikeHashRef = useRef(likeHash)
  useEffect(() => {
    if (!isLikeConfirming && likeHash && (isLikeConfirming !== prevLikeConfirmingRef.current || likeHash !== prevLikeHashRef.current)) {
      setLikingPostId(null)
      if (likingPostId) {
        setLikedPosts(prev => new Set(prev).add(likingPostId.toString()))
      }
    }
    prevLikeConfirmingRef.current = isLikeConfirming
    prevLikeHashRef.current = likeHash
  }, [isLikeConfirming, likeHash, likingPostId])

  // Helper to check if user has liked a post (requires post.likers or similar field)
  const hasUserLiked = (post: Post) => {
    // If your Post type includes a 'likers' array, use this:
    // return post.likers?.map(addr => addr.toLowerCase()).includes(address?.toLowerCase() ?? '');
    // Otherwise, fallback to likedPosts set (client-side only)
    return likedPosts.has(post.id.toString());
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-slate-800">Recent Posts</h2>
        <span className="px-3 py-1 bg-accent-100 text-accent-600 text-xs font-medium rounded-full">
          {postsRef.current.length} {postsRef.current.length === 1 ? 'post' : 'posts'}
        </span>
      </div>
      {postsRef.current.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-300">No posts yet. Be the first to create one!</p>
        </div>
      ) : (
        postsRef.current
          .slice()
          .reverse()
          .map((post: Post, index: number) => (
            <div 
              key={post.id.toString()} 
              className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up border border-slate-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {post.creator.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">{formatAddress(post.creator)}</span>
                      <span className="text-xs text-slate-400 block">{formatTimestamp(post.timestamp)}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                    #{post.id.toString()}
                  </span>
                </div>

                <div className="mb-5">
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full max-h-96 object-cover rounded-xl border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'
                    }}
                  />
                </div>

                <p className="text-slate-800 mb-5 text-base leading-relaxed">{post.caption}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">❤️</span>
                      <span className="text-sm font-medium text-slate-700">{post.likes.toString()}</span>
                      <span className="text-xs text-slate-400">likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">💰</span>
                      <span className="text-sm font-medium text-accent-600">{formatEther(post.totalEarned)}</span>
                      <span className="text-xs text-slate-400">ETH</span>
                    </div>
                  </div>

                  {address && address.toLowerCase() !== post.creator.toLowerCase() && (
                    <button
                      onClick={() => handleLike(post.id)}
                      disabled={likingPostId === post.id || isLikeConfirming || hasUserLiked(post)}
                      className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${hasUserLiked(post)
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed focus:ring-slate-300'
                          : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:shadow-green-500/30 focus:ring-green-500'}
                        ${(likingPostId === post.id || isLikeConfirming) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {hasUserLiked(post)
                        ? '❤️ Liked'
                        : (likingPostId === post.id
                          ? (<span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Liking...</span>)
                          : `Like (${formatEther(likeCost || 0n)} ETH)`
                        )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
      )}
    </div>
  )
}