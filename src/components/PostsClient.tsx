'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle, ExternalLink, ChevronRight, Loader2, CornerDownRight, ImageIcon, Film, Images } from 'lucide-react'
import type { IgPost, IgComment } from '@/lib/meta'

function MediaIcon({ type }: { type: IgPost['media_type'] }) {
  if (type === 'VIDEO') return <Film className="w-3.5 h-3.5" />
  if (type === 'CAROUSEL_ALBUM') return <Images className="w-3.5 h-3.5" />
  return <ImageIcon className="w-3.5 h-3.5" />
}

function PostThumbnail({ post }: { post: IgPost }) {
  const [imgError, setImgError] = useState(false)
  const src = post.thumbnail_url ?? post.media_url

  if (src && !imgError) {
    return (
      <div className="aspect-square w-full overflow-hidden bg-gray-100 rounded-lg">
        <Image
          src={src}
          alt={post.caption?.slice(0, 40) ?? 'Post'}
          width={200}
          height={200}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    )
  }
  return (
    <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <MediaIcon type={post.media_type} />
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}

export default function PostsClient({ posts, igUsername }: { posts: IgPost[]; igUsername: string }) {
  const [selectedPost, setSelectedPost] = useState<IgPost | null>(null)
  const [comments, setComments] = useState<IgComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)

  async function selectPost(post: IgPost) {
    setSelectedPost(post)
    setComments([])
    setCommentsError(null)
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/dashboard/posts/${post.id}/comments`)
      const data = await res.json()
      if (!res.ok) {
        setCommentsError(data.error ?? 'Failed to load comments')
      } else {
        setComments(data.comments ?? [])
      }
    } catch {
      setCommentsError('Network error')
    }
    setLoadingComments(false)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-80px)]">
      {/* Left — posts grid */}
      <div className="w-80 shrink-0 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
            <p className="text-sm text-gray-500">@{igUsername} · {posts.length} posts</p>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
            <ImageIcon className="w-10 h-10 text-gray-200" />
            <p className="text-sm">No posts found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => selectPost(post)}
                className={`w-full text-left rounded-xl border transition p-3 flex gap-3 items-start ${
                  selectedPost?.id === post.id
                    ? 'border-transparent shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
                style={selectedPost?.id === post.id ? { backgroundColor: '#e6f7f1', borderColor: '#09AF72' } : {}}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                  {(post.thumbnail_url ?? post.media_url) ? (
                    <Image
                      src={post.thumbnail_url ?? post.media_url!}
                      alt="thumb"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <MediaIcon type={post.media_type} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">{formatDate(post.timestamp)}</p>
                  <p className="text-sm text-gray-800 line-clamp-2 leading-snug">
                    {post.caption ? post.caption.slice(0, 80) : <span className="italic text-gray-400">No caption</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.like_count ?? 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments_count ?? 0}</span>
                    <span className="ml-auto"><MediaIcon type={post.media_type} /></span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 self-center" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right — comments panel */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-w-0">
        {selectedPost ? (
          <>
            {/* Post header */}
            <div className="px-6 py-4 border-b border-gray-100 flex gap-4 items-start">
              <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
                {(selectedPost.thumbnail_url ?? selectedPost.media_url) ? (
                  <Image
                    src={selectedPost.thumbnail_url ?? selectedPost.media_url!}
                    alt="post"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <MediaIcon type={selectedPost.media_type} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 line-clamp-2 leading-snug mb-2">
                  {selectedPost.caption ?? <span className="italic text-gray-400">No caption</span>}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{selectedPost.like_count ?? 0} likes</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{selectedPost.comments_count ?? 0} comments</span>
                  <span>{formatDate(selectedPost.timestamp)}</span>
                  <a
                    href={selectedPost.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-gray-600 transition ml-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View on Instagram
                  </a>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingComments ? (
                <div className="flex justify-center pt-16">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : commentsError ? (
                <div className="flex flex-col items-center justify-center pt-16 text-gray-400 gap-2">
                  <p className="text-sm">{commentsError}</p>
                  <p className="text-xs text-gray-300">Make sure instagram_manage_comments permission is enabled in your Meta app.</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-16 text-gray-400 gap-2">
                  <MessageCircle className="w-10 h-10 text-gray-200" />
                  <p className="text-sm">No comments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{comments.length} Comment{comments.length !== 1 ? 's' : ''}</p>
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      {/* Comment */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#09AF72' }}>
                          {comment.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-2.5">
                            <p className="text-xs font-semibold text-gray-900 mb-0.5">@{comment.username}</p>
                            <p className="text-sm text-gray-800 leading-snug">{comment.text}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 ml-2">{formatTime(comment.timestamp)}</p>
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies?.data && comment.replies.data.length > 0 && (
                        <div className="ml-11 space-y-2">
                          {comment.replies.data.map((reply) => {
                            const isOwnReply = reply.username === igUsername
                            return (
                              <div key={reply.id} className="flex gap-2 items-start">
                                <CornerDownRight className="w-3.5 h-3.5 text-gray-300 mt-2 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div
                                    className="rounded-2xl rounded-tl-sm px-3 py-2"
                                    style={isOwnReply ? { backgroundColor: '#e6f7f1' } : { backgroundColor: '#f3f4f6' }}
                                  >
                                    <p className="text-xs font-semibold mb-0.5" style={isOwnReply ? { color: '#09AF72' } : { color: '#374151' }}>
                                      @{reply.username} {isOwnReply && <span className="font-normal text-gray-400">(you)</span>}
                                    </p>
                                    <p className="text-sm text-gray-800 leading-snug">{reply.text}</p>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1 ml-2">{formatTime(reply.timestamp)}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm">Select a post to view comments</p>
          </div>
        )}
      </div>
    </div>
  )
}
