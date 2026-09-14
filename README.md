# jiyun-web

Personal research site for **Ji-Yun Kim** — Ph.D. student in Veterinary Microbiology,
College of Veterinary Medicine, Kyungpook National University.

Static HTML/CSS/JS. No build step, no dependencies.

## Structure

Four pages, no build step, no dependencies.

```
index.html          hero + opening statement + portrait, meta, intro
research.html       four research projects + figures
publications.html   peer-reviewed papers + conference posters (lightbox)
cv.html             methods & tools, education & honors, CV download

styles.css          all styling
main.js             hero phylogram, scroll reveals, nav state, mobile menu, poster lightbox
assets/
  figures/          figure crops used in page bodies (from the conference posters)
  posters/          poster PDFs + web-sized JPEG previews
  img/              photographs: hero (Salzburg), portrait, closing band (Hallstatt)
  cv/               academic CV
  favicon.svg
.nojekyll           tells GitHub Pages to serve files as-is
```

The nav and footer are duplicated in all four pages on purpose: no templating means no
build step, and each page can be edited on its own. If you change the nav or footer,
change it in all four files.

Each page ends with a "Next" link, so the four pages also read as a sequence:
index → research → publications → cv → index.

## Local preview

Any static server works; the page uses relative paths only.

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages

1. Push to `main`.
2. Repository **Settings → Pages**.
3. **Source**: *Deploy from a branch*. **Branch**: `main`, folder `/ (root)`. Save.
4. The site appears at `https://<owner>.github.io/jiyun-web/` after a minute or two.

Step 2 requires admin permission on the repository. A collaborator with write
access can push changes but cannot enable Pages.

For a custom domain, add a `CNAME` file at the repository root containing the
domain, and point a `CNAME` DNS record at `<owner>.github.io`.

## Updating content

**Conference presentations.** Drop the PDF in `assets/posters/`, generate a preview
image beside it, then add an `<li>` to the `.pubs--talks` list in `publications.html`
(copy an existing row and change `data-img`, `data-pdf`, `data-caption`, the year,
title, and venue). The row opens the preview in a lightbox; the lightbox links to the PDF.

```sh
pdftoppm -r 42 -jpeg -jpegopt quality=90 -f 1 -l 1 poster.pdf out
magick out-1.jpg -resize 1100x -quality 82 -strip assets/posters/<slug>.jpg
```

**Publications.** Add an `<li>` to the `.pubs` list in `publications.html`.

**Research projects.** Add an `<li class="project">` to the `.projects` list in
`research.html` and renumber the `.project__no` spans.

**Photographs.** `assets/img/portrait.jpg` (4:5, home page), `hero-salzburg.jpg` (home
hero, cover-cropped so keep the bottom-left quiet — the title sits there), and
`hallstatt.jpg` (closing band on cv.html). Export with `-strip` so no EXIF or GPS data
reaches the public site. If `portrait.jpg` is missing the figure removes itself and the
intro row falls back to two columns.

**CV.** Replace `assets/cv/Ji-Yun-Kim-CV.docx`, keeping the filename, or update the
links in `cv.html` and the footer.

**Adding a page.** Copy the page closest in shape, change `<title>`, the meta description,
and move `aria-current="page"` to the new nav item — in all four existing files too.

## Notes

- Figures in `assets/figures/` have the page colour multiplied into them at export time,
  so their backgrounds match `--bg` exactly and no CSS blend mode is needed. If you change
  `--bg`, re-export the figures with the matching colour:

  ```sh
  magick in.jpg \( +clone -fill '#ddded8' -colorize 100 \) \
    -compose multiply -composite -quality 88 -strip out.jpg
  ```

  Source figures whose background is a light grey rather than white need a levels pass
  first (`-level 0%,<bg/255>%`) so the background lands on white before the multiply.
- The hero animation is a procedurally generated radial cladogram — a decorative
  motif, not real data.
- Fonts are Cormorant Garamond and Inter, loaded from Google Fonts.
