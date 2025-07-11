import { BlofinPriceWebSocket } from '../src/exchange/BlofinPriceWebSocket';
import { priceStore } from '../src/exchange/PriceStore';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ws = new BlofinPriceWebSocket(['BTCUSDT', 'SOLUSDT']);
ws.start();

async function writePricesToDb() {
  const prices = priceStore.getAllPrices();
  for (const { symbol, price } of prices) {
    await prisma.price.upsert({
      where: { symbol },
      update: { price },
      create: { symbol, price },
    });
  }
  console.log('Wrote prices to DB:', prices);
}

setInterval(() => {
  writePricesToDb().catch(console.error);
}, 5000); 