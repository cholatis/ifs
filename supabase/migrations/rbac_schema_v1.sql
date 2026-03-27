-- RBAC System Design for Factoring Pre-Screening Portal
-- Includes Roles, Permissions, and their mappings.

-- 1. Create portal_roles table
CREATE TABLE IF NOT EXISTS public.portal_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create portal_permissions table (Mapped to Menu and Action codes)
CREATE TABLE IF NOT EXISTS public.portal_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'view_request_list'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'Menu', 'Action'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create portal_role_permissions junction table
CREATE TABLE IF NOT EXISTS public.portal_role_permissions (
    role_id UUID REFERENCES public.portal_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.portal_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Update user_account table to link with roles
ALTER TABLE public.user_account 
ADD COLUMN IF NOT EXISTS portal_role_id UUID REFERENCES public.portal_roles(id);

-- 5. Insert Default Roles
INSERT INTO public.portal_roles (name, description) VALUES 
('admin', 'Admin with full access to review and approve all applications'),
('user', 'Standard user who can submit applications and track their own status')
ON CONFLICT (name) DO NOTHING;

-- 6. Insert Default Permissions (Derived from Navigation Menus)
INSERT INTO public.portal_permissions (code, name, category) VALUES
-- Menus
('menu_home', 'Home Menu', 'Menu'),
('menu_second_page', 'Second Page Menu', 'Menu'),
('menu_new_line', 'New Line Application Menu', 'Menu'),
('menu_new_factoring', 'New Factoring Request Menu', 'Menu'),
('menu_request_list', 'Request List Menu', 'Menu'),
-- Administrative Actions
('action_approve_credit_line', 'Approve/Reject Credit Line', 'Action'),
('action_approve_factoring_req', 'Approve/Reject Factoring Request', 'Action'),
('action_request_docs', 'Request Additional Documents', 'Action')
ON CONFLICT (code) DO NOTHING;

-- 7. Assign All Permissions to Admin Role
INSERT INTO public.portal_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.portal_roles r, public.portal_permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- 8. Assign Limited Permissions to Standard User Role
-- (Users can see submission menus but not approval actions)
INSERT INTO public.portal_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.portal_roles r, public.portal_permissions p
WHERE r.name = 'user' AND p.code IN (
    'menu_home', 
    'menu_new_line', 
    'menu_new_factoring', 
    'menu_request_list'
)
ON CONFLICT DO NOTHING;

-- 9. (Optional) Auto-assign existing users to 'user' role if not set
UPDATE public.user_account
SET portal_role_id = (SELECT id FROM public.portal_roles WHERE name = 'user')
WHERE portal_role_id IS NULL AND role = 'user';

-- 10. (Optional) Auto-assign existing 'admin' role users
UPDATE public.user_account
SET portal_role_id = (SELECT id FROM public.portal_roles WHERE name = 'admin')
WHERE portal_role_id IS NULL AND role = 'admin';
