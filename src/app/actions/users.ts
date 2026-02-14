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
        return { success: false, error: "Non authentifié" };
    }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    if (currentProfile?.role !== 'admin') {
        return { success: false, error: "Action non autorisée (Admin requis)" };
    }

    try {
        // 2. Update Public Profile (profiles table)
        const profileUpdates: any = {};
        if (data.fullName !== undefined) profileUpdates.full_name = data.fullName;
        if (data.role !== undefined) profileUpdates.role = data.role;
        if (data.active !== undefined) profileUpdates.active = data.active;
        if (data.phone !== undefined) profileUpdates.phone = data.phone;

        if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update(profileUpdates)
                .eq('id', userId);

            if (profileError) throw profileError;
        }

        // 3. Update Auth Data (auth.users table via Admin API)
        // Since we are using the standard client here, we might be limited.
        // If Supabase Service Role Key is not used, we can only update metadata or password if it's the own user.
        // However, standard client doesn't allow updating other users' passwords easily without Service Role.
        // For this demo context, we used `supabase.auth.admin.updateUserById` pattern usually, 
        // but that requires SERVICE_ROLE_KEY which is not exposed safely to client.
        // 
        // IMPORTANT: In a real app, you would initialize a `supabaseAdmin` client here using `process.env.SUPABASE_SERVICE_ROLE_KEY`.
        // Since we assume this runs server-side, we can technically access env vars.

        if (data.password) {
            // Create Admin Client for Auth Updates
            // We need to import createClient from '@supabase/supabase-js' manually for admin access if needed,
            // or check if our current setup supports it. 
            // For now, let's assume standard update might fail for others.
            // We will implement a workaround or simplified version.

            // Check if we have service role key available
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (serviceRoleKey) {
                const { createClient: createAdminClient } = require('@supabase/supabase-js');
                const supabaseAdmin = createAdminClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceRoleKey,
                    {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false
                        }
                    }
                );

                const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
                    userId,
                    { password: data.password }
                );

                if (passwordError) throw passwordError;
            } else {
                console.warn("Supabase Service Role Key missing. Cannot update password for other users.");
                return { success: false, error: "Impossible de modifier le mot de passe (Clé secrète manquante sur le serveur)" };
            }
        }

        revalidatePath('/utilisateurs');
        return { success: true };
    } catch (error: any) {
        console.error("Update User Error:", error);
        return { success: false, error: error.message || "Erreur lors de la mise à jour" };
    }
}
