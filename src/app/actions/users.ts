'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Updates a user's profile and authentication data.
 * This action is intended for admins to manage other users.
 */
export async function updateUser(userId: string, data: {
    fullName?: string;
    role?: string;
    active?: boolean;
    phone?: string;
    password?: string;
}) {
    const supabase = await createClient();

    // 1. Verify caller is admin (Security Check)
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
        console.error('[updateUser] Auth error:', authError?.message);
        return { success: false, error: "Non authentifié" };
    }

    console.log('[updateUser] Current user ID:', currentUser.id);

    const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    console.log('[updateUser] Profile query result:', { currentProfile, profileError });

    const callerRole = (currentProfile?.role || '').toLowerCase();
    console.log('[updateUser] Caller role (lowercased):', callerRole);

    if (!['admin', 'super_admin', 'gerant', 'administrateur', 'manager'].includes(callerRole)) {
        return { success: false, error: `Action non autorisée (Admin requis). Votre rôle: "${currentProfile?.role || 'inconnu'}"` };
    }

    try {
        // Create Admin Client to bypass RLS (profiles UPDATE policy only allows self-updates)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            console.warn("Supabase Service Role Key missing.");
            return { success: false, error: "Clé secrète du serveur manquante. Contactez l'administrateur système." };
        }

        const { createClient: createSupabaseAdmin } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 2. Update Public Profile (profiles table) — via admin client to bypass RLS
        const profileUpdates: Record<string, unknown> = {};
        if (data.fullName !== undefined) profileUpdates.full_name = data.fullName;
        if (data.role !== undefined) profileUpdates.role = data.role;
        if (data.active !== undefined) profileUpdates.active = data.active;
        if (data.phone !== undefined) profileUpdates.phone = data.phone;

        if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', userId);

            if (profileError) throw profileError;
        }

        // 3. Update password via Admin Auth API (if provided)
        if (data.password) {
            const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: data.password }
            );

            if (passwordError) throw passwordError;
        }

        revalidatePath('/utilisateurs');
        return { success: true };
    } catch (error: any) {
        console.error("Update User Error:", error);
        return { success: false, error: error.message || "Erreur lors de la mise à jour" };
    }
}

/**
 * Deletes a user's profile and auth account permanently.
 * Admin/Super Admin only. Cannot delete own account.
 */
export async function deleteUser(userId: string) {
    const supabase = await createClient();

    // 1. Verify caller is admin
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
        return { success: false, error: "Non authentifié" };
    }

    // Prevent self-deletion
    if (currentUser.id === userId) {
        return { success: false, error: "Impossible de supprimer votre propre compte." };
    }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    const callerRole = (currentProfile?.role || '').toLowerCase();
    if (!['admin', 'super_admin', 'gerant', 'administrateur', 'manager'].includes(callerRole)) {
        return { success: false, error: "Action non autorisée (Admin requis)." };
    }

    try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            return { success: false, error: "Clé secrète du serveur manquante." };
        }

        const { createClient: createSupabaseAdmin } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 2. Delete profile from DB (CASCADE will handle related data)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) throw profileError;

        // 3. Delete from auth.users
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) throw authDeleteError;

        revalidatePath('/utilisateurs');
        return { success: true };
    } catch (error: any) {
        console.error("Delete User Error:", error);
        return { success: false, error: error.message || "Erreur lors de la suppression" };
    }
}

/**
 * Creates a new user using the Supabase Admin API.
 * This prevents the current session from being overwritten.
 */
export async function createUser(data: {
    email: string;
    password?: string;
    fullName: string;
    role: string;
}) {
    const supabase = await createClient();

    // 1. Verify caller is admin
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
        return { success: false, error: "Non authentifié" };
    }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    const callerRole = (currentProfile?.role || '').toLowerCase();
    if (!['admin', 'super_admin', 'gerant', 'administrateur', 'manager'].includes(callerRole)) {
        return { success: false, error: "Action non autorisée (Admin requis)." };
    }

    try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            return { success: false, error: "Clé secrète du serveur manquante." };
        }

        const { createClient: createSupabaseAdmin } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 2. Create User via Admin API
        const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email.toLowerCase().trim(),
            password: data.password || 'password123',
            email_confirm: true,
            user_metadata: {
                full_name: data.fullName,
                role: data.role,
            }
        });

        if (authCreateError) throw authCreateError;

        // Note: The on_auth_user_created trigger will auto-insert into profiles table
        // We do not need to manually insert into the profiles table here

        revalidatePath('/utilisateurs');
        return { success: true, userId: authData?.user?.id };
    } catch (error: any) {
        console.error("Create User Error:", error);
        return { success: false, error: error.message || "Erreur lors de la création de l'utilisateur" };
    }
}

