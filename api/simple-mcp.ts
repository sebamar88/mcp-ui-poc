import type { IncomingMessage, ServerResponse } from "http";

type VercelRequest = IncomingMessage & {
    body?: any;
};

type VercelResponse = ServerResponse & {
    json: (body: unknown) => void;
    status: (code: number) => VercelResponse;
};

// Función simple para obtener posts
async function fetchPosts(limit: number = 10) {
    const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts?_limit=${limit}`
    );
    return response.json();
}

// Función simple para obtener un post específico
async function fetchPost(id: number) {
    const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${id}`
    );
    return response.json();
}

// Función para buscar posts por término
async function searchPosts(query: string, limit: number = 5) {
    const response = await fetch(`https://jsonplaceholder.typicode.com/posts`);
    const allPosts = await response.json();
    
    const filtered = allPosts.filter((post: any) => 
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.body.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, limit);
}

// Función para obtener estadísticas de un post
async function getPostStats(postId: number) {
    const post = await fetchPost(postId);
    const wordCount = post.body.split(/\s+/).length;
    const titleWordCount = post.title.split(/\s+/).length;
    
    // Análisis de sentimiento básico (simulado)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'wrong', 'error', 'problem'];
    
    const text = (post.title + ' ' + post.body).toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    
    let sentiment = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    return {
        postId: post.id,
        title: post.title,
        wordCount,
        titleWordCount,
        totalWords: wordCount + titleWordCount,
        sentiment,
        positiveWords: positiveCount,
        negativeWords: negativeCount,
        userId: post.userId
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Headers CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    // Para simplicidad, también acepto GET con query params
    if (req.method === "GET") {
        try {
            const posts = await fetchPosts(10);

            const response = {
                jsonrpc: "2.0",
                result: {
                    resources: posts.map((post: any) => ({
                        uri: `post://${post.id}`,
                        name: post.title,
                        description: post.body.substring(0, 100) + "...",
                        mimeType: "text/html",
                    })),
                },
                id: 1,
            };

            res.status(200).json(response);
            return;
        } catch (error) {
            res.status(500).json({
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: "Error obteniendo posts",
                },
                id: 1,
            });
            return;
        }
    }

    if (req.method !== "POST") {
        res.status(405).json({
            jsonrpc: "2.0",
            error: {
                code: -32601,
                message: "Método no permitido",
            },
            id: 0,
        });
        return;
    }

    try {
        let requestData;

        // Intentar leer el body
        if (req.body) {
            requestData =
                typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        } else {
            // Leer manualmente
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });

            await new Promise<void>((resolve) => {
                req.on("end", () => {
                    try {
                        requestData = JSON.parse(body);
                        resolve();
                    } catch (e) {
                        resolve();
                    }
                });
            });
        }

        if (!requestData) {
            res.status(400).json({
                jsonrpc: "2.0",
                error: {
                    code: -32700,
                    message: "Parse error",
                },
                id: 0,
            });
            return;
        }

        const { jsonrpc, method, params, id } = requestData;

        if (jsonrpc !== "2.0") {
            res.status(400).json({
                jsonrpc: "2.0",
                error: {
                    code: -32600,
                    message: "Invalid Request",
                },
                id: id !== undefined ? id : 0,
            });
            return;
        }

        // Validar que el método existe
        if (!method || typeof method !== "string") {
            res.status(400).json({
                jsonrpc: "2.0",
                error: {
                    code: -32602,
                    message: "Method is required",
                },
                id: id !== undefined ? id : 0,
            });
            return;
        }

        let result;

        switch (method) {
            case "initialize":
                result = {
                    protocolVersion: "2024-11-05",
                    capabilities: {
                        resources: {
                            subscribe: false,
                            listChanged: false,
                        },
                        prompts: {
                            listChanged: false,
                        },
                        tools: {
                            listChanged: false,
                        },
                    },
                    serverInfo: {
                        name: "Simple Posts MCP Server",
                        version: "1.0.0",
                    },
                };
                break;

            case "notifications/initialized":
                // Esta es una notificación, no requiere respuesta con result
                res.status(200).json({
                    jsonrpc: "2.0",
                    id: id !== undefined ? id : 0,
                });
                return;

            case "resources/list":
                const posts = await fetchPosts(10);
                result = {
                    resources: posts.map((post: any) => ({
                        uri: `post://${post.id}`,
                        name: post.title,
                        description: post.body.substring(0, 100) + "...",
                        mimeType: "text/html",
                    })),
                };
                break;

            case "resources/read":
                if (!params?.uri) {
                    res.status(400).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32602,
                            message: "Invalid params: uri required",
                        },
                        id: id !== undefined ? id : 0,
                    });
                    return;
                }

                const match = params.uri.match(/^post:\/\/(\d+)$/);
                if (!match) {
                    res.status(400).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32602,
                            message: "Invalid URI format",
                        },
                        id: id !== undefined ? id : 0,
                    });
                    return;
                }

                const postId = parseInt(match[1]);
                const post = await fetchPost(postId);

                result = {
                    contents: [
                        {
                            uri: params.uri,
                            mimeType: "text/html",
                            text: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                          <h1 style="color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px;">
                            ${post.title}
                          </h1>
                          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; line-height: 1.6;">${post.body}</p>
                          </div>
                          <div style="padding: 10px; background: #e8f4fd; border-radius: 5px;">
                            <span>Post ID: ${post.id} | User ID: ${post.userId}</span>
                          </div>
                        </div>
                        `,
                        },
                    ],
                };
                break;

            case "prompts/list":
                result = {
                    prompts: [
                        {
                            name: "analyze-post",
                            description: "Analiza un post específico y proporciona insights sobre su contenido",
                            arguments: [
                                {
                                    name: "post_id",
                                    description: "ID del post a analizar",
                                    required: true,
                                }
                            ]
                        },
                        {
                            name: "summarize-posts",
                            description: "Crea un resumen de múltiples posts basado en criterios específicos",
                            arguments: [
                                {
                                    name: "count",
                                    description: "Número de posts a incluir en el resumen",
                                    required: false,
                                }
                            ]
                        }
                    ]
                };
                break;

            case "tools/list":
                result = {
                    tools: [
                        {
                            name: "get-post-stats",
                            description: "Obtiene estadísticas detalladas de un post (palabra count, sentiment, etc.)",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    post_id: {
                                        type: "number",
                                        description: "ID del post para obtener estadísticas"
                                    }
                                },
                                required: ["post_id"]
                            }
                        },
                        {
                            name: "search-posts",
                            description: "Busca posts que contengan términos específicos",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    query: {
                                        type: "string",
                                        description: "Término de búsqueda"
                                    },
                                    limit: {
                                        type: "number",
                                        description: "Máximo número de resultados",
                                        default: 5
                                    }
                                },
                                required: ["query"]
                            }
                        }
                    ]
                };
                break;

            case "tools/call":
                if (!params?.name) {
                    res.status(400).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32602,
                            message: "Tool name is required"
                        },
                        id: id !== undefined ? id : 0,
                    });
                    return;
                }

                const toolName = params.name;
                const toolArgs = params.arguments || {};

                try {
                    switch (toolName) {
                        case "search-posts":
                            if (!toolArgs.query) {
                                throw new Error("Query parameter is required");
                            }
                            const searchResults = await searchPosts(toolArgs.query, toolArgs.limit || 5);
                            result = {
                                content: [
                                    {
                                        type: "text",
                                        text: `Encontrados ${searchResults.length} posts que contienen "${toolArgs.query}":\n\n` +
                                              searchResults.map((post: any, index: number) => 
                                                `${index + 1}. **Post #${post.id}**: ${post.title}\n` +
                                                `   ${post.body.substring(0, 100)}...\n`
                                              ).join('\n')
                                    }
                                ]
                            };
                            break;

                        case "get-post-stats":
                            if (!toolArgs.post_id) {
                                throw new Error("post_id parameter is required");
                            }
                            const stats = await getPostStats(toolArgs.post_id);
                            result = {
                                content: [
                                    {
                                        type: "text",
                                        text: `📊 **Estadísticas del Post #${stats.postId}**\n\n` +
                                              `**Título**: ${stats.title}\n` +
                                              `**Palabras en título**: ${stats.titleWordCount}\n` +
                                              `**Palabras en contenido**: ${stats.wordCount}\n` +
                                              `**Total de palabras**: ${stats.totalWords}\n` +
                                              `**Sentimiento**: ${stats.sentiment}\n` +
                                              `**Palabras positivas**: ${stats.positiveWords}\n` +
                                              `**Palabras negativas**: ${stats.negativeWords}\n` +
                                              `**Usuario ID**: ${stats.userId}`
                                    }
                                ]
                            };
                            break;

                        default:
                            throw new Error(`Unknown tool: ${toolName}`);
                    }
                } catch (toolError) {
                    res.status(400).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32603,
                            message: toolError instanceof Error ? toolError.message : "Tool execution error"
                        },
                        id: id !== undefined ? id : 0,
                    });
                    return;
                }
                break;

            default:
                res.status(400).json({
                    jsonrpc: "2.0",
                    error: {
                        code: -32601,
                        message: `Method not found: ${method}`,
                    },
                    id: id !== undefined ? id : 0,
                });
                return;
        }

        res.status(200).json({
            jsonrpc: "2.0",
            result,
            id: id !== undefined ? id : 0,
        });
    } catch (error) {
        res.status(500).json({
            jsonrpc: "2.0",
            error: {
                code: -32603,
                message:
                    error instanceof Error ? error.message : "Internal error",
            },
            id: 0,
        });
    }
}
