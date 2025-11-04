import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * This function uses DOMPurify to remove potentially dangerous HTML/JavaScript
 * from user input before rendering it in the browser.
 *
 * @param dirty - The untrusted HTML string to sanitize
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```ts
 * const userInput = '<script>alert("XSS")</script><p>Hello</p>'
 * const safe = sanitizeHtml(userInput)
 * // Returns: '<p>Hello</p>'
 * ```
 */
export function sanitizeHtml(
  dirty: string,
  options?: DOMPurify.Config
): string {
  return DOMPurify.sanitize(dirty, options)
}

/**
 * Sanitize user input for safe text display
 * Strips all HTML tags
 *
 * @param input - The untrusted input string
 * @returns Plain text with all HTML removed
 *
 * @example
 * ```ts
 * const userInput = '<b>Hello</b> <script>alert("XSS")</script>'
 * const safe = sanitizeText(userInput)
 * // Returns: 'Hello'
 * ```
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize user input allowing only safe formatting tags
 * Useful for rich text content like comments or descriptions
 *
 * @param input - The untrusted HTML string
 * @returns Sanitized HTML with only safe formatting tags
 *
 * @example
 * ```ts
 * const userInput = '<p>Hello <b>world</b></p><script>alert("XSS")</script>'
 * const safe = sanitizeRichText(userInput)
 * // Returns: '<p>Hello <b>world</b></p>'
 * ```
 */
export function sanitizeRichText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'b',
      'i',
      'ul',
      'ol',
      'li',
      'a',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitize a URL to prevent javascript: and data: schemes
 *
 * @param url - The untrusted URL string
 * @returns Sanitized URL or empty string if dangerous
 *
 * @example
 * ```ts
 * const userUrl = 'javascript:alert("XSS")'
 * const safe = sanitizeUrl(userUrl)
 * // Returns: ''
 * ```
 */
export function sanitizeUrl(url: string): string {
  const cleaned = url.trim().toLowerCase()

  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
  ]

  for (const protocol of dangerousProtocols) {
    if (cleaned.startsWith(protocol)) {
      return ''
    }
  }

  return url.trim()
}

/**
 * Sanitize object properties recursively
 * Useful for sanitizing API responses or user data objects
 *
 * @param obj - The object to sanitize
 * @param sanitizeFn - The sanitization function to apply (default: sanitizeText)
 * @returns New object with sanitized values
 *
 * @example
 * ```ts
 * const userInput = {
 *   name: '<script>alert("XSS")</script>John',
 *   bio: '<p>Hello</p>'
 * }
 * const safe = sanitizeObject(userInput)
 * // Returns: { name: 'John', bio: 'Hello' }
 * ```
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizeFn: (value: string) => string = sanitizeText
): T {
  const sanitized: any = Array.isArray(obj) ? [] : {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeFn(value)
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, sanitizeFn)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * React component helper: Sanitize and render HTML
 * Use this with dangerouslySetInnerHTML
 *
 * @param html - The HTML to sanitize
 * @returns Object ready for dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={createSafeHtml(userInput)} />
 * ```
 */
export function createSafeHtml(html: string): { __html: string } {
  return {
    __html: sanitizeHtml(html),
  }
}
