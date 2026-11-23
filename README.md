<p align="center">
  <img src="assets/Banner.png" alt="CONSTANT Banner" width="300%">
</p>

<p align="center">
  <img src="assets/Icon.ico" alt="CONSTANT App Icon" width="60">
</p>

<h1 align="center">CONSTANT</h1>
<p align="center">
  <b>Personalized Routine & Productivity Management System</b>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/PROJECT-CONSTANT-c0392b.svg?style=flat-square" alt="Project">
  <img src="https://img.shields.io/badge/Category-Productivity-blue.svg?style=flat-square" alt="Category">
  <img src="https://img.shields.io/badge/Focus-Routine%20%26%20Habits-black.svg?style=flat-square" alt="Focus">
  <img src="https://img.shields.io/badge/Developed%20By-Project%20Hellhound-lightgrey.svg?style=flat-square" alt="Organization">
</p>

## Overview

CONSTANT is a personal productivity and routine management application designed to bring everyday activities into one organized workspace.

It combines habit tracking, task management, calendar scheduling, financial tracking, and productivity analytics. Its local-first architecture stores application data in the browser's IndexedDB through Dexie, while optional AI integration provides intelligent assistance and insights.

The application supports both web and desktop environments through React and Electron.

## Architecture Features

| Layer | Module | Responsibility |
|---|---|---|
| 01 | Dashboard | Provides a consolidated overview of productivity activities. |
| 02 | Habit Management | Organizes and tracks recurring personal habits. |
| 03 | Task Management | Structures responsibilities into tasks and subtasks. |
| 04 | Calendar & Scheduling | Provides time-based organization of activities. |
| 05 | Workspace | Centralizes productivity-related organization. |
| 06 | Analytics | Presents progress measurements and productivity summaries. |
| 07 | Smart Insights & AI | Provides an interface for intelligent productivity assistance. |
| 08 | Finance | Provides a dedicated area for personal financial organization. |
| 09 | Settings | Centralizes application preferences and configuration. |

## Core Capabilities

- **Local-First Storage:** Stores application data locally using IndexedDB and Dexie.
- **Habit Management:** Track daily routines and monitor consistency.
- **Task Organization:** Manage tasks and subtasks in one workspace.
- **Productivity Analytics:** Review progress and activity.
- **AI Integration:** Connect local or cloud-based AI models.
- **Desktop Support:** Run CONSTANT as a desktop application using Electron.
- **Data Portability:** Export and restore application data through JSON backups.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 18 |
| Language | TypeScript 5 |
| Build Tool | Vite |
| Desktop Runtime | Electron |
| Local Database | IndexedDB |
| Database Wrapper | Dexie |
| AI Integration | Ollama / Cloud API |
| Runtime | Node.js |
| Package Manager | npm |

---

## Installation & Deployment

### 1. Prerequisites

Install the following dependencies before setting up CONSTANT.

| Requirement | Minimum Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.8+ |
| Git | Latest stable |

---

### Productivity Workflow

CONSTANT's intended productivity workflow follows five primary stages:

| Stage | Process | Objective |
|---|---|---|
| 01 | Planning | Define objectives, routines, and responsibilities. |
| 02 | Organization | Structure activities into manageable tasks and schedules. |
| 03 | Execution | Perform scheduled activities and update completion states. |
| 04 | Tracking | Monitor habits, tasks, and accumulated progress. |
| 05 | Evaluation | Review productivity patterns and identify areas for improvement. |

---

## Core Application Modules

### 1. Dashboard

The Dashboard provides a centralized overview of the user's productivity environment.

It is designed to bring important information together, reducing the need to navigate between individual management areas.

Key dashboard elements include:

- Overall productivity overview.
- Daily progress indicators.
- Habit and routine summaries.
- Task completion statistics.
- Upcoming activities and deadlines.
- Productivity-related information.

### 2. Habit Management

The Habit Management module focuses on establishing and maintaining consistent personal habits.

It provides a dedicated space for organizing recurring activities and observing progress over time.

Core objectives:

- Organize personal habits.
- Track daily habit completion.
- Monitor consistency.
- Visualize habit-related progress.
- Support long-term behavioral improvement.

### 3. To-Do List

The To-Do List module provides a structured approach to managing personal responsibilities.

Its organizational model supports hierarchical task management, allowing larger responsibilities to be divided into smaller, manageable activities.

Key capabilities:

- Main task organization.
- Subtask management.
- Task completion tracking.
- Priority classification.
- Due-date organization.
- Task progress monitoring.
- List, board, and timeline-oriented organization.

### 4. Calendar & Scheduling

The Calendar module provides a time-oriented view of personal activities and responsibilities.

It is designed to connect scheduled activities with the broader task-management workflow.

Key areas:

- Monthly calendar overview.
- Daily schedule visualization.
- Scheduled activity tracking.
- Deadline awareness.
- Time-based task organization.
- Activity status indicators.

### 5. Workspace
The Workspace provides a dedicated area for organizing productivity-related information and activities.
- Organize productivity-related content in one place.
- Maintain a structured workspace for ongoing activities.
- Keep relevant information accessible.
- Complement the central task and routine-management workflow.
  
### 6. Analytics & Smart Insights
The Analytics and Smart Insights areas support productivity evaluation and provide a broader understanding of personal progress.
- Monitor productivity and activity trends.
- Review habit consistency and completion rates.
- Identify patterns in daily and long-term activities.
- Gain AI-assisted insights into personal productivity.

### 7. Finance
The Finance section provides a dedicated navigation area for personal financial organization within the broader productivity environment.
- Organize personal financial information.
- Track financial activities and transactions.
- Review spending patterns.
- Maintain financial information alongside other productivity activities.

### 8. Settings & Configuration
The Settings module centralizes application-level preferences and configuration.
- Manage application preferences.
- Configure available application options.
- Control supported personalization settings.
- Access centralized application configuration.

---

## Interface & Experience

CONSTANT follows a productivity-focused interface design intended to balance information density, accessibility, and visual clarity.

The interface uses a centralized navigation structure to organize the different application modules.

### Design Principles

- **Centralized Navigation** — Access productivity modules through a consistent navigation interface.
- **Visual Hierarchy** — Prioritize important activities, progress indicators, and actionable information.
- **Structured Layouts** — Organize complex information into clearly separated panels and sections.
- **Progress Visibility** — Use visual indicators to communicate completion states and productivity trends.
- **Consistent Interaction** — Maintain predictable navigation and interaction patterns across application areas.

### Visual Identity

CONSTANT uses a distinctive visual identity built around a strategic and disciplined productivity philosophy.

Its branding emphasizes:

- Consistency.
- Focus.
- Discipline.
- Routine.
- Progress.
- Long-term improvement.

---


Verify your environment:

```bash
node --version
npm --version
python3 --version
git --version
```

### 2. Clone Repository

Clone the official repository:

```bash
git clone https://github.com/project-hellhound-org/Constant.git
```

Navigate into the project:

```bash
cd Constant
```

### 3. Install Dependencies

**Option A — npm installation**

```bash
npm install
```

**Option B — Installation script**

```bash
chmod +x install.sh
./install.sh
```

Use one installation method. Running both is generally unnecessary.

### 4. Run CONSTANT

**Web Development Mode**

```bash
npm run dev
```

Open the local URL displayed in your terminal.

**Desktop Development Mode**

```bash
npm run electron:dev
```

This launches the Electron desktop environment.

### 5. Available npm Scripts

Inspect the scripts defined by the project:

```bash
npm run
```

Use the scripts listed by npm for building, testing, and packaging. Do not assume a script exists simply because a README says it should.

---

## AI Integration & Configuration

CONSTANT supports optional AI integration through local or cloud-based model providers.

### Option 1 — Local AI with Ollama

Ollama allows you to run supported language models locally.

**Step 1: Install Ollama**

Download and install Ollama:

https://ollama.com/download

**Step 2: Download a model**

```bash
ollama pull llama3.1
```

**Step 3: Start Ollama**

```bash
ollama serve
```

**Step 4: Verify the service**

```bash
curl http://localhost:11434/api/tags
```

**Step 5: Configure CONSTANT**

Open CONSTANT and navigate to its AI settings.

Configure the following values:

| Setting | Value |
|---|---|
| Provider | Ollama / OpenAI-compatible |
| Base URL | `http://localhost:11434/v1` |
| Model | `llama3.1` |
| API Key | Provider-dependent |

The local OpenAI-compatible chat completion endpoint is:

```text
http://localhost:11434/v1/chat/completions
```

### Option 2 — Cloud AI Provider

CONSTANT can also connect to a compatible cloud AI API.

Open the AI configuration settings and provide:

| Setting | Example |
|---|---|
| Provider | OpenAI-compatible |
| API Base URL | Provider API endpoint |
| Model | `gpt-4o-mini` |
| API Key | Your provider API key |

**Important:** Use the endpoint and model supported by your selected provider. Never commit API keys or other credentials to Git.

### AI Configuration Checklist

- [ ] Install or select an AI provider.
- [ ] Verify provider connectivity.
- [ ] Configure the API base URL.
- [ ] Select a supported model.
- [ ] Configure the API key if required.
- [ ] Save settings.
- [ ] Test the AI functionality inside CONSTANT.

---

## Data Storage & Backup

CONSTANT uses IndexedDB with Dexie for local application data storage.

**Data management**

- Application data is stored locally in the browser environment.
- JSON backup and restore functionality supports data portability.
- Export backups regularly before major updates or environment changes.

**Recommended backup procedure**

1. Open CONSTANT.
2. Navigate to the available backup or data management option.
3. Export your data as JSON.
4. Store the backup in a secure location.
5. Use the restore option when required.

---

## Testing & Verification

Run the following checks after installation.

### 1. Verify Dependencies

```bash
npm ls --depth=0
```

### 2. Inspect Available Scripts

```bash
npm run
```

### 3. Run the Application

```bash
npm run dev
```

Verify that:

- The application loads successfully.
- Dashboard components render correctly.
- Habit creation and tracking work.
- Tasks and subtasks can be managed.
- Calendar functionality works.
- Local data persists after refreshing.
- Backup and restore operate correctly.

### 4. Verify AI Integration

For Ollama:

```bash
curl http://localhost:11434/api/tags
```

Confirm that the configured model is available and test AI functionality through the application.

### 5. Run Automated Tests

If a test script is defined in `package.json`:

```bash
npm test
```

If no test script is configured, use the available project-specific test commands shown by:

```bash
npm run
```

---

## Production Build

Before preparing a production release, inspect the available build scripts:

```bash
npm run
```

If the project defines the standard Vite build script:

```bash
npm run build
```

Review the generated build output and test the production application before deployment.

For Electron packaging, use the packaging script defined by the project rather than assuming a particular Electron builder configuration.

---



## Security & Data Considerations

- CONSTANT uses local-first data storage through IndexedDB.
- Cloud AI providers may process information sent through their APIs.
- Avoid sending passwords, authentication tokens, or sensitive personal information to AI providers.
- Keep API keys out of source control.
- Maintain secure copies of JSON backups.
- Review provider privacy policies before enabling external AI services.

## Limitations

- AI functionality depends on the availability and configuration of the selected provider.
- Local AI performance depends on available system resources and model requirements.
- Browser-based storage is subject to browser storage policies and user-controlled data deletion.
- Desktop packaging and automated test commands depend on the scripts configured in the repository.

---

## Use Cases

- **Personal Productivity:** Organize everyday responsibilities within a centralized environment.
- **Habit Development:** Establish recurring routines and monitor consistency.
- **Task Organization:** Break complex responsibilities into manageable activities.
- **Time Management:** Organize schedules, deadlines, and daily commitments.
- **Goal Tracking:** Monitor progress toward personal objectives.
- **Self-Improvement:** Evaluate productivity patterns and identify areas for improvement.
- **Personal Organization:** Bring routine management, task planning, and progress monitoring together.

---

## Author

<p align="center">
  <img src="https://img.shields.io/badge/Author-ALPH4_X3-c0392b?style=for-the-badge" alt="ALPH4_X3">
</p>

<p align="center">
  Developed by <b>Project Hellhound</b>
  <br>
  Part of the <a href="https://github.com/project-hellhound-org">Project Hellhound</a> ecosystem.
</p>
