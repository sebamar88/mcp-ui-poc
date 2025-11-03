import type { PostDetails } from '#src/services/postService'
import type { UIResource } from '#src/types/ui'
import { escapeHtml } from '#src/utils/sanitize'

function asParagraphsCopy(body: string) {
  return body
    .split(/\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
}

export function buildPostSummaryResource(details: PostDetails): UIResource {
  const { post, comments, user } = details
  const paragraphs = asParagraphsCopy(post.body)
  const featuredComments = comments.slice(0, 2)
  const resourceData = {
    postId: post.id,
    user: { id: user.id, name: user.name },
    comments: featuredComments.map((comment) => ({
      id: comment.id,
      email: comment.email,
    })),
  }

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
        <span>Autor: ${escapeHtml(user.name)} (@${escapeHtml(user.username)})</span>
        <span>Contacto: ${escapeHtml(user.email ?? 'No disponible')}</span>
      </header>
      <section>
        <h2>${escapeHtml(post.title)}</h2>
        ${paragraphs
          .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
          .join('')}
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
        `,
                )
                .join('')
            : '<p>No hay comentarios disponibles todavía.</p>'
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
</html>`

  return {
    type: 'resource',
    resource: {
      uri: `ui://posts/${post.id}/summary`,
      mimeType: 'text/html',
      text: html,
    },
  }
}

export function buildPostRemoteDomResource(details: PostDetails): UIResource {
  const { post, user } = details
  const payload = {
    postId: post.id,
    author: user.name,
    company: user.company?.name ?? 'Sin compañía',
    username: user.username,
  }

  const remoteScript = `
const data = ${JSON.stringify(payload)};

const card = document.createElement('ui-card');
card.setAttribute('padding', 'xl');
card.setAttribute('bordered', 'true');
card.setAttribute('title', 'Remote DOM – Perfil de ' + data.author);

const stack = document.createElement('ui-stack');
stack.setAttribute('direction', 'vertical');
stack.setAttribute('spacing', 'md');

const subtitle = document.createElement('ui-text');
subtitle.setAttribute('variant', 'subtitle');
subtitle.textContent = 'Usuario @' + data.username + ' · ' + data.company;

const description = document.createElement('ui-text');
description.textContent = 'Este recurso se renderiza usando Remote DOM y puede reaccionar en vivo a las acciones.';

const notifyButton = document.createElement('ui-button');
notifyButton.setAttribute('label', 'Notificar autor');
notifyButton.addEventListener('press', () => {
  window.parent?.postMessage({
    type: 'notify',
    payload: { message: 'Remote DOM: avisamos a ' + data.author }
  }, '*');
});

const toolButton = document.createElement('ui-button');
toolButton.setAttribute('label', 'Solicitar datos extra');
toolButton.setAttribute('tone', 'critical');
toolButton.addEventListener('press', () => {
  window.parent?.postMessage({
    type: 'tool',
    payload: {
      toolName: 'loadExtendedProfile',
      params: { postId: data.postId, username: data.username }
    }
  }, '*');
});

stack.appendChild(subtitle);
stack.appendChild(description);
stack.appendChild(notifyButton);
stack.appendChild(toolButton);
card.appendChild(stack);
root.appendChild(card);
`

  return {
    type: 'resource',
    resource: {
      uri: `ui://posts/${post.id}/remote-dom`,
      mimeType: 'application/vnd.mcp-ui.remote-dom+javascript; framework=webcomponents',
      text: remoteScript,
    },
  }
}
