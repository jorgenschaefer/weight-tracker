/**
 * Reading JSON that comes from outside the code - the cache in this browser,
 * Google's answers - before it is checked field by field.
 */

/** The value `text` holds as JSON, or `null` where it is no JSON. */
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // JSON.parse of a string throws only a SyntaxError: the text is no JSON.
    return null;
  }
}

/** Whether `value` is a JSON object, whose fields can be read by name. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
