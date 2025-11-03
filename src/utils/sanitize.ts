const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
}

export function escapeHtml(input: string) {
  return input.replace(/[&<>"'`]/g, (char) => ENTITY_MAP[char] ?? char)
}

