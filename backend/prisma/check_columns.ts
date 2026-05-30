import { PrismaClient } from '@prisma/client';

const NEON_URL = "postgresql://neondb_owner:npg_7cqFAOLI3wVG@ep-bold-river-aqp8yglh-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require";
const SUPABASE_URL = "postgresql://postgres.rskhycwjcaxmujhqslyq:Helpsinglemoms01@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10";

async function checkDb(name: string, url: string) {
  console.log(`Checking columns for ${name}...`);
  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  });

  try {
    const columns = await prisma.$queryRawUnsafe<{ column_name: string; data_type: string }[]>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users';
    `);
    console.log(`${name} users table columns:`, columns.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  } catch (error) {
    console.error(`Failed to check ${name}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await checkDb('Neon', NEON_URL);
  await checkDb('Supabase', SUPABASE_URL);
}

main();
