/**
 * Recursively strips undefined fields from an object/array payload before writing to Firestore.
 * Preserves FieldValue objects (serverTimestamp, arrayUnion, arrayRemove, increment, etc.),
 * Timestamp, Date, and other special objects.
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item)).filter(item => item !== undefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    // Check if it's a special object/FieldValue/Timestamp/Date that should NOT be recursed into as plain object
    if (
      (obj as any).constructor &&
      ((obj as any).constructor.name === 'FieldValue' ||
       (obj as any).constructor.name === 'Timestamp' ||
       obj instanceof Date ||
       typeof (obj as any).isEqual === 'function' ||
       typeof (obj as any).toMillis === 'function')
    ) {
      return obj;
    }
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj as any)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}
