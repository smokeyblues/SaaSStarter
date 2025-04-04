-- 1. Create the Teams table
CREATE TABLE public.teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- User who created/owns the team
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments to the table and columns
COMMENT ON TABLE public.teams IS 'Stores team information.';
COMMENT ON COLUMN public.teams.owner_user_id IS 'The user who initially created and owns the team.';

-- 2. Create the Team Memberships table (Junction table)
CREATE TABLE public.team_memberships (
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL DEFAULT 'member', -- e.g., 'owner', 'admin', 'editor', 'viewer'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (team_id, user_id) -- Ensures a user has only one role per team
);

-- Add comments
COMMENT ON TABLE public.team_memberships IS 'Maps users to teams and defines their role within the team.';
COMMENT ON COLUMN public.team_memberships.role IS 'Role of the user within the team (e.g., owner, admin, member).';


-- 3. Create the Projects table
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    owner_team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, -- Project must belong to a team
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments
COMMENT ON TABLE public.projects IS 'Stores project details, owned by a team.';
COMMENT ON COLUMN public.projects.owner_team_id IS 'The team that owns and manages this project.';


-- 4. Enable Row Level Security (RLS) for the new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;


-- 5. Create RLS Policies

-- Policies for 'teams' table
CREATE POLICY "Teams are viewable by their members." ON public.teams
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.team_memberships tm WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create teams." ON public.teams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Team owners can update their teams." ON public.teams
    FOR UPDATE USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Team owners can delete their teams." ON public.teams
    FOR DELETE USING (auth.uid() = owner_user_id);


-- Policies for 'team_memberships' table
CREATE POLICY "Team members can view memberships of their teams." ON public.team_memberships
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.team_memberships tm_check
            WHERE tm_check.team_id = team_memberships.team_id AND tm_check.user_id = auth.uid()
        )
    );

-- Allows team owners (or admins later) to add users. Requires team_id and user_id in the INSERT.
CREATE POLICY "Team owners can insert new members." ON public.team_memberships
    FOR INSERT WITH CHECK (
      auth.role() = 'authenticated' AND
      EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.id = team_memberships.team_id AND t.owner_user_id = auth.uid()
          -- Add OR condition here if you add an 'admin' role: OR EXISTS (SELECT 1 FROM team_memberships tm_admin WHERE tm_admin.team_id = team_memberships.team_id AND tm_admin.user_id = auth.uid() AND tm_admin.role = 'admin')
      )
    );

-- Allows team owners (or admins later) to update roles (e.g., promote to admin, change roles).
-- Prevents changing the owner role for now.
CREATE POLICY "Team owners can update member roles." ON public.team_memberships
    FOR UPDATE USING (
      auth.role() = 'authenticated' AND
      EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_memberships.team_id AND t.owner_user_id = auth.uid()
            -- Add OR condition here if you add an 'admin' role
        )
    )
    WITH CHECK (
      role <> 'owner' AND -- Prevent changing *to* owner via update, owner set on creation/transfer
      EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_memberships.team_id AND t.owner_user_id = auth.uid()
            -- Add OR condition here if you add an 'admin' role
        )
    );


-- Allows users to remove themselves (leave team) OR owners (or admins later) to remove others.
-- Protects owner from being removed.
CREATE POLICY "Users can leave teams or owners can remove members." ON public.team_memberships
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        (
            -- Case 1: User removing themselves (but not if they are the owner)
            (team_memberships.user_id = auth.uid() AND team_memberships.role <> 'owner') OR
            -- Case 2: Owner removing another member (who is not the owner)
            (
                team_memberships.role <> 'owner' AND
                EXISTS (
                    SELECT 1 FROM public.teams t
                    WHERE t.id = team_memberships.team_id AND t.owner_user_id = auth.uid()
                )
                 -- Add OR condition here if you add an 'admin' role for removing members
            )
        )
    );


-- Policies for 'projects' table
CREATE POLICY "Team members can view projects of their teams." ON public.projects
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.team_memberships tm
            WHERE tm.team_id = projects.owner_team_id AND tm.user_id = auth.uid()
        )
    );

-- Allows members of a team (or specific roles later) to create projects for that team.
CREATE POLICY "Team members can create projects for their team." ON public.projects
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.team_memberships tm
            WHERE tm.team_id = projects.owner_team_id AND tm.user_id = auth.uid()
            -- You might restrict this further by role later, e.g., AND tm.role IN ('owner', 'admin', 'editor')
        )
    );

-- Allows members (or specific roles) to update projects in their team.
CREATE POLICY "Team members can update projects in their team." ON public.projects
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.team_memberships tm
            WHERE tm.team_id = projects.owner_team_id AND tm.user_id = auth.uid()
            -- You might restrict this further by role later
        )
    )
    WITH CHECK (
         auth.role() = 'authenticated' AND
         EXISTS (
            SELECT 1 FROM public.team_memberships tm
            WHERE tm.team_id = projects.owner_team_id AND tm.user_id = auth.uid()
            -- You might restrict this further by role later
        )
    );

-- Allows owners (or admins) to delete projects in their team.
CREATE POLICY "Team owners can delete projects in their team." ON public.projects
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.team_memberships tm
            WHERE tm.team_id = projects.owner_team_id AND tm.user_id = auth.uid() AND tm.role = 'owner' -- Or IN ('owner', 'admin')
        )
    );


-- 6. Create Trigger Function to add creator as owner on team creation

CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the user who created the team into team_memberships as 'owner'
  INSERT INTO public.team_memberships (team_id, user_id, role)
  VALUES (new.id, new.owner_user_id, 'owner');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set the search_path for the trigger function
-- Adjust 'public' if you use a different schema for teams/team_memberships
ALTER FUNCTION public.handle_new_team() SET search_path = public;


-- 7. Create the Trigger on the teams table
CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();