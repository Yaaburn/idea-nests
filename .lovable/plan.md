

## Plan: Connect Create Project → Your Projects → Project Detail

### Goal
When a user completes the 8-step Create Project flow and clicks "Publish", the project data is saved and immediately appears in "Your Projects". Clicking the project card opens its full profile page (ProjectDetail) populated with the entered data.

### Architecture
A simple **localStorage-based project store** (`src/lib/projectStore.ts`) will bridge the three pages. No backend changes needed.

```text
CreateProject (publish) → save to localStorage
                              ↓
YourProjects → reads localStorage + existing mock data
                              ↓
ProjectDetail → reads localStorage by ID (or falls back to hardcoded demo)
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/projectStore.ts` | **CREATE** — localStorage CRUD for created projects |
| `src/pages/CreateProject.tsx` | **MODIFY** — `handlePublish()` saves all form data to store, navigates to `/your-projects` |
| `src/pages/YourProjects.tsx` | **MODIFY** — Merge stored projects into the list, show count accurately |
| `src/pages/ProjectDetail.tsx` | **MODIFY** — Read from store by route param `:id`, populate all sections dynamically |

### 1. Project Store (`src/lib/projectStore.ts`)
- `CreatedProject` interface with all 8-step fields (title, category, tags, cover, story fields, roles, milestones, timeline, integrations, visual identity, publish settings)
- `getCreatedProjects()` — read from localStorage
- `getCreatedProjectById(id)` — find one
- `saveCreatedProject(project)` — append and persist
- `generateProjectId()` — unique ID prefixed `"user-"` to distinguish from mock data

### 2. CreateProject — Save on Publish
- In `handlePublish()`: build a `CreatedProject` object from all form state, call `saveCreatedProject()`
- Navigate to `/your-projects` after save (instead of `/project/1`)
- Toast: "Dự án đã được tạo thành công!"

### 3. YourProjects — Show Created Projects
- Import `getCreatedProjects()`, convert each to the existing `Project` card interface:
  - `name` ← title, `description` ← vision or whyDoingThis, `coverImage` ← coverImage (or placeholder), `stage` ← "Idea", `status` ← "in-progress", `role` ← "leader", `leader.isYou` ← true, `progress` ← 0, `tags` ← tags, `memberCount` ← 1
- Merge with existing mock data, newest first
- Update count display to reflect total
- Clicking a user-created project navigates to `/project/user-xxx` (ProjectDetail)

### 4. ProjectDetail — Dynamic Content from Store
- Read `:id` param. If ID starts with `"user-"`, load from store
- Populate: title, tagline (vision), coverImage, tags, founder story tabs (whyDoingThis, howWeWork, whatWeNeed), roles list, milestones → timeline, integrations display
- If no store match, fall back to existing hardcoded demo data (backward compatible)
- Apply button and other interactions remain functional

### Edge Cases
- Empty cover image → use placeholder unsplash image
- No roles → show "No open positions yet" in the What We Need tab
- No timeline entries → show empty state in Progress Timeline
- localStorage unavailable → graceful fallback to empty array

