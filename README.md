# K.L. Studio

A collection of interactive web applications for personal interests.

## Overview

K.L. Studio is a multi-page web application built with Vue 3 and Vite, featuring various tools and visualizations:

### Featured Applications

#### 🎵 Music & Sound

- **Spiral Piano** (`/spiral-piano`)
  - Interactive music visualization based on Equal Temperament
  - Play music by tapping the screen
  - Supports MIDI file playback (drag and drop)

- **12 Equal Temperament** (`/documents/equal-temperament`)
  - Visual representation of the 12-tone equal temperament system
  - Interactive pitch graph and circular visualization

- **Fifth Pitch Graph** (`/documents/fifth-pitch-graph`)
  - Visualization of the circle of fifths in music theory

- **MIDI Player** (`/midi-player`)
  - Play and visualize MIDI files

- **Lotus Player** (`/lotus`)
  - Music notation player and renderer

#### ♟️ Chess

- **Chess Lab** (`/chess-lab`)
  - Full-featured chess analysis application
  - AI game analysis powered by Stockfish
  - Play against AI with adjustable difficulty
  - Position editing and notation support
  - Inspired by [Sabaki](https://github.com/SabakiHQ/Sabaki)
  - Built with [chessboardjs](https://github.com/oakmac/chessboardjs), [chess.js](https://github.com/jhlywa/chess.js), and [stockfish.js](https://github.com/nmrugg/stockfish.js)

#### 🧊 Rubik's Cube

- **Cube Globe** (`/globe-cube3`)
  - 3D Rubik's Cube with Earth texture mapping
  - Interactive rotation and manipulation

- **Cube & Matrix** (`/documents/dynamic-labeled-cube3`)
  - Rubik's Cube matrix representation visualization
  - Shows the mathematical group structure of cube rotations
  - [Read more](https://k-l-lambda.github.io/2020/12/14/rubik-cube-notation/)

- **Cube3 Player** (`/cube3-player`)
  - Play and visualize Rubik's Cube algorithms

- **Cube3 Solver** (`/cube3-solver`)
  - Solve Rubik's Cube puzzles algorithmically

- **Cube Multiplication** (`/documents/cube-multiplication`)
  - Visualize multiplication of cube rotations

- **Cube Cayley Graph** (`/cube-cayley-graph`)
  - Graph theory visualization of the Rubik's Cube group

- **Static/Dynamic Labeled Cube3**
  - Various cube visualization modes

#### 🤖 Algorithm Research

- **StyleGAN Mapping Visualization** (`/documents/stylegan-mapping`)
  - Visualization of StyleGAN's mapping network geometry
  - Interactive exploration of latent space
  - Uses TensorFlow.js for in-browser inference
  - [Read more](https://k-l-lambda.github.io/2020/02/10/stylegan-mapping/)

- **PCA Playground** (`/pca-playground`)
  - Interactive Principal Component Analysis visualization

- **AI Writer** (`/writer/`)
  - AI-powered writing assistant

#### 📐 Mathematics

- **Hyperbolic Geometry** (`/documents/hyperbolic`)
  - Hyperbolic geometry visualizations and tessellations

- **Curves Editor** (`/curves-editor`)
  - Mathematical curve editing and visualization tool

#### 🛠️ Tools

- **WEBM Fixer** (`/tools/webm-fixer`)
  - Fix duration metadata in WEBM video files

- **Mesh Viewer** (`/documents/mesh-viewer`)
  - 3D mesh visualization tool
  - Support for various 3D model formats

## Development

### Prerequisites

- Node.js 21.x (see `.nvmrc`)
- Yarn package manager

### Setup

```bash
# Install dependencies
yarn install

# Start development server
yarn serve

# Build for production
yarn build

# Preview production build
yarn preview

# Lint code
yarn lint
```

### Environment Variables

Create a `.env.local` file for local development:

```
HOST=127.0.0.1
PORT=8130
HTTPS=false
```

Available environment variables:
- `HOST` - Development server host (default: localhost)
- `PORT` - Development server port (default: 8080)
- `HTTPS` - Enable HTTPS for development server
- `VUE_APP_DORME` - Debug mode flag
- `VUE_APP_GOOGLE_ANALYTICS_ID` - Google Analytics tracking ID

### Project Structure

```
klstudio/
├── app/                    # Vue 3 application source
│   ├── views/             # Page components
│   ├── components/        # Reusable components
│   ├── assets/            # Static assets
│   ├── router.ts          # Vue Router configuration
│   ├── home.ts            # Main entry point
│   ├── common-viewer.ts   # Inner page entry
│   └── embed.ts           # Embed page entry
├── inc/                   # Shared TypeScript modules
├── tools/                 # Data generation tools
├── static/                # Generated static assets
├── public/                # Public static files
├── docs/                  # Build output directory
├── tests/                 # Test files
└── vite.config.mjs        # Vite configuration
```

### Key Technologies

- **Vue 3** with Composition API and Options API (compat mode)
- **Vite 5** for fast development and optimized builds
- **TypeScript** for type-safe code
- **Three.js** for 3D graphics
- **TensorFlow.js** for machine learning
- **Plotly.js** for data visualization
- **@k-l-lambda/lotus** for music notation rendering
- **@k-l-lambda/music-widgets** for music playback

### Build Commands

```bash
# Generate Rubik's Cube data tables
yarn cube3-gentable6
yarn cube3-gensolvermap
yarn cube3-genhash
```

### Coding Style

- Use tabs for indentation
- Use double quotes for strings
- Use semicolons
- Stroustrup brace style
- Prefer `const` over `let`

## Machine Learning Models

Some features require pre-trained models to be downloaded:

**StyleGAN Mapping Model:**
Download from [Google Drive](https://drive.google.com/file/d/1nJYeJ4GLBXrXS_iXdd30DsBztpZx1UDM/view?usp=sharing) and extract to `static/mlmodels/`

## Production Deployment

```bash
# Build the application
yarn build

# The built files will be in the docs/ directory
# Serve with any static file server or use the included Express server
yarn start
```

The Express server supports:
- Custom host and port via environment variables
- HTTPS with certificates in `certificates/` directory
- Serving the built application from `docs/`

## Browser Compatibility

- Modern browsers with ES6+ support
- WebGL required for 3D visualizations
- Web Audio API required for sound features

## License

See LICENSE file for details.

## Links

- [K.L. Studio Website](https://k-l-lambda.github.io/klstudio)
- [Blog Posts](https://k-l-lambda.github.io/)
