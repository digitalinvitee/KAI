/**
 * Loads GSAP 3 + ScrollTrigger on demand from the site itself (assets/vendor/gsap/).
 *
 * The files ship with the project, so the motion works offline, from the file
 * system (dist/index.html) and without contacting any third-party server.
 * The site never waits for them: navigation, menu, language switch and booking
 * work without them, and animations are added once they arrive.
 */
export const GSAP_VERSION = '3.13.0';
export const GSAP_FILES = Object.freeze(['assets/vendor/gsap/gsap.min.js', 'assets/vendor/gsap/ScrollTrigger.min.js']);

const loadScript = (path) =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(path, document.baseURI).href;
    script.async = false; // keep execution order: core first, plugin second
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${path}`));
    document.head.append(script);
  });

let pending = null;

export const loadGsap = () => {
  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    return Promise.resolve({ gsap: window.gsap, ScrollTrigger: window.ScrollTrigger });
  }
  pending ??= Promise.all(GSAP_FILES.map(loadScript))
    .then(() => {
      const { gsap, ScrollTrigger } = window;
      if (!gsap || !ScrollTrigger) return null;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    })
    .catch(() => null);
  return pending;
};

export const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => window.setTimeout(() => resolve(null), ms))]);
