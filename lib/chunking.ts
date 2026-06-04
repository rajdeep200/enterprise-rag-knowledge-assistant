/**
 * Text chunking for embedding.
 *
 * Strategy: character-based sliding window with overlap (a robust, dependency-free
 * approximation of token-based chunking). Defaults target ~800 tokens / ~150 token
 * overlap using the common ~4 chars/token heuristic.
 */

export interface ChunkOptions {
  /** Target characters per chunk (~3000 ≈ 800 tokens). */
  chunkSize?: number;
  /** Overlap characters between consecutive chunks (~500 ≈ 150 tokens). */
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 3000;
const DEFAULT_OVERLAP = 500;

/** Collapse runs of whitespace, normalize newlines, trim. */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split text into overlapping chunks. Tries to break on sentence/paragraph
 * boundaries near the window edge so we don't cut words in half.
 * Empty / whitespace-only chunks are skipped.
 */
export function chunkText(input: string, options: ChunkOptions = {}): string[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = Math.min(options.overlap ?? DEFAULT_OVERLAP, chunkSize - 1);

  const text = normalizeWhitespace(input);
  if (text.length === 0) return [];
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // If we're not at the very end, try to break on a natural boundary
    // within the last ~20% of the window to preserve context.
    if (end < text.length) {
      const windowStart = start + Math.floor(chunkSize * 0.8);
      const slice = text.slice(windowStart, end);
      const boundary =
        lastIndexOfAny(slice, ["\n\n", ". ", "! ", "? ", "\n"]) ?? -1;
      if (boundary !== -1) {
        end = windowStart + boundary + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);

    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

/** Returns the last index at which any of the given markers appears, or null. */
function lastIndexOfAny(haystack: string, markers: string[]): number | null {
  let best = -1;
  for (const m of markers) {
    const idx = haystack.lastIndexOf(m);
    if (idx > best) best = idx;
  }
  return best === -1 ? null : best;
}
