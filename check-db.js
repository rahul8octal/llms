
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const files = await prisma.llmFile.findMany();
    console.log("LLM FILES:", JSON.stringify(files, null, 2));
    
    const settings = await prisma.llmSetting.findMany();
    console.log("LLM SETTINGS:", JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error(e);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
