# Pixora — Local-First Design Editor

![Pixora Logo](./public/favicon.svg)

**Pixora** is a lightweight, local-first browser design editor for creating UI designs, graphics, layouts, and visual compositions directly on your device.

Inspired by professional design tools such as Figma, Pixora is built from the ground up with an **original implementation and dark visual design**, operating 100% on the client side with zero accounts, zero cloud dependencies, and complete data privacy.

---

## Key Principles & Philosophy

### 1. 100% Client-Side & Local-First
* **No Server, No Database, No Telemetry**: Pixora has no backend. Your projects, artwork, typography, and images never touch a third-party server.
* **No Accounts or Logins**: Start creating immediately upon opening the page without registration or credentials.
* **Browser Storage (IndexedDB)**: Seamless local draft autosaving and session recovery directly in your browser.
* **User-Owned Project Files (`.pixora`)**: Your design projects belong to you. Save, backup, share, and transfer portable `.pixora` JSON files anywhere.

### 2. Dual-Tier Storage Architecture

```text
                    ┌─────────────────┐
                    │     Pixora      │
                    │   Web Editor    │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
          Browser Storage            Project File
             IndexedDB                .pixora
                │                         │
          Local recovery             User-owned
          / autosave                  portable file
```

1. **IndexedDB Autosave**: Automatically snapshots your work after meaningful interactions, drags, and style edits. If your browser closes or refreshes, Pixora prompts you to continue editing right where you left off.
2. **Native `.pixora` File**: An open, portable, human-readable JSON project file containing your metadata, pages, layer hierarchy, visual properties, and embedded assets.

---

## Features & Capabilities

### Core Design Tools
- **Frames & Artboards**: Pre-configured screen presets for Mobile (390×844, 430×932), Tablet (1024×1366), Desktop (1440×900), Presentation (1920×1080), and Social Media (Square, Portrait, Landscape), plus custom dimensions.
- **Vector Shapes**: Rectangles with rounded corners, Ellipses, and Lines with stroke width and line caps.
- **Editable Typography**: On-canvas double-click in-place editing, font families, weights, font size, line height, letter spacing, text alignment, and colors.
- **Image Import**: Import PNG, JPG, WebP, and SVG images with fit modes (`cover`, `contain`, `fill`) and corner rounding.
- **Grouping & Hierarchy**: Group objects (`Cmd+G`), ungroup (`Cmd+Shift+G`), and reorder layers in the visual stack.
- **Alignment & Snapping**: Real-time smart alignment guide lines (snapping to neighboring centers and edges) and canvas dot grid snapping.
- **Infinite Canvas**: High-performance SVG + DOM rendering with smooth panning (`Space + drag` or middle mouse), zoom centered on pointer, Zoom to Fit, and zoom percentage indicator.
- **Undo / Redo History**: Reversible command stack for creating, transforming, styling, reordering, and grouping objects. Continuous pointer drags coalesce into a single history step.

### Dedicated Mobile & Tablet Experience
Pixora does not merely shrink the desktop interface. On viewports under `768px`, Pixora switches to a dedicated mobile design experience:
- Full-screen canvas with gesture-optimized navigation (`touch-action: none`).
- 1-finger select & drag; 2-finger pinch-to-zoom and two-finger pan.
- 48×48px minimum touch targets on selection and resize handles.
- Long-press contextual action menu (Duplicate, Delete, Bring to Front, Send to Back, Lock).
- Slide-up bottom sheets for **Pages & Layers**, **Add Elements**, and **Design Properties**.
- Bottom floating tool selector for effortless thumb interaction.

---

## Project File Format (`.pixora`)

Pixora project files are structured JSON documents adhering to schema versioning:

```json
{
  "format": "pixora",
  "version": 1,
  "metadata": {
    "id": "proj_123456",
    "name": "Mobile App Design",
    "createdAt": "2026-09-21T10:00:00.000Z",
    "updatedAt": "2026-09-21T10:30:00.000Z"
  },
  "settings": {
    "grid": { "enabled": true, "size": 10, "snap": true },
    "snapToObjects": true,
    "canvasColor": "#121316"
  },
  "pages": [
    {
      "id": "page_1",
      "name": "Design",
      "childIds": ["frame_1"]
    }
  ],
  "objects": {
    "frame_1": {
      "id": "frame_1",
      "name": "Mobile Screen",
      "type": "frame",
      "x": 100,
      "y": 100,
      "width": 390,
      "height": 844,
      "rotation": 0,
      "opacity": 1,
      "locked": false,
      "visible": true,
      "fill": "#ffffff",
      "childIds": []
    }
  },
  "assets": {}
}
```

Every file is strictly validated via **Zod** upon loading, accompanied by friendly error handling and a sequential migration runner (`v1 → v2`) for future schema updates.

---

## Export Formats

Pixora provides pure client-side export without server processing:
- **PNG**: Crisp raster export at **1x** (standard) and **2x** (Retina resolution) for selected objects, frames, or full pages.
- **SVG**: Clean vector SVG export containing all geometries, strokes, typography, and embedded graphics.
- **.pixora**: Portable project download for backup and offline archiving.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `V` | Select tool |
| `F` | Frame tool |
| `R` | Rectangle tool |
| `O` | Ellipse tool |
| `L` | Line tool |
| `T` | Text tool |
| `H` / `Space + drag` | Hand / Pan tool |
| `Cmd / Ctrl + Z` | Undo |
| `Cmd / Ctrl + Shift + Z` | Redo |
| `Cmd / Ctrl + C` | Copy selected objects |
| `Cmd / Ctrl + V` | Paste objects |
| `Cmd / Ctrl + D` | Duplicate selection |
| `Cmd / Ctrl + G` | Group selected objects |
| `Cmd / Ctrl + Shift + G`| Ungroup selected group |
| `Cmd / Ctrl + S` | Save `.pixora` project |
| `Cmd / Ctrl + O` | Open `.pixora` project file |
| `Delete` / `Backspace` | Delete selected objects |
| `Escape` | Clear selection / Cancel tool |
| `Shift + Drag` | Constrain aspect ratio / 15° rotation snap |

---

## Progressive Web App (PWA) & Offline Use

Pixora is installable as a standalone PWA on macOS, Windows, Linux, Android, and iOS:
- Web App Manifest configured for standalone window mode.
- Service Worker (`public/sw.js`) caches all critical static bundles for uninterrupted offline operation.
- No network connection required once assets are cached.

---

## Development Setup

### Prerequisites
- Node.js 18+ (tested on Node v20 & v22)
- npm 9+

### Installation
```bash
git clone git@github.com:uypanha/pixora.git
cd pixora
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Running Automated Tests
```bash
npm run test
```

### Production Build
```bash
npm run build
```
Static assets are output into the `dist/` folder, ready for deployment to any static web host or CDN.

---

## GitHub Pages Deployment

Pixora is configured with a relative base path (`./`), enabling deployment to any subpath such as:
`https://uypanha.github.io/pixora/`

An automated GitHub Actions workflow is provided at `.github/workflows/deploy.yml`:
1. Push your changes to the `main` branch:
   ```bash
   git push origin main
   ```
2. In your GitHub repository settings under **Settings → Pages**:
   - Set **Source** to **GitHub Actions**.
3. The workflow builds the static bundle, runs the test suite, and publishes to GitHub Pages automatically.

---

## Browser Compatibility

- **Google Chrome**: 90+ (Desktop & Mobile)
- **Apple Safari**: 15+ (macOS, iOS, iPadOS)
- **Mozilla Firefox**: 90+
- **Microsoft Edge**: 90+
- Touch devices: iPhone, iPad, Android phones, Android tablets, foldable devices.

---

## Future Roadmap

The Pixora architecture is designed to accommodate future modular capabilities:
- Boolean operations (Union, Subtract, Intersect, Exclude)
- Auto Layout and flexbox-style constraints
- Reusable component symbols and style libraries
- Vector path pen tool and bezier curve editing
- Prototyping and transition flows

---

## License

MIT License — free for personal and commercial use.
