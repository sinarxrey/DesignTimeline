# 🚀 Deployment Guide

This guide shows you how to deploy your Design Timeline app to various free hosting platforms.

## Option 1: Vercel (Recommended - Easiest)

### Quick Deploy
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect it's a Vite app
6. Click "Deploy"
7. Done! Your app will be live in ~30 seconds

### Features
- ✅ Automatic deployments on git push
- ✅ Custom domains
- ✅ SSL certificates
- ✅ Global CDN
- ✅ Zero configuration needed

---

## Option 2: Netlify

### Deploy Steps
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Choose your repository
5. Build settings are auto-configured via `netlify.toml`
6. Click "Deploy site"

### Manual Deploy (Alternative)
1. Run `npm run build` locally
2. Go to [netlify.com](https://netlify.com)
3. Drag & drop the `dist` folder to Netlify

---

## Option 3: GitHub Pages

### Setup Steps
1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Source: "GitHub Actions"
4. The workflow in `.github/workflows/deploy.yml` will auto-deploy
5. Your site will be available at `https://yourusername.github.io/DesignTimeline`

---

## Option 4: Surge.sh (CLI Deploy)

### Quick Deploy
```bash
# Install Surge globally
npm install -g surge

# Build your app
npm run build

# Deploy
cd dist
surge
```

Follow the prompts to choose a domain name.

---

## 🔧 Build Information

- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Node version**: 18+ recommended

## 📁 Configuration Files Created

- `vercel.json` - Vercel configuration
- `netlify.toml` - Netlify configuration  
- `.github/workflows/deploy.yml` - GitHub Pages workflow

## 🌐 Custom Domains

All platforms support custom domains:
- **Vercel**: Project Settings → Domains
- **Netlify**: Site Settings → Domain Management
- **GitHub Pages**: Repository Settings → Pages → Custom Domain

## 🔒 Environment Variables

If you add environment variables later:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **GitHub Pages**: Repository Settings → Secrets and Variables

---

**Recommendation**: Start with Vercel for the easiest deployment experience!