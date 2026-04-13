# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Vite)
npm run build    # production build → dist/
npm run preview  # preview the production build locally
npm run lint     # ESLint (TypeScript + react-hooks rules)
```

No test suite is configured. TypeScript errors surface via `vite build`.

## Architecture

Single-page React app that listens to microphone input, detects pitch with YIN (via `pitchfinder`), and prompts the user to play target notes.

**Startup flow**: `App` shows a START button → user clicks → `startListening` requests mic, sets up Web Audio pipeline, runs `requestAnimationFrame` loop → `AudioData` (`note`, `freq`, `db`) flows into the active exercise on every frame.

**Exercise pattern**: Each exercise (`NoteExercise`, `StringExercise`) receives `audio: AudioData` as a prop. It picks a target, uses `useNoteMatch` to compare detected vs. target, and calls `advance` when the user holds the correct note for 200 ms. `useNoteMatch` triggers a 400 ms "correct" visual before advancing.

**Config portal**: `ConfigSection` renders its children into `#config-portal` (a div in `App`'s JSX below the exercise mode selector) via `createPortal`. This lets each exercise own its config state while the UI appears in a consistent location below the mode select.

**Validation pattern**: `useValidatedInput` manages value/committed state for text inputs. On blur it runs the validate fn — if valid, calls `persist` (a `storage.*` setter) and `onCommit`; if invalid and `revertOnInvalid: true`, reverts to last committed. Callers read initial value from `storage.*` and pass `storage.*.set` as `persist`. Compound inputs (fret range) use a single combined string `"0-11"` split into two `<input>` elements in JSX.

**Storage**: All `localStorage` access goes through `src/storage.ts`. Never call `localStorage` directly — use `storage.scale`, `storage.tuning`, `storage.fretRange`, `storage.enabledStrings`.

**Note normalization**: All notes are normalized to sharps throughout (`toSharp` in `src/lib/audio.ts`). Flats never appear internally. `tonal` is used for note math, scale lookups, and MIDI/frequency conversions.

**String exercise specifics**: Strings are numbered 1 (high E) to N (lowest), matching guitar convention. `tuningNotes[0]` is the lowest string. `openNoteForString(tuning, str)` maps string number to its open note. Octaves are hardcoded in `STANDARD_OCTAVES` (index 0 = low E at octave 2). Fret range is validated to 0–11 max.

**Deploy**: Push to `main` triggers `.github/workflows/deploy.yaml` which builds and uploads `dist/` to S3 at `s3://static-sites-juliangeorge/guitar-note-practice`.
