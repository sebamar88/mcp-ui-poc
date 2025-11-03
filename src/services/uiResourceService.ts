import type { PostDetails } from "#src/services/postService";
import type { UIResource } from "#src/types/ui";
import { escapeHtml } from "#src/utils/sanitize";

function asParagraphsCopy(body: string) {
    return body
        .split(/\n+/)
        .map((chunk) => chunk.trim())
        .filter(Boolean);
}

export function buildPostSummaryResource(details: PostDetails): UIResource {
    const { post, comments, user } = details;
    const paragraphs = asParagraphsCopy(post.body);
    const featuredComments = comments.slice(0, 2);
    const resourceData = {
        postId: post.id,
        user: { id: user.id, name: user.name },
        comments: featuredComments.map((comment) => ({
            id: comment.id,
            email: comment.email,
        })),
    };

    const html = `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        color-scheme: light;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      body {
        margin: 0;
        padding: 24px;
        background: #f8fafc;
        color: #0f172a;
      }
      .card {
        background: #ffffff;
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 18px 40px -24px rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(148, 163, 184, 0.35);
      }
      h2 {
        margin: 0;
        font-size: 20px;
        letter-spacing: -0.01em;
      }
      p {
        margin: 8px 0 0;
        font-size: 14px;
        color: #334155;
      }
      .meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 16px;
        font-size: 12px;
        color: #64748b;
      }
      .comments {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid rgba(148, 163, 184, 0.3);
      }
      .comment {
        padding: 12px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        background: rgba(241, 245, 249, 0.6);
        margin-bottom: 12px;
      }
      .comment:last-child {
        margin-bottom: 0;
      }
      .comment__author {
        font-weight: 600;
        font-size: 12px;
        color: #1e293b;
        margin-bottom: 6px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 18px;
      }
      button {
        border-radius: 999px;
        border: 1px solid transparent;
        padding: 10px 18px;
        font-size: 13px;
        font-weight: 600;
        background: #1d4ed8;
        color: #f8fafc;
        cursor: pointer;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      button.secondary {
        background: transparent;
        color: #1d4ed8;
        border-color: rgba(37, 99, 235, 0.35);
      }
      button:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 26px -18px rgba(37, 99, 235, 0.9);
      }
    </style>
  </head>
  <body>
    <article class="card">
      <header class="meta">
        <span>Autor: ${escapeHtml(user.name)} (@${escapeHtml(
        user.username
    )})</span>
        <span>Contacto: ${escapeHtml(user.email ?? "No disponible")}</span>
      </header>
      <section>
        <h2>${escapeHtml(post.title)}</h2>
        ${paragraphs
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join("")}
      </section>
      <section class="comments">
        <h3 style="margin:0 0 12px;font-size:14px;color:#1f2937;">Comentarios recientes</h3>
        ${
            featuredComments.length > 0
                ? featuredComments
                      .map(
                          (comment) => `
          <div class="comment">
            <div class="comment__author">${escapeHtml(comment.email)}</div>
            <div style="font-size:13px;line-height:1.5;color:#384152;">
              ${escapeHtml(comment.body)}
            </div>
          </div>
        `
                      )
                      .join("")
                : "<p>No hay comentarios disponibles todavía.</p>"
        }
      </section>
      <div class="actions">
        <button id="notify-action">Guardar insight</button>
        <button id="intent-action" class="secondary">Ver todos los comentarios</button>
      </div>
    </article>
    <script>
      const payload = ${JSON.stringify(resourceData)};

      function send(type, message) {
        window.parent?.postMessage({ type, ...message }, '*');
      }

      document
        .getElementById('notify-action')
        ?.addEventListener('click', () => {
          send('notify', {
            payload: {
              message: 'Insight guardado para el post #' + payload.postId,
            },
          });
        });

      document
        .getElementById('intent-action')
        ?.addEventListener('click', () => {
          send('intent', {
            payload: {
              intent: 'open-comments-drawer',
              params: { postId: payload.postId },
            },
          });
        });
    </script>
  </body>
</html>`;

    return {
        type: "resource",
        resource: {
            uri: `ui://posts/${post.id}/summary`,
            mimeType: "text/html",
            text: html,
        },
    };
}

const REMOTE_DOM_VERSION = 'v4'

export function buildPostRemoteDomResource(details: PostDetails): UIResource {
  const { post, user } = details
  const payload = {
    postId: post.id,
    author: user.name,
    company: user.company?.name ?? 'Sin compañía',
    username: user.username,
  }

  return {
    type: 'resource',
    resource: {
      uri: `ui://posts/${post.id}/remote-dom?rev=${REMOTE_DOM_VERSION}`,
      mimeType: 'text/html',
      text: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1d4ed8, #3b82f6);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      padding: 30px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    h2 { margin: 0 0 15px 0; font-size: 24px; }
    p { margin: 0 0 10px 0; opacity: 0.9; }
    button {
      margin: 15px 5px 0;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }
    button:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>🎉 Simulación Remote DOM</h2>
    <p>Autor: ${escapeHtml(payload.author)}</p>
    <p>Usuario: @${escapeHtml(payload.username)}</p>
    <p>Compañía: ${escapeHtml(payload.company)}</p>
    <p>Post ID: ${payload.postId}</p>
    <button onclick="sendNotification()">Enviar Notificación</button>
    <button onclick="callTool()">Llamar Herramienta</button>
  </div>
  
  <script>
    const data = ${JSON.stringify(payload)};
    
    function sendNotification() {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'notify',
          payload: { message: '✅ Notificación desde: ' + data.author }
        }, '*');
      }
    }
    
    function callTool() {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'tool',
          payload: {
            toolName: 'loadExtendedProfile',
            params: { postId: data.postId, username: data.username }
          }
        }, '*');
      }
    }
    
    console.log('✅ Simulación Remote DOM cargada para:', data.author);
  </script>
</body>
</html>`,
    },
  }
}
