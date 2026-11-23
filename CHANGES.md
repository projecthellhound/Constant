# Habit OS — architecture update #2

`npm install`, then `npm test` and `npm run build`. The database upgrades automatically to **v6** on first launch
(from v4 or v5). Your tasks, steps, notes, wishlist items and checklists are converted, not discarded.

## What changed in this round

### 1. Sub-topics removed from Workspace
Topics tab, topic pickers on notes/wishlist, the topic tree and cross-entity links are gone (tables `topics`, `entityLinks` dropped).
Habit **sub-habits with sub-topics** (Add Habit → section 2) are a different feature and are unchanged.

### 2. Do-List (new endpoint `dolist`, replaces "Tasks")
One place for creating tasks **and** the steps that finish them. Previously there were two overlapping systems
(subtasks and to-do list items); they are now a single `DoItem` model (`doItems` table):
- A task = the objective (title, priority, frequency, due date). Its Do-List = ordered steps; any step can optionally carry a date/time.
- Finishing the last step completes the task; unchecking or adding a step re-opens it; completing a task checks all its steps.
- Scheduled steps appear on the Calendar for their date and count toward "scheduled today".
- Used everywhere through one shared component/service (`src/dolist/`): Do-List page, task creation panel, both side drawers, Dashboard, Calendar.
- Filters: All / Today / Open / Done.

### 3. Workspace = Notepad only (notes + wishlist)
New rich-text Notepad modelled on the reference design:
search (Ctrl+K), All notes / Pinned / Recent / **Wishlist** filters, sort toggle, pin star, note list with preview and edit time,
editor with title, removable tags, toolbar (bold, italic, underline, code, bullets, numbering, checklist, link, undo/redo, full screen),
autosave with a "Saved …" indicator, created/updated dates and live word count, and a ⋯ menu (pin, duplicate, convert note↔wishlist, delete).
Wishlist items are notes of kind "wishlist" with extra fields (status, priority, est. cost, link).
Old plain-text notes become paragraphs; old wishlist items and checklists are converted into notes.
Editing is autosaved and **flushed when you switch notes or leave the page**.

### 4. Daily Review moved to the top of the Calendar
Sits directly under the calendar header (collapsible); pick a date and append entries.

## Fixed along the way
- New note: the title now reliably receives focus (a render race skipped it for the first/top note).
- Backup import understands files from older versions (subtasks, to-dos, wishlist, plain-text notes).

## Notes / limits
- Not verified visually (no browser in the build environment). Layout was checked structurally in jsdom only — please eyeball spacing in the app.
- Bundle grew again (~+0.35 MB) for the editor engine (TipTap); consider lazy-loading the Notepad.
- Existing dashboard/calendar heatmap counts for tasks are unchanged; they read task status, not steps.
- `Task.endDate/endTime/dueDate` are unchanged (deadlines).

(Earlier changes — sub-habits, Analytics charts, AI settings persistence, Markdown rendering, backup coverage — are still in effect.)


## Unreleased
- Auth: sessions persist across launches (30 days, cleared on sign-out); launch splash greets the user by name.
- Theme: fixed invisible backgrounds (inline `background` shorthand overrode the image; scrim capped at 50%; artwork pre-cached).
- Sidebar: top-right contextual drawer removed; left sidebar can be minimized/expanded (remembered); larger, aligned section titles.
- Notifications: per-habit reminder times (in-app pop-up + OS notification, Done/Skip actions); daily task summary (once / twice / custom) under Settings → Notifications.
- Task modal: three sections merged into one aligned panel.
- Packaging: icon set in `build/`, `resources/`, `public/`; web manifest; Capacitor config for Android/iOS; electron-builder config for Windows/macOS/Linux.
- npm: lockfile updated via `npm audit fix` (0 production vulnerabilities); `allowScripts` policy added to package.json; entry bundle split (1.48 MB → 0.64 MB).

## Rebrand to Constant + Home redesign
- Rebrand: package/app name, window title, installer config, scripts and docs now say Constant; new tree-of-life icon set (png/ico/icns/Linux sizes/web/mobile). Stored data names are unchanged so existing data keeps working.
- Launch: `constant` command (legacy `Habit` alias), Linux menu/desktop entry with the app icon (`desktop/register-launcher.sh`, run by install.sh), no stock Electron menu, window shown after first paint.
- Linux/NVIDIA: avoids the GBM/VA-API driver errors (hardware acceleration off on NVIDIA unless `CONSTANT_GPU=on`); harmless driver noise filtered in the terminal launcher.
- Home: dashboard is a single non-scrolling screen (KPIs, schedule, next up, consistency, tasks, finance, calendar, workspace/projects, smart insights).
- Layout: wider sidebar with larger labels, full-width panels (removed the dead gutters).
- Profile: picture, name, DOB, gender, email, phone, address, city/state/country, occupation, biography; two-step Change password; notification settings nested under Profile.
