---
name: sharp Buffer TypeScript workaround
description: How to pass a sharp output Buffer to the Web Response API without TypeScript errors
type: project
---

In Next.js 16 App Router route handlers, passing a Node.js `Buffer` directly to `new Response(buffer, ...)` causes TS2345 because `Buffer<ArrayBufferLike>` doesn't satisfy `ArrayBufferView` in the lib types.

**Fix used:**
```typescript
const body: ArrayBuffer = outputBuffer.buffer.slice(
  outputBuffer.byteOffset,
  outputBuffer.byteOffset + outputBuffer.byteLength
) as ArrayBuffer;
return new Response(body, { headers: { ... } });
```

**Why:** TypeScript's lib dom types require `ArrayBuffer` (not `ArrayBufferLike`) for `BodyInit`. Slicing creates a new `ArrayBuffer`.
