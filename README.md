# Tatami Scoreboard

Tatami Scoreboard is an offline Windows application for refereeing Brazilian jiu-jitsu and grappling matches. It is built with Tauri, React, TypeScript, and Zustand. No account, server, CDN, or internet connection is required while it is in use.

## Highlights

- Single-match mode with configurable athletes, colours, rules, timer, scoring, overtime, undo/redo, result confirmation, and CSV match-history export.
- Tournament mode with single-elimination and round-robin formats.
- Manual and random bracket placement, automatic byes, match progression, standings, schedule list, and a round-robin matrix.
- Optional spectator display window synchronized with the referee window.
- Russian and English interface languages; the Windows installer asks for its language before installation.
- Dark and light themes, selectable start/end gong variants, local-only match persistence, and offline operation.

## Install on Windows

Download the latest `Tatami Scoreboard_<version>_x64-setup.exe` from the [Releases page](https://github.com/ivanyushkinikita/bjj-scoreboard/releases), run it, and choose English or Russian in the installer.

The installer contains the offline WebView2 installer required by the application. It is not code-signed, so Windows SmartScreen may show a warning. Download only from the official Releases page; use **More info → Run anyway** only after verifying the source.

## Quick start

1. Select **Single match** or **Tournament** on the home screen.
2. In single-match mode, enter the athletes, choose their colours, set a `MM:SS` duration, and start the match.
3. In a single-elimination tournament, place athletes in the first round (or use random placement), then start the tournament. A competitor without an opponent receives a bye into the next round.
4. In a round-robin tournament, add the athletes and start the tournament directly. Use the list or table view to select a match.
5. Confirm each result to advance the bracket or update the standings. From the completed-match screen, export the scoring history to CSV; its filename includes both athlete names.

## Settings

Use **Settings** to change the application language and colour theme, select start and end gong sounds, configure rules, and open the synchronized spectator display. All settings are stored locally on the device.

Referee guides: [English](MANUAL.en.md) and [Русский](MANUAL.md).

## Development

Requirements: Node.js 22, Rust stable with the MSVC toolchain, Microsoft C++ Build Tools, and Windows SDK.

```bash
npm install
npm run tauri dev
```

Useful checks:

```bash
npm test
npm run build
npm run tauri build
```

The Windows NSIS installer is produced in `src-tauri/target/release/bundle/nsis/`.

## License

See [package.json](package.json) for project metadata and licensing information.
