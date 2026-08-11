import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = 'adlaber@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify caller is the admin
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Fetch all user_data rows
    const { data: userData, error: udError } = await supabase
      .from('user_data')
      .select('user_id, email, full_name, pushka_balance, pushka_goal, streak, total_personal, reminder_enabled, updated_at')
      .order('updated_at', { ascending: false });

    if (udError) throw udError;

    // For rows missing email, fetch from auth.users
    const missingIds = (userData || []).filter(u => !u.email).map(u => u.user_id);

    const authEmails = {};
    if (missingIds.length > 0) {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (!listError && users) {
        users.forEach(u => {
          authEmails[u.id] = { email: u.email, full_name: u.user_metadata?.full_name || null };
        });
      }
    }

    const merged = (userData || []).map(u => ({
      ...u,
      email: u.email || authEmails[u.user_id]?.email || null,
      full_name: u.full_name || authEmails[u.user_id]?.full_name || null,
    }));

    return res.json({ users: merged });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
