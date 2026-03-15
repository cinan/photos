import { DateTime } from "luxon";
import CleanCSS from "clean-css";
import UglifyJS from "uglify-js";
import htmlmin from "html-minifier";
import yaml from "js-yaml";
import slugify from "slugify";
import Image from "@11ty/eleventy-img";
import MarkdownIt from "markdown-it";
import { mkdirSync, copyFileSync, existsSync } from "fs";
import { join, basename } from "path";

const mdRender = new MarkdownIt();

export default function(eleventyConfig) {

  // Copy processed images from persistent cache to _site/ for serving
  function syncImageToSite(outputPath) {
    const dest = join("_site/assets/images", basename(outputPath));
    if (!existsSync(dest)) {
      mkdirSync("_site/assets/images", { recursive: true });
      copyFileSync(outputPath, dest);
    }
  }

  eleventyConfig.addFilter("renderUsingMarkdown", function(rawString) {
    return mdRender.render(rawString);
  });

  // https://www.11ty.dev/docs/plugins/image/
  // Shortcode to generate a responsive project image
  eleventyConfig.addShortcode("generateImage", async function(params) {

    // Destructure the parameters object and set some defaults
    let {
      src,
      alt = "",
      classes = "",
      loadingType = "lazy",
      viewportSizes = "",
      outputWidths = ["1080","1800","2400"],
      outputFormats = ["jpeg"],
      outputQualityJpeg = 75,
      outputQualityWebp = 75,
      outputQualityAvif = 75
    } = params;

    // Remove preceding slash from image path if it exists
    src = src.startsWith("/") ? src.slice(1) : src;

    let metadata = await Image(src, {
      widths: outputWidths,
      sharpJpegOptions: { quality: outputQualityJpeg },
      sharpWebpOptions: { quality: outputQualityWebp },
      sharpAvifOptions: { quality: outputQualityAvif },
      formats: outputFormats,
      urlPath: "/assets/images/",
      outputDir: "./.cache/eleventy-img/",
    });

    // Sync from persistent cache to _site/ (cache survives yarn clean)
    for (const images of Object.values(metadata)) {
      for (const img of images) syncImageToSite(img.outputPath);
    }

    let lowsrc = metadata.jpeg[0];

    let orientation;
    if (lowsrc.width > lowsrc.height) {
      orientation = "landscape";
    } else if (lowsrc.width < lowsrc.height) {
      orientation = "portrait";
    } else {
      orientation = "square";
    }

    return `<picture class="${classes}" data-orientation="${orientation}">
            ${Object.values(metadata).map(imageFormat => {
                return `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat.map(entry => entry.srcset).join(", ")}" sizes="${viewportSizes}">`;
            }).join("\n")}
                <img
                    src="${lowsrc.url}"
                    width="${lowsrc.width}"
                    height="${lowsrc.height}"
                    alt="${alt}"
                    class="hover-fade"
                    loading="${loadingType}"
                    decoding="async">
              </picture>`;

  });

  // Shortcode to generate OG image meta tags from a source image
  // Usage: {% ogImageTags src, siteUrl %} — returns og:image + twitter meta tags
  eleventyConfig.addShortcode("ogImageTags", async function(src, siteUrl) {
    src = src.startsWith("/") ? src.slice(1) : src;
    let metadata = await Image(src, {
      widths: [1200],
      formats: ["jpeg"],
      sharpJpegOptions: { quality: this.ctx.settings.images.jpeg.quality },
      urlPath: "/assets/images/",
      outputDir: "./.cache/eleventy-img/",
    });
    syncImageToSite(metadata.jpeg[0].outputPath);
    let url = metadata.jpeg[0].url;
    let absUrl = siteUrl + url;
    return `<meta property="og:image" content="${absUrl}">\n  <meta name="twitter:card" content="${this.ctx.settings.metadata.site_url}">\n  <meta name="twitter:image" content="${absUrl}">`;
  });

  // Add support for YAML data files with .yaml extension
  eleventyConfig.addDataExtension("yaml", contents => yaml.load(contents));

  // Merge 11ty data instead of overriding values
  eleventyConfig.setDataDeepMerge(true);

  // A filter to limit output of collection items
  eleventyConfig.addFilter("limit", function (arr, limit) {
    return arr.slice(0, limit);
  });

  // A filter to limit and randomize output of collection items
  eleventyConfig.addFilter("randomLimit", (arr, limit, currPage) => {
    const pageArr = arr.filter((page) => page.url !== currPage);
    pageArr.sort(() => {
      return 0.5 - Math.random();
    });
    return pageArr.slice(0, limit);
  });

  // Filter to format Google Fonts font name for use in link URLs
  eleventyConfig.addFilter("formatGoogleFontName", name => {
    return name.replace(/\s/g, '+');
  });

  // Date formatting (human readable)
  eleventyConfig.addFilter("dateFullYear", dateObj => {
    return DateTime.fromJSDate(dateObj).toFormat("yyyy");
  });

  // base64 encode a string
  eleventyConfig.addFilter("encodeURL", function(url) {
    return encodeURIComponent(url);
  });

  // Minify CSS
  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  // Minify JS
  eleventyConfig.addFilter("jsmin", function(code) {
    let minified = UglifyJS.minify(code);
    if (minified.error) {
      console.log("UglifyJS error: ", minified.error);
      return code;
    }
    return minified.code;
  });

  // Minify HTML output
  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if (outputPath.indexOf(".html") > -1) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
      return minified;
    }
    return content;
  });

  // Universal slug filter makes-strict-urls-like-this
  eleventyConfig.addFilter("slug", function(str) {
    return slugify(str, {
      lower: true,
      replacement: "-",
      strict: true
    });
  });

  return {
    templateFormats: ["njk"],
    pathPrefix: "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
