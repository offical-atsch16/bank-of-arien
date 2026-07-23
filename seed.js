// Script to seed DB with default admin user and initial accounts
// Run locally or call as a server-side script.
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE environment variables.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("Seeding Database...");

  // 1. Create Default Admin User
  const adminUsername = "admin";
  const adminPassword = "BankOfArienAdmin2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const { data: existingAdmin, error: checkError } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('username', adminUsername)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error("Error checking existing admin:", checkError);
  }

  if (!existingAdmin) {
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        username: adminUsername,
        password_hash: passwordHash
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating default admin user:", insertError);
    } else {
      console.log(`Successfully created default admin user: "${adminUsername}" with password "${adminPassword}"`);
    }
  } else {
    console.log(`Admin user "${adminUsername}" already exists.`);
  }

  console.log("Database Seed completed successfully.");
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
