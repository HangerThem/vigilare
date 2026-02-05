# Vigilare

A customizable productivity dashboard built with Next.js for managing your daily workflow.

## Features

- **Links Panel** - Save and organize your frequently used links with categories (Work, Personal, Study, Other)
- **Notes Panel** - Create and manage notes with category organization
- **Commands Panel** - Store code snippets and commands with syntax highlighting
- **Status Panel** - Monitor website/service availability with real-time status checks and browser notifications
- **Global Search** - Quick search across all panels with `Ctrl/Cmd + P`
- **Command Palette** - Fast actions with `Ctrl/Cmd + K`
- **Theme Support** - Light, Dark, and System theme modes
- **Data Portability** - Export and import your data as JSON
- **Drag & Drop** - Reorder items within panels

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + P` | Open global search |

## Tech Stack

- [Next.js 15](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Fuse.js](https://fusejs.io/) - Fuzzy search
- [highlight.js](https://highlightjs.org/) - Syntax highlighting
- [SortableJS](https://sortablejs.github.io/Sortable/) - Drag and drop
- [React Hook Form](https://react-hook-form.com/) - Form handling

## Data Storage

All data is stored locally in your browser's localStorage. Use the Export/Import features in the command palette to backup or transfer your data.

## License

MIT