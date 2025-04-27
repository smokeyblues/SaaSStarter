# Project Overview

Your goal is to build a transmedia IDE application.

**1. Project Name:** Transmedia IDE

**2. Core Concept:**
The Transmedia IDE is envisioned as a comprehensive **SaaS platform** designed to empower creators in the planning, development, and strategic management of complex **transmedia projects**. It aims to move beyond simple planning tools to become an **Integrated Development Environment** specifically tailored for narrative experiences that span multiple platforms and formats.

**3. Problem Addressed:**
The project addresses the inherent complexity and friction involved in developing transmedia properties. This includes:
_ Managing scattered ideas, documents, and assets across different formats.
_ Overcoming creative bottlenecks, especially in early-stage asset creation.
_ Navigating the challenges of building and engaging audiences strategically across platforms.
_ Bridging the gap between creative concept and investable intellectual property, particularly for ambitious ideas often overlooked by traditional industry pipelines.

**4. Target Audience:**
The primary users are **indie creators, writers, game developers, world-builders, and small studios** who are developing original IP with multi-platform potential. It specifically targets those aiming for significant cultural impact and seeking structured, efficient ways to bring complex narrative visions to life.

**5. Core Philosophy & Vision:**
_ **Structured Creativity:** Provides a robust framework based on the Transmedia Production Bible, implemented via a **guided workflow** (Treatment -> Business -> Design/Functional -> Tech) to ensure strategic development.
_ **Audience Cultivation:** Emphasizes features and workflows that help creators plan for and track audience engagement from early stages.
_ **Building Investable IP:** Aims to help creators develop their projects into tangible, validated, and well-documented assets that can attract significant investment for larger-scale productions (films, games, experiences).
_ **Reducing Friction & Enhancing Accessibility:** The long-term vision includes integrating **AI generative tools** (via APIs like Replicate, Runway, ElevenLabs) and a **"Virtual Studio System"** (curated, reusable 3D environments and characters) to streamline asset creation, ensure consistency, and provide high-quality starting points. \* **Community & Collaboration:** Fosters connection and collaboration between creators through integrated community features (initially Discord).

**6. Monetization Model:**
The platform operates on a **freemium SaaS model** with tiered pricing (e.g., "Creative" - Free, "Producer" - Paid, "Executive Producer" - Paid+), where advanced features, higher limits, AI tools, and Virtual Studio assets are primarily accessed via paid subscriptions.

**7. Technology Stack:**
The application is being built using **SvelteKit (Svelte 5)**, **TypeScript**, **Supabase** (Authentication, PostgreSQL Database, Storage), **Tailwind CSS**, and **DaisyUI**. Future integrations will involve third-party AI APIs.

# Core Functionalities

**Instructions.md - Section 2: Core Functionalities**

This section details the primary capabilities of the Transmedia IDE MVP.

**2.1. User Authentication & Profile Management**

- **Behaviors:**
  - Users can sign up using email/password or OAuth providers via Supabase Auth UI.
  - Users can log in and log out securely.
  - Password reset functionality is available.
  - Authenticated users have a basic profile where they can manage minimal information (e.g., Full Name, Avatar URL, potentially Company Name).
  - Session management is handled securely using Supabase SSR library.
- **Relevant Schema:** `auth.users` (Supabase managed), `public.profiles` (id [FK to auth.users], full_name, avatar_url, company_name, updated_at).

**2.2. Team Management**

- **Behaviors:**
  - Authenticated users can create new Teams, becoming the 'owner'.
  - Team Owners can invite other registered users via email to join their team with specific roles ('admin', 'member' - owner is implicit). Requires Resend integration for email sending.
  - Invited users see pending invitations on their dashboard and can accept or decline.
  - Team Owners (and potentially Admins later) can view team members and their roles.
  - Team Owners can remove members from the team.
  - Team Owners can change the roles of existing members (excluding changing ownership).
  - Team Owners can edit the Team Name.
  - Team Owners can delete the Team (requires confirmation, should ideally handle project deletion or transfer).
  - Users can view the details of teams they are members of.
- **Relevant Schema:** `public.teams` (id, name, owner_user_id, created_at, updated_at), `public.team_memberships` (user_id, team_id, role, created_at), `public.team_invitations` (id, team_id, invited_by_user_id, invited_user_email, role, token, status, expires_at, created_at, expired_at, accepted_at, accepted_by_user_id).

**2.3. Project Management (Core)**

- **Behaviors:**
  - Users (acting within a team context) can create new Projects associated with a team they are a member of.
  - Users see a list of projects belonging to their teams on their main dashboard.
  - Users can navigate to a specific project workspace.
  - Within the project workspace, users (initially Team Owners) can edit the Project Name.
  - Team Owners can delete a Project associated with their team (requires confirmation).
- **Relevant Schema:** `public.projects` (id, name, owner_team_id [FK to teams], created_at, updated_at).

**2.4. Project Workspace & Guided Workflow (IDE Core)**

- **Behaviors:**
  - The project workspace (`/projects/[projectId]/...`) uses a shared layout (`+layout.svelte`).
  - The layout displays a consistent header with Project Name (editable), Breadcrumbs, and Project Actions (Edit Name, Delete).
  - The layout features a **Tab-based navigation** for the main Bible Sections (Treatment, Business, Design, Functional, Tech).
  - **Guided Workflow Logic (Critical):**
    - Initially, only the "Treatment" tab is active and potentially marked "Start Here". Other tabs are visible but disabled/de-emphasized.
    - Upon detection that key Treatment subsections (e.g., Synopsis, Characters) have content (based on `sectionStatus` data loaded in `+layout.server.ts`), the "Business & Marketing" tab becomes active and marked "Next Step". Others remain disabled.
    - Upon detection that key Business subsections (e.g., Audience, Goals) have content, a "Market Testing Prompt" appears, and the "Design Spec" and "Functional Spec" tabs become active. Tech remains disabled.
    - Upon detection that the Functional Spec has been started (e.g., a record exists), the "Tech Spec" tab becomes active.
  - Clicking an _active_ tab navigates the user to the corresponding child route (e.g., `/projects/[projectId]/treatment`).
  - The layout uses data (`sectionStatus`) loaded via `+layout.server.ts` to determine the active/disabled state of tabs. This data must be derived from querying the status of underlying section tables (e.g., `project_treatments`, `project_business_details`).
- **Relevant Schema:** Relies on data derived from `project_treatments`, `project_business_details`, `project_functional_specs`, etc., to determine section status. Layout itself uses `projects` and `teams`.

**2.5. Bible Section: Treatment (MVP Implementation)**

- **Behaviors:**
  - Accessed via the "Treatment" tab.
  - Uses **sub-navigation** (Vertical Sidebar) for subsections: Tagline, Synopsis, Back Story & Context, Characterization & Attitude, Plot Points, Scripts.
  - Provides input forms for each subsection:
    - Tagline: Simple text input.
    - Synopsis, Back Story, Characterization: Rich Text Editor (RTE).
    - Plot Points: Repeatable list of text inputs, allowing adding/removing/reordering points.
    - Scripts: Basic file upload area (accepts PDF, Fountain, etc.).
  - User input is saved via server actions (`+page.server.ts` for this route).
  - Saving content in key subsections (e.g., Synopsis, Characterization) updates the underlying data that informs the `sectionStatus.treatment` flags used by the main project layout.
  - Users can flexibly start with any subsection. Visual indicators (post-MVP) might show which subsections have content.
- **Relevant Schema:** `public.project_treatments` (id, project_id, tagline, synopsis, backstory_context, characterization_attitude, created_at, updated_at), `public.project_plot_points` (id, project_id, description, order_index, created_at, updated_at). Script uploads relate to `public.project_assets`.

**2.6. Bible Section: Business & Marketing (MVP Implementation)**

- **Behaviors:**
  - Accessed via the "Business & Marketing" tab (once unlocked).
  - Uses sub-navigation for subsections (MVP focuses on Goals, Success Indicators, User Need, Target Audience, Business Models).
  - Provides input forms (text inputs, RTEs) for these key subsections.
  - User input is saved via server actions.
  - Saving content in key subsections (e.g., Audience, Goals) updates the underlying data that informs the `sectionStatus.business` flags used by the main project layout.
- **Relevant Schema:** `public.project_business_details` (id, project_id, goals_user, goals_creative, goals_economic, success_indicators, user_need, target_audience, business_models, created_at, updated_at).

**2.7. Basic Asset Management (MVP)**

- **Behaviors:**
  - Users can upload files (images, PDFs, potentially script files) within relevant Bible section interfaces (e.g., attaching concept art in Treatment/Characters, uploading a script).
  - Uploaded files are stored securely (Supabase Storage).
  - Metadata about the file (name, type, size, uploader, project link, storage path) is saved.
  - (MVP focuses on upload; browsing/managing a central library is post-MVP).
- **Relevant Schema:** `public.project_assets` (id, project_id, uploaded_by_user_id, file_name, file_path, file_type, size_bytes, created_at, updated_at, asset_category).

**2.8. Manual Feedback Logging (MVP)**

- **Behaviors:**
  - Provides a simple interface (likely accessible from the project layout or dashboard) to manually log feedback received externally.
  - Form includes fields for: Description of item shared, Platform/Source of feedback, Feedback text.
  - Logged feedback is displayed chronologically, associated with the project.
  - (Logs are generally immutable in MVP).
- **Relevant Schema:** `public.project_feedback_log` (id, project_id, logged_by_user_id, shared_item_description, platform_source, feedback_received, logged_at).

**2.9. Community Integration (MVP)**

- **Behaviors:**
  - The application UI includes a prominent, persistent link to the official project Discord server.
- **Relevant Schema:** N/A (External link).

**Note:** All data access and modification must be protected by appropriate Row Level Security (RLS) policies in Supabase, generally based on team membership roles.

# Doc

# Current file structure

# Important Implementation Notes
