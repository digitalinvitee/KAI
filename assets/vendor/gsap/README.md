# GSAP

`gsap.min.js` and `ScrollTrigger.min.js`, version **3.13.0**, unmodified, from GreenSock's
public repository (https://github.com/greensock/GSAP, tag `3.13.0`, folder `dist/`). The
same files are in the npm package `gsap@3.13.0`.

They are served from the site itself, so the motion works offline and from the file
system, and visitors' browsers never contact a CDN. `src/js/core/gsap-loader.js` loads them
after the page is usable.

Licence: GreenSock Standard License (https://gsap.com/standard-license), free to use,
including in commercial projects. The licence notice is kept at the top of each file.

To update: replace both files with the same version from `node_modules/gsap/dist/` and
change `GSAP_VERSION` in `src/js/core/gsap-loader.js`.
