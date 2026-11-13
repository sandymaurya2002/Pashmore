/**
 * Server-safe PWA constants, shared by the root layout (a Server Component)
 * and the client install store in `@/lib/pwa`.
 */

export const PWA_PROMPT_EVENT = 'pashmore:pwa-prompt'

/**
 * Inlined in <head>. Chrome can fire `beforeinstallprompt` before React
 * hydrates, so the event is parked on `window.__pashmorePwaPrompt` until the
 * install UI is ready, and Chrome's own mini-infobar is suppressed because the
 * site shows its own install button.
 */
export const PWA_BOOTSTRAP_SCRIPT = `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pashmorePwaPrompt=e;window.dispatchEvent(new Event('${PWA_PROMPT_EVENT}'))});`
