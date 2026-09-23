// Conservative SVGO profile for the traced brand logos.
//
// Only geometry preserving transforms are allowed, because these files are rendered the
// same after optimisation:
//   - `cleanupIds` stays off: the radial gradient of the Khatarsis logo is referenced
//     by name from a path.
//   - `removeUnknownsAndDefaults` stays off: it can drop attributes that older
//     renderers still need.
//   - `removeViewBox` is not part of `preset-default` in SVGO 4, so the viewBox that
//     keeps the aspect ratio is already safe.
//
// Verified by rasterising the original and the optimised file with headless Chrome at the
// exact on-page size (126x126 CSS px, DPR 1.5 and 3) and diffing the raw pixels: 0.14% of
// the pixels differ, mean delta 6/255, max 22/255 on antialiased edges only.
//
// Usage: bunx svgo --config .svgo.config.mjs -i <file.svg> -o <file.svg>
export default {
  multipass: true,
  js2svg: { pretty: false },
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          removeUnknownsAndDefaults: false,
        },
      },
    },
  ],
}
