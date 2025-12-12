/**
 * Strips markdown formatting characters from text
 * Removes: **, *, _, ##, etc.
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Remove bold (**text** or __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic (*text* or _text_)
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove headers (## Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.*?)~~/g, '$1')
    // Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Clean up any remaining asterisks
    .replace(/\*/g, '')
    .trim();
}

/**
 * Formats AI generated text by removing markdown and normalizing whitespace
 */
export function formatAIText(text: string): string {
  if (!text) return '';
  
  return stripMarkdown(text)
    // Normalize multiple spaces
    .replace(/\s+/g, ' ')
    // Normalize multiple newlines (keep max 2)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
