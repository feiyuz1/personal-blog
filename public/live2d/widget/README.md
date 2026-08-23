# Vendored live2d-widget runtime

This directory contains the browser distribution from
`live2d-widgets@1.0.1`, sourced from the project's published jsDelivr package.

The runtime is vendored because the npm module entry contains unresolved
Cubism 5 build aliases when bundled by Next.js 16. The browser distribution is
the integration path documented by the upstream project.

## Local modification

`chunk/index2.js` replaces the upstream unrestricted `document.mousemove`
behavior with bounded gaze tracking. Pointer movement drives the model only
within 280 CSS pixels of the canvas, is capped at roughly 30 updates per second,
uses reduced X/Y limits, and returns to center after 900 ms of inactivity. It is
also disabled when the widget is hidden or the user requests reduced motion.
The upstream position dragging remains disabled by the widget configuration;
the React integration provides its own pointer-based, viewport-bounded, saved
position behavior for mouse and touch input.

The local runtime also listens for `live2d:expression`, plays the Pachan preset
named by the event detail (or chooses a non-repeating fallback), and returns to
the neutral preset after 3.2 seconds. Matching dialogue is owned by the React
integration so the selected expression and line always stay in sync.

The original upstream source maps are included for reference, but do not map
the local gaze-tracking modifications exactly. The upstream source is available
at:

<https://github.com/stevenjoezhang/live2d-widget/tree/master>

See `LICENSE` in this directory for the upstream GPL-3.0 license. Live2D Cubism
components and Core remain subject to their respective Live2D licenses.
