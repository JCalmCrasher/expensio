/** Document Y offset for window virtualizer scroll margin. */
export function getDocumentScrollMargin(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  return rect.top + window.scrollY;
}
