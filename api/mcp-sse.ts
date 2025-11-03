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

// Vamos a copiar las funciones necesarias directamente aquí para evitar problemas de imports
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

type VercelRequest = IncomingMessage & {
    query: Record<string, string | string[] | undefined>;
};

type VercelResponse = ServerResponse & {
    json: (body: unknown) => void;
    status: (code: number) => VercelResponse;
    write: (chunk: string) => void;
    end: () => void;
};

function parsePostId(queryValue: string | string[] | undefined): number {
    const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
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
    // Configurar headers para SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    const postId = parsePostId(req.query?.postId);
    const mode = parseMode(req.query?.mode);

    try {
        // Enviar evento de inicio
        res.write(`event: connected\n`);
        res.write(
            `data: {"message": "Conectado al servidor MCP", "timestamp": "${new Date().toISOString()}"}\n\n`
        );

        // Simular carga de datos
        res.write(`event: loading\n`);
        res.write(
            `data: {"message": "Cargando datos del post ${postId}...", "postId": ${postId}}\n\n`
        );

        // Obtener los datos
        const details = await fetchPostDetails(postId);

        // Enviar el recurso solicitado
        const resource =
            mode === "remote"
                ? buildPostRemoteDomResource(details)
                : buildPostSummaryResource(details);

        res.write(`event: resource\n`);
        res.write(`data: ${JSON.stringify(resource)}\n\n`);

        // Enviar evento de finalización
        res.write(`event: completed\n`);
        res.write(
            `data: {"message": "Recurso MCP generado exitosamente", "mode": "${mode}"}\n\n`
        );

        // Mantener la conexión abierta por un tiempo antes de cerrar
        setTimeout(() => {
            res.write(`event: close\n`);
            res.write(`data: {"message": "Cerrando conexión"}\n\n`);
            res.end();
        }, 1000);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Error desconocido al generar el recurso MCP.";

        res.write(`event: error\n`);
        res.write(
            `data: ${JSON.stringify({
                error: "MCP_UI_RESOURCE_ERROR",
                message,
                timestamp: new Date().toISOString(),
            })}\n\n`
        );

        setTimeout(() => {
            res.end();
        }, 500);
    }
}
