(async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const db = new PGlite();
  try {
    await db.exec(fs.readFileSync('supabase/tests/suporte.sql', 'utf8'));
    for (const file of fs.readdirSync('supabase/migrations').sort()) {
      await db.exec(fs.readFileSync(path.join('supabase/migrations', file), 'utf8'));
    }
    for (const file of fs.readdirSync('supabase/tests').filter(f => f.endsWith('.sql') && f !== 'suporte.sql').sort()) {
      await db.exec(fs.readFileSync(path.join('supabase/tests', file), 'utf8'));
      console.log('PASS SQL:', file);
    }
  } finally { await db.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
