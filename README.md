# FormPhoto Pro — Precision Admission Photo & Signature Studio

100% On-Device Browser Image Resizer, Aspect-Ratio Cropper, Native CIE LAB Background Remover, and Exact-KB Compressor for Official Admission & Visa Portals (BUET, BCS, DU, Medical, US Visa, IELTS, SSC/HSC).

## Privacy & Architecture

- **100% Client-Side Processing**: Every uploaded photo or signature is decoded, cropped, background-isolated, and compressed strictly inside your browser's local memory (`HTMLCanvasElement` & typed arrays). Zero images are uploaded to any server.
- **Native CIE LAB + Sobel Edge Background Remover**: Multi-seed border BFS flood fill in perceptual CIE LAB color space with Sobel gradient edge barriers, guided alpha feathering, and foreground color decontamination for portraits—plus 2D Integral-Image Bradley-Roth local adaptive thresholding for uneven paper signatures.
- **Exact File-Size Cap Solver**: Binary-search quality encoder guarantees your exported `JPG`, `JPEG`, `PNG`, or `WebP` file stays strictly below portal limits (`≤ 75 KB`, `≤ 60 KB`, `≤ 100 KB`, etc.).

## Local Development

```bash
npm install
npm run dev
```

## Production Build & Static Hosting

```bash
npm run build
```

The production build outputs static, relative-path assets (`base: './'`) to `dist/`, making it work out-of-the-box on:
- **GitHub Pages** (`https://<username>.github.io/<repo-name>/` or custom domain)
- **Cloudflare Pages / Netlify / Vercel / Firebase Hosting**
- Any static subfolder or root web server

## Deploying to GitHub Pages

This repository includes `.github/workflows/deploy.yml` and `public/.nojekyll` pre-configured:

1. Push this repository to GitHub (`main` or `master` branch).
2. In your GitHub repository, navigate to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. The workflow will automatically build and publish your site to GitHub Pages on every push.
