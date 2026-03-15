# Portfolio

Static photo portfolio built with [Eleventy](https://www.11ty.dev/) v3, deployed to Cloudflare Pages.

## Setup

```bash
corepack enable
corepack use yarn@4
yarn install
```

## Commands

```bash
yarn dev      # dev server at localhost:8080
yarn build    # production build → _site/
yarn deploy   # deploy to Cloudflare Pages
```

## Adding projects

Drop images into `projects/<name>/`. The first image (alphabetically) becomes the cover. Optionally add `projects/<name>/meta.yaml` with `title`, `description`, and `year`.

Images are gitignored and stay on the local machine only.

## Credits

Based on the [Halide](https://github.com/danurbanowicz/halide) theme by Dan Urbanowicz.
