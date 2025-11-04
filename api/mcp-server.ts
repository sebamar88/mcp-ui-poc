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

// Tipos para JSON-RPC 2.0
interface JSONRPCRequest {
    jsonrpc: "2.0";
    method: string;
    params?: any;
    id?: string | number;
}

interface JSONRPCResponse {
    jsonrpc: "2.0";
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: string | number | null;
}

interface MCPResource {
    uri: string;
    mimeType: string;
    text?: string;
}

type VercelRequest = IncomingMessage & {
    query: Record<string, string | string[] | undefined>;
    body?: any;
};

type VercelResponse = ServerResponse & {
    json: (body: unknown) => void;
    status: (code: number) => VercelResponse;
};

// Funciones auxiliares para obtener datos
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

async function fetchAllPosts(limit: number = 10): Promise<Post[]> {
    const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts?_limit=${limit}`
    );
    return response.json();
}

// Construir recursos MCP
function buildPostResource(details: PostDetails): MCPResource {
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
        uri: `post://${post.id}`,
        mimeType: "text/html",
        text: htmlContent,
    };
}

function buildPostListResource(posts: Post[]): MCPResource {
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; border-bottom: 3px solid #007acc; padding-bottom: 15px; margin-bottom: 30px;">
        📝 Lista de Posts Disponibles
      </h1>
      <p style="color: #666; margin-bottom: 30px; font-size: 14px;">
        Total de posts: ${posts.length}
      </p>
      
      <div style="display: grid; gap: 20px;">
        ${posts
            .map(
                (post) => `
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
            </header>
            
            <div style="color: #333; line-height: 1.6; margin-bottom: 15px;">
              ${
                  post.body.length > 150
                      ? post.body.substring(0, 150) + "..."
                      : post.body
              }
            </div>
            
            <footer style="font-size: 12px; color: #888;">
              🔗 URI: post://${post.id}
            </footer>
          </article>
        `
            )
            .join("")}
      </div>
    </div>
  `;

    return {
        uri: "posts://list",
        mimeType: "text/html",
        text: htmlContent,
    };
}

// Manejadores de métodos MCP
async function handleListResources(): Promise<MCPResource[]> {
    const posts = await fetchAllPosts(10);

    // Lista de recursos disponibles
    const resources: MCPResource[] = [buildPostListResource(posts)];

    // Agregar cada post como recurso individual
    posts.forEach((post) => {
        resources.push({
            uri: `post://${post.id}`,
            mimeType: "text/html",
            text: undefined, // Se cargará cuando se solicite
        });
    });

    return resources;
}

async function handleReadResource(uri: string): Promise<MCPResource> {
    if (uri === "posts://list") {
        const posts = await fetchAllPosts(10);
        return buildPostListResource(posts);
    }

    const postMatch = uri.match(/^post:\/\/(\d+)$/);
    if (postMatch) {
        const postId = parseInt(postMatch[1]);
        const details = await fetchPostDetails(postId);
        return buildPostResource(details);
    }

    throw new Error(`Recurso no encontrado: ${uri}`);
}

function createErrorResponse(
    id: string | number | null,
    code: number,
    message: string
): JSONRPCResponse {
    return {
        jsonrpc: "2.0",
        error: {
            code,
            message,
        },
        id,
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Headers para CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({
            error: "Método no permitido. Use POST para JSON-RPC.",
        });
        return;
    }

    try {
        let body = "";

        // Usar req.body si está disponible (Vercel lo parsea automáticamente)
        if (req.body) {
            body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            await processRequest(body, res);
        } else {
            // Fallback para leer manualmente
            req.on("data", (chunk) => {
                body += chunk.toString();
            });

            req.on("end", async () => {
                await processRequest(body, res);
            });
        }
    } catch (error) {
        res.status(500).json(
            createErrorResponse(null, -32603, "Error interno del servidor")
        );
    }
}

async function processRequest(body: string, res: VercelResponse) {
    try {
        const request: JSONRPCRequest = JSON.parse(body);

        // Validar JSON-RPC básico
        if (request.jsonrpc !== "2.0") {
            res.status(400).json(
                createErrorResponse(
                    request.id !== undefined ? request.id : null,
                    -32600,
                    "JSON-RPC inválido"
                )
            );
            return;
        }

        if (!request.method) {
            res.status(400).json(
                createErrorResponse(
                    request.id !== undefined ? request.id : null,
                    -32601,
                    "Método requerido"
                )
            );
            return;
        }

        const response: JSONRPCResponse = {
            jsonrpc: "2.0",
            id: request.id !== undefined ? request.id : null,
        };

        try {
            switch (request.method) {
                case "initialize":
                    response.result = {
                        protocolVersion: "2024-11-05",
                        capabilities: {
                            resources: {
                                subscribe: false,
                                listChanged: false,
                            },
                        },
                        serverInfo: {
                            name: "Posts MCP Server",
                            version: "1.0.0",
                        },
                    };
                    break;

                case "resources/list":
                    const resources = await handleListResources();
                    response.result = { resources };
                    break;

                case "resources/read":
                    if (!request.params?.uri) {
                        throw new Error("Parámetro 'uri' requerido");
                    }
                    const resource = await handleReadResource(
                        request.params.uri
                    );
                    response.result = { contents: [resource] };
                    break;

                default:
                    response.error = {
                        code: -32601,
                        message: `Método no implementado: ${request.method}`,
                    };
                    break;
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Error interno del servidor";
            response.error = {
                code: -32603,
                message,
            };
            delete response.result;
        }

        res.status(200).json(response);
    } catch (parseError) {
        res.status(400).json(
            createErrorResponse(null, -32700, "Error de parsing JSON")
        );
    }
}
