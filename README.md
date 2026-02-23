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
- **Optional Remote Workspaces** - Account-backed workspace sharing with role-based invites (admin/editor/viewer) and Auth.js credentials/passkey sign-in
- **Drag & Drop** - Reorder items within panels
- **Offline Detection** - Visual indicator when offline

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/hangerthem/vigilare.git
cd vigilare
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

### Production Build

```bash
pnpm build
pnpm start
```

## Keyboard Shortcuts

| Shortcut               | Action               |
| ---------------------- | -------------------- |
| `Ctrl/Cmd + K`         | Open command palette |
| `Ctrl/Cmd + P`         | Open global search   |
| `Ctrl/Cmd + I`         | Open shortcuts       |
| `Ctrl/Cmd + L`         | New link             |
| `Ctrl/Cmd + Shift + N` | New note             |
| `Ctrl/Cmd + Shift + C` | New command          |
| `Ctrl/Cmd + S`         | New status           |
| `Ctrl/Cmd + ,`         | Open settings        |

## Tech Stack

- [Next.js 16](https://nextjs.org) - React framework
- [React 19](https://react.dev) - UI library
- [Tailwind CSS 4](https://tailwindcss.com) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Fuse.js](https://fusejs.io/) - Fuzzy search
- [highlight.js](https://highlightjs.org/) - Syntax highlighting
- [SortableJS](https://sortablejs.github.io/Sortable/) - Drag and drop
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Popper.js](https://popper.js.org/) - Dropdown positioning
- [Lucide React](https://lucide.dev/) - Icons

## Data Storage

Vigilare always supports accountless local mode using browser localStorage.

### Optional Sync Mode (V4)

Vigilare includes optional account-backed remote workspaces (disabled by default):
- Local mode works without an account.
- Remote workspace create/join/share/edit requires authentication.
- Auth supports passkey, credentials, or both.
- Workspace membership is role-based (`admin`, `editor`, `viewer`) and remains until removed.

Required environment variables:

- `NEXT_PUBLIC_SYNC_ENABLED=true`
- `DATABASE_URL=<your-postgres-connection-url>`
- `AUTH_SECRET=<server-side-random-secret>`
- `SMTP_HOST=<smtp-host>`
- `SMTP_PORT=<smtp-port>`
- `SMTP_USER=<smtp-username>`
- `SMTP_PASSWORD=<smtp-password>`
- `EMAIL_FROM=<from-email-address>`

Optional passkey config:

- `WEBAUTHN_RP_NAME=<friendly-name>`
- `WEBAUTHN_RP_ID=<rp-id>`
- `WEBAUTHN_ORIGIN=<https-origin>`

Initialize Prisma client and schema:

- `pnpm exec prisma generate`
- `pnpm exec prisma db push`

### Export & Import

Use the command palette (`Ctrl/Cmd + K`) to:

- **Export Data** - Download all your data as a JSON file
- **Import Data** - Restore data from a previously exported JSON file

## Browser Notifications

The Status Panel supports browser notifications to alert you when monitored services go up or down. You'll need to:

1. Grant notification permissions when prompted
2. Enable notifications in the Status Panel settings
3. Keep the browser tab open for background monitoring

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- Animations powered by [Framer Motion](https://www.framer.com/motion/)
