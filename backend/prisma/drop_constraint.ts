import { PrismaClient } from '@prisma/client';

const SUPABASE_URL = "postgresql://postgres.rskhycwjcaxmujhqslyq:Helpsinglemoms01@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10";

async function main() {
  console.log('Connecting to Supabase to drop foreign key constraint...');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: SUPABASE_URL },
    },
  });

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey CASCADE;
    `);
    console.log('Successfully dropped users_id_fkey constraint from Supabase.');
  } catch (error) {
    console.error('Failed to drop constraint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
