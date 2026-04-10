import { useState, useEffect, useRef } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useWatchContractEvent } from 'wagmi'
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
  const [posts, setPosts] = useState<Post[]>([])
  const [likingPostId, setLikingPostId] = useState<bigint | null>(null)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  const { data: postsData, refetch } = useReadContract({
    ...contractConfig,
    functionName: 'getAllPosts',
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
    ...contractConfig,
    eventName: 'PostCreated',
    onLogs() {
      refetch()
    },
  })

  // Watch for likes
  useWatchContractEvent({
    ...contractConfig,
    eventName: 'PostLiked',
    onLogs() {
      refetch()
    },
  })

  // Track previous postsData for comparison
  const prevPostsDataRef = useRef(postsData)

  useEffect(() => {
    if (postsData && postsData !== prevPostsDataRef.current) {
      setPosts(postsData as Post[])
      prevPostsDataRef.current = postsData
    }
  }, [postsData])

  useEffect(() => {
    refetch()
  }, [refreshTrigger, refetch])

  const handleLike = async (postId: bigint) => {
    if (!likeCost) return

    setLikingPostId(postId)
    try {
      writeContract({
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

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Recent Posts</h2>
      {posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No posts yet. Be the first to create one!
        </div>
      ) : (
        posts
          .slice()
          .reverse()
          .map((post) => (
            <div key={post.id.toString()} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {post.creator.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{formatAddress(post.creator)}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</span>
                </div>

                <div className="mb-4">
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full max-h-96 object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'
                    }}
                  />
                </div>

                <p className="text-gray-800 mb-4">{post.caption}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>❤️ {post.likes.toString()} likes</span>
                    <span>💰 {formatEther(post.totalEarned)} ETH earned</span>
                  </div>

                  {address && address.toLowerCase() !== post.creator.toLowerCase() && (
                    likedPosts.has(post.id.toString()) ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                      >
                        ❤️ Liked
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLike(post.id)}
                        disabled={likingPostId === post.id || isLikeConfirming}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {likingPostId === post.id ? 'Liking...' : `Like (${formatEther(likeCost || 0n)} ETH)`}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))
      )}
    </div>
  )
}