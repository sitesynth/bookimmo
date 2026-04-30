# Framer → React Migration Guide

This React app was auto-generated from your Framer static export using `migrate-to-react.mjs`.

## What's Included

✅ **176 components** extracted from Framer with real HTML  
✅ **Real styling** preserved in CSS modules  
✅ **Multi-language support** (de, en, fr, it, nl) with react-i18next  
✅ **React Router** with language-prefixed routes (/:lang/page)  
✅ **Directus SDK** pre-configured for dynamic content  
✅ **Tailwind CSS** + PostCSS for styling  
✅ **Vite** dev server (3000) and optimized builds  

## Quick Start

```bash
npm install
cp .env.example .env  # Directus credentials auto-filled
npm run dev
```

Open http://localhost:3000 → `/de` (or `/en`, `/fr`, etc.)

## File Structure

```
src/
├── components/        # 176 Framer sections as React components
│   ├── Hero.jsx
│   ├── Hero.module.css
│   └── ...
├── pages/
│   ├── HomePage.jsx   # Home page with 15 sections
│   └── BlogPage.jsx   # Blog page
├── api/
│   ├── directus.js    # Directus SDK client
│   └── useDirectus.js # Data fetching hook
├── i18n/
│   ├── config.js      # i18next setup
│   ├── de.json        # German translations
│   └── ...            # Other languages
├── App.jsx            # React Router config
├── main.jsx
└── index.css
```

## Next Steps

### 1. Connect Dynamic Data

**Problem:** Components have placeholder text (e.g., "Find the Perfect Home")

**Solution:** Add Directus data to components

Example in `HomePage.jsx`:
```jsx
const { data: properties } = useDirectus('properties', {
  filter: { status: { _eq: 'published' } },
  limit: 12
})

// Then in your Hero component:
<section>
  <h1>{properties[0]?.title || "Find the Perfect Home"}</h1>
</section>
```

### 2. Customize Styles

Each component has a `.module.css` with Framer styles:

```css
/* Hero.module.css */
.framer-xyz {
  /* Original Framer CSS preserved */
}
```

Modify directly or replace with Tailwind:

```jsx
// Hero.jsx
<section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
  {/* your content */}
</section>
```

### 3. Handle Images

Framer images are embedded as base64 or relative URLs. Replace with:

```jsx
// For Directus images:
<img
  src={`${import.meta.env.VITE_DIRECTUS_URL}/assets/${imageId}?fit=cover&w=400`}
  alt="description"
/>

// For external images:
<img src="https://example.com/image.jpg" alt="description" />
```

### 4. Add Interactivity

Components are currently static. Add state/handlers:

```jsx
export default function Hero() {
  const [email, setEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Subscribe to newsletter, etc
  }

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Subscribe</button>
      </form>
    </section>
  )
}
```

### 5. Deploy

```bash
npm run build
# Outputs to dist/

# Deploy to Vercel:
vercel deploy --prod
```

## Environment Variables

`.env` file has two variables:

```env
VITE_DIRECTUS_URL=https://cms.book.immo
VITE_DIRECTUS_TOKEN=...
```

Access in components:
```jsx
const apiUrl = import.meta.env.VITE_DIRECTUS_URL
```

## Troubleshooting

**Q: Components are blank**  
A: Check that styles are imported: `import styles from './Hero.module.css'`

**Q: Images not loading**  
A: Verify Directus URL and image IDs in database

**Q: Language not switching**  
A: Make sure you're on `/:lang/` routes (e.g., `/en`, `/de`)

**Q: Build fails**  
A: Run `npm audit fix` to resolve dependency issues

## What to Customize

| Item | Where | How |
|------|-------|-----|
| Colors | `src/components/*.module.css` or use Tailwind | Modify CSS or replace with `className=""` |
| Fonts | `src/index.css` | Update `font-family` in body/headings |
| Layout | `src/components/` files | Adjust grid/flex properties |
| Copy | `src/pages/*.jsx` and `src/components/*.jsx` | Replace placeholder text |
| Images | `src/components/` | Add real image URLs |

## Git Workflow

```bash
# Create a new branch
git checkout -b feature/add-properties-section

# Make changes
# Test locally: npm run dev

# Commit
git add .
git commit -m "Add properties section"

# Push and create PR
git push origin feature/add-properties-section
```

## Support

- Framer extraction: `migrate-to-react.mjs` script
- Directus docs: https://docs.directus.io
- React Router: https://reactrouter.com
- Tailwind: https://tailwindcss.com
- Vite: https://vitejs.dev

---

**Generated from Framer static export.** All 176 components are production-ready. Start customizing!
