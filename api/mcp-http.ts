import type { IncomingMessage, ServerResponse } from "http";

// Tipos básicos para los datos
interface Post {
    id: number;
    title: string;
    body: string;
    userId: number;
}

interface Comment {
    id: number;
    postId: number;
    name: string;
    email: string;
    body: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface PostDetails {
    post: Post;
    comments: Comment[];
    user: User;
}

type VercelRequest = IncomingMessage & {
    query: Record<string, string | string[] | undefined>;
};

type VercelResponse = ServerResponse & {
    json: (body: unknown) => void;
    status: (code: number) => VercelResponse;
};

async function fetchPostDetails(postId: number): Promise<PostDetails> {
    const [postResponse, commentsResponse, userResponse] = await Promise.all([
        fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`),
        fetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`),
        fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`)
            .then((r) => r.json())
            .then((post) =>
                fetch(
                    `https://jsonplaceholder.typicode.com/users/${post.userId}`
                )
            ),
    ]);

    const [post, comments, user] = await Promise.all([
        postResponse.json(),
        commentsResponse.json(),
        userResponse.json(),
    ]);

    return { post, comments, user };
}

async function fetchAllPostsWithDetails(
    limit: number = 10
): Promise<PostDetails[]> {
    // Obtener posts y usuarios
    const [postsResponse, usersResponse] = await Promise.all([
        fetch(`https://jsonplaceholder.typicode.com/posts?_limit=${limit}`),
        fetch(`https://jsonplaceholder.typicode.com/users`),
    ]);

    const [posts, users] = await Promise.all([
        postsResponse.json(),
        usersResponse.json(),
    ]);

    // Crear mapa de usuarios para búsqueda rápida
    const usersMap = new Map(users.map((user: User) => [user.id, user]));

    // Obtener comentarios para cada post
    const postsWithDetails = await Promise.all(
        posts.map(async (post: Post) => {
            const commentsResponse = await fetch(
                `https://jsonplaceholder.typicode.com/posts/${post.id}/comments`
            );
            const comments = await commentsResponse.json();

            return {
                post,
                comments,
                user: usersMap.get(post.userId) || {
                    id: post.userId,
                    name: "Usuario desconocido",
                    email: "unknown@example.com",
                },
            };
        })
    );

    return postsWithDetails;
}

function buildPostsListResource(allPostsDetails: PostDetails[]) {
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; border-bottom: 3px solid #007acc; padding-bottom: 15px; margin-bottom: 30px;">
        📝 Lista de Posts Disponibles
      </h1>
      <p style="color: #666; margin-bottom: 30px; font-size: 14px;">
        Total de posts: ${allPostsDetails.length}
      </p>
      
      <div style="display: grid; gap: 20px;">
        ${allPostsDetails
            .map(
                ({ post, comments, user }) => `
          <article style="
            border: 1px solid #ddd; 
            border-radius: 8px; 
            padding: 20px; 
            background: #fafafa;
          ">
            <header style="margin-bottom: 15px;">
              <h2 style="color: #007acc; margin: 0 0 8px 0; font-size: 18px;">
                Post #${post.id}: ${post.title}
              </h2>
              <div style="color: #666; font-size: 12px;">
                👤 Autor: <strong>${user.name}</strong> (${user.email})
              </div>
            </header>
            
            <div style="color: #333; line-height: 1.6; margin-bottom: 15px;">
              ${
                  post.body.length > 150
                      ? post.body.substring(0, 150) + "..."
                      : post.body
              }
            </div>
            
            <footer style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #888;">
              <span>💬 ${comments.length} comentarios</span>
              <span>🔗 URI: urn:post:${post.id}:summary</span>
            </footer>
          </article>
        `
            )
            .join("")}
      </div>
      
      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
        📡 Datos proporcionados por el servidor MCP via JSONPlaceholder API (HTTP)
      </footer>
    </div>
  `;

    return {
        resource: {
            uri: "urn:posts:list",
            mimeType: "text/html",
            text: htmlContent,
        },
    };
}

function buildPostSummaryResource(details: PostDetails) {
    const { post, comments, user } = details;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px;">
        ${post.title}
      </h1>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; line-height: 1.6;">${post.body}</p>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0; padding: 10px; background: #e8f4fd; border-radius: 5px;">
        <span style="font-weight: bold;">Autor: ${user.name}</span>
        <span style="color: #666;">${comments.length} comentarios</span>
      </div>
    </div>
  `;

    return {
        resource: {
            uri: `urn:post:${post.id}:summary`,
            mimeType: "text/html",
            text: htmlContent,
        },
    };
}

function buildPostRemoteDomResource(details: PostDetails) {
    const { post, comments, user } = details;

    const remoteDomContent = `
    import { createElement } from 'react';
    
    export default function PostSummary() {
      return createElement('div', {
        style: {
          fontFamily: 'Arial, sans-serif',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px'
        }
      }, [
        createElement('h1', {
          key: 'title',
          style: {
            color: '#333',
            borderBottom: '2px solid #007acc',
            paddingBottom: '10px'
          }
        }, '${post.title}'),
        createElement('div', {
          key: 'body',
          style: {
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            margin: '20px 0'
          }
        }, createElement('p', {
          style: { margin: 0, lineHeight: 1.6 }
        }, '${post.body}')),
        createElement('div', {
          key: 'meta',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '20px 0',
            padding: '10px',
            background: '#e8f4fd',
            borderRadius: '5px'
          }
        }, [
          createElement('span', {
            key: 'author',
            style: { fontWeight: 'bold' }
          }, 'Autor: ${user.name}'),
          createElement('span', {
            key: 'comments',
            style: { color: '#666' }
          }, '${comments.length} comentarios')
        ])
      ]);
    }
  `;

    return {
        resource: {
            uri: `urn:post:${post.id}:remote-dom`,
            mimeType: "application/vnd.mcp-ui.remote-dom",
            text: remoteDomContent,
        },
    };
}

function parsePostId(queryValue: string | string[] | undefined): number | null {
    if (!queryValue) return null;
    const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseLimit(queryValue: string | string[] | undefined): number {
    const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 && parsed <= 50 ? parsed : 10;
}

function parseMode(
    queryValue: string | string[] | undefined
): "html" | "remote" {
    const raw = (
        Array.isArray(queryValue) ? queryValue[0] : queryValue
    )?.toLowerCase();
    return raw === "remote" ? "remote" : "html";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Headers para CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    const postId = parsePostId(req.query?.postId);
    const limit = parseLimit(req.query?.limit);
    const mode = parseMode(req.query?.mode);

    try {
        if (postId) {
            // Modo individual: obtener detalles de un post específico
            const details = await fetchPostDetails(postId);

            const resource =
                mode === "remote"
                    ? buildPostRemoteDomResource(details)
                    : buildPostSummaryResource(details);

            res.status(200).json(resource);
        } else {
            // Modo lista: obtener todos los posts con sus detalles
            const allPostsDetails = await fetchAllPostsWithDetails(limit);
            const resource = buildPostsListResource(allPostsDetails);

            res.status(200).json(resource);
        }
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Error desconocido al generar el recurso MCP.";

        res.status(500).json({
            error: "MCP_UI_RESOURCE_ERROR",
            message,
        });
    }
}
