import { get } from '#src/api/jsonPlaceholderClient'
import type { Comment, Post, User } from '#src/types/jsonPlaceholder'

export interface PostDetails {
  post: Post
  user: User
  comments: Comment[]
}

interface FetchPostsOptions {
  limit?: number
  userId?: number
}

export async function fetchPosts({
  limit = 6,
  userId,
}: FetchPostsOptions = {}): Promise<Post[]> {
  const posts = await get<Post[]>('posts', {
    _limit: limit,
    userId,
  })

  return posts.sort((a, b) => a.title.localeCompare(b.title))
}

export async function fetchPostDetails(postId: number): Promise<PostDetails> {
  const post = await get<Post>(`posts/${postId}`)

  const [comments, user] = await Promise.all([
    get<Comment[]>(`posts/${postId}/comments`, { _limit: 4 }),
    get<User>(`users/${post.userId}`),
  ])

  return {
    post,
    user,
    comments,
  }
}
