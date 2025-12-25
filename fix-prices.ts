import { db } from './src/db';
import { services, courses } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function fixPrices() {
  console.log('Fixing service prices...');
  await db.update(services).set({ price: 1500 }).where(sql`price IS NULL OR price = 0`);
  
  console.log('Fixing course prices...');
  await db.update(courses).set({ price: 2500 }).where(sql`price IS NULL OR price = 0`);
  
  console.log('Done!');
  process.exit(0);
}

fixPrices().catch(err => {
  console.error(err);
  process.exit(1);
});
