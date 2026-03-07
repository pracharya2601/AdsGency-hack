# Tailwind CSS

## Setup with Vite
```bash
npm install -D tailwindcss @tailwindcss/vite
```

```js
// vite.config.js
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css */
@import "tailwindcss";
```

## Key Patterns
- Use utility classes directly in JSX — avoid custom CSS files
- Use `className` (not `class`) in React
- Use `dark:` prefix for dark mode variants
- Use `@apply` sparingly, only for repeated base component styles

## Useful Utilities for This Project
- Layout: `flex`, `grid`, `gap-4`, `space-y-2`
- Cards: `rounded-lg`, `shadow-md`, `border`, `p-4`, `bg-white`
- Text: `text-sm`, `font-semibold`, `text-gray-600`, `truncate`
- Status badges: `inline-flex`, `rounded-full`, `px-2`, `py-1`, `text-xs`
- Responsive: `sm:`, `md:`, `lg:` breakpoint prefixes
