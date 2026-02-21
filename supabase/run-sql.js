const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL found");
    return;
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION public.force_logout_user(target_user_id UUID)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN
          DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
          DELETE FROM auth.sessions WHERE user_id = target_user_id;
      END;
      $$;
    `);
    console.log('Function force_logout_user created successfully!');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
