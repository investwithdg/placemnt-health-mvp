# Input Sanitization Guide

This guide explains how to use the sanitization utilities to prevent XSS (Cross-Site Scripting) attacks.

## Why Sanitization?

User input can contain malicious code. Sanitizing input before displaying it protects your application from XSS attacks.

## Quick Reference

```typescript
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeObject,
  createSafeHtml,
} from '@/lib/sanitize'
```

## Usage Examples

### 1. Plain Text (Strip All HTML)

Use when you want to display user input as plain text:

```typescript
const userInput = '<script>alert("XSS")</script>Hello'
const safe = sanitizeText(userInput)
// Result: 'Hello'
```

### 2. Rich Text (Allow Safe Formatting)

Use for comments, descriptions, or any rich text content:

```typescript
const userComment = '<p>Great job! <b>Love it</b></p><script>alert("XSS")</script>'
const safe = sanitizeRichText(userComment)
// Result: '<p>Great job! <b>Love it</b></p>'
```

Allowed tags: `p`, `br`, `strong`, `em`, `u`, `b`, `i`, `ul`, `ol`, `li`, `a`, `h1`-`h6`, `blockquote`, `code`, `pre`

### 3. Custom HTML (Specific Tags)

Use when you need fine-grained control:

```typescript
const html = '<div class="custom">Content</div>'
const safe = sanitizeHtml(html, {
  ALLOWED_TAGS: ['div', 'span'],
  ALLOWED_ATTR: ['class'],
})
```

### 4. URLs

Always sanitize URLs before using them:

```typescript
const userUrl = 'javascript:alert("XSS")'
const safe = sanitizeUrl(userUrl)
// Result: '' (dangerous protocol removed)

const goodUrl = 'https://example.com'
const safe2 = sanitizeUrl(goodUrl)
// Result: 'https://example.com'
```

### 5. Objects (API Responses)

Sanitize entire objects recursively:

```typescript
const apiResponse = {
  name: '<script>alert("XSS")</script>John',
  bio: '<p>Hello</p>',
  nested: {
    field: '<b>test</b>',
  },
}

const safe = sanitizeObject(apiResponse)
// All string values are sanitized
```

### 6. React Components

Use with `dangerouslySetInnerHTML`:

```tsx
import { createSafeHtml } from '@/lib/sanitize'

function Comment({ text }: { text: string }) {
  return <div dangerouslySetInnerHTML={createSafeHtml(text)} />
}
```

## Best Practices

### ✅ DO

- **Sanitize all user input** before rendering in HTML
- **Sanitize on output**, not just on input (defense in depth)
- **Use `sanitizeText()`** by default unless you specifically need HTML
- **Sanitize URLs** before using in `href` or `src` attributes
- **Test your sanitization** with known XSS payloads

### ❌ DON'T

- **Don't trust user input** - ever
- **Don't use `dangerouslySetInnerHTML`** without sanitization
- **Don't roll your own sanitization** - use DOMPurify
- **Don't sanitize only on client-side** - sanitize on server too

## Common Use Cases

### User Profiles

```typescript
// Name: plain text only
const safeName = sanitizeText(user.name)

// Bio: allow basic formatting
const safeBio = sanitizeRichText(user.bio)

// Profile URL: validate protocol
const safeUrl = sanitizeUrl(user.website)
```

### Comments/Reviews

```typescript
const safeComment = sanitizeRichText(comment.text)
```

### Job Descriptions

```typescript
const safeDescription = sanitizeRichText(job.description)
```

### Search Queries

```typescript
const safeQuery = sanitizeText(searchParams.q)
```

## Security Headers

This project also includes Content Security Policy (CSP) headers in `next.config.js` as an additional layer of protection against XSS.

## Testing Sanitization

Test with these common XSS payloads:

```typescript
const payloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',
  '<svg onload=alert("XSS")>',
]

payloads.forEach((payload) => {
  const result = sanitizeText(payload)
  console.assert(
    !result.includes('script') && !result.includes('onerror'),
    'Payload was not sanitized!'
  )
})
```

## Further Reading

- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
