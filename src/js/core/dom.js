export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * Minimal element factory.
 * h('button', { class: 'x', type: 'button', dataset: { id: 1 } }, ['Label'])
 * Attributes set to null, undefined or false are skipped; true sets an empty attribute.
 */
export const h = (tag, props = {}, children = []) => {
  const element = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'class') element.className = value;
    else if (key === 'text') element.textContent = value;
    else if (key === 'dataset') Object.assign(element.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(element.style, value);
    else if (value === true) element.setAttribute(key, '');
    else element.setAttribute(key, String(value));
  });
  [].concat(children).forEach((child) => {
    if (child == null || child === false) return;
    element.append(child instanceof Node ? child : String(child));
  });
  return element;
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const headerOffset = () => document.querySelector('[data-header]')?.offsetHeight ?? 0;

/** Scrolls without the page-wide smooth behaviour when motion is reduced. */
export const scrollToY = (top) => {
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
};
