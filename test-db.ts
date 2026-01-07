
import { db } from "./src/db";
import { orders } from "./src/db/schema";

async function main() {
  const allOrders = await db.select().from(orders).limit(5);
  console.log(JSON.stringify(allOrders, null, 2));
}

main().catch(console.error);
