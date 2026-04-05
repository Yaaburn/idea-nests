

## Plan: 5 Upgrades — Fix Build Error + Create Project + Integrations + Remove Analyzer + Dashboard + Profile

### 0. Fix Build Error (Critical)
**File:** `src/components/layout/Sidebar.tsx`
- Change `useRef<NodeJS.Timeout | null>` to `useRef<ReturnType<typeof setTimeout> | null>` (lines 31-32)

### 1. Enhance Create Project — Add Process Timeline + Integrations Steps
**File:** `src/pages/CreateProject.tsx`
- Expand from 6 steps to 8 steps
- **New Step 5 — Process Timeline:** Add timeline entries with event title, date, type (milestone/iteration/review/meeting/launch), description, evidence file field (URL/upload placeholder), and verification type (Auto/Mentor/Institution). Users can add multiple entries to document their journey so far.
- **New Step 6 — Integrations & Tools:** Simplified integration picker — users add platform + URL pairs (Google Sheets, Trello, Notion, GitHub, Figma, Slack, etc.) to link existing project management tools. Suggested platform chips for quick selection.
- Renumber existing Step 5 (Visual Identity) → Step 7, Step 6 (Publish) → Step 8
- Update `totalSteps`, `canGoNext()`, and step rendering

### 2. Redesign Integration Hub
**File:** `src/pages/IntegrationHub.tsx`
- Redesign as project-contextual tool links manager wrapped in AppLayout
- Two sections: "Your Connected Tools" (linked platforms with URL, edit/remove) and "Add New Integration" (searchable grid with platform icon, name, description, "+ Add" button opening inline URL input)
- Platforms: Google Sheets, Trello, Asana, Jira, GitHub, GitLab, Figma, Notion, Slack, Google Drive, Miro, Linear
- Clean card-based UI matching TalentNet design system

### 3. Remove Process Analyzer
**Files:** `src/App.tsx`, `src/components/Navbar.tsx`
- Remove `/process-analyzer` route and import from App.tsx
- Remove "Analyzer" link from Navbar

### 4. Dashboard — Add Sidebar Icon + Incubator/Program Manager Gating
**Files:** `src/components/layout/Sidebar.tsx`, `src/pages/Dashboard.tsx`
- Add `BarChart3` icon "Dashboard" to Sidebar nav items (between Your Projects and People)
- Wrap Dashboard in AppLayout instead of Navbar/Footer
- Add gating UI: show "Incubator / Program Manager" upgrade card for non-authorized users. The term is **"Incubator"** — businesses that buy a program to manage multiple projects with multiple founders.

### 5. Hide Regional Rank on Other Users' Profiles
**File:** `src/pages/Profile.tsx`
- Use route param `:id` to determine if viewing own profile vs others
- If viewing others' profile: hide `RegionalRankCard`
- If viewing own profile: keep as-is

### Files Modified
| File | Change |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Fix NodeJS type + add Dashboard icon |
| `src/pages/CreateProject.tsx` | Add 2 new steps (Process Timeline + Integrations) |
| `src/pages/IntegrationHub.tsx` | Redesign as tool links manager |
| `src/App.tsx` | Remove process-analyzer route |
| `src/components/Navbar.tsx` | Remove Analyzer link |
| `src/pages/Dashboard.tsx` | Wrap in AppLayout + incubator gating |
| `src/pages/Profile.tsx` | Conditionally hide RegionalRankCard |

