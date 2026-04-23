
import prisma from "./app/db.server.js";
console.log("Prisma models:", Object.keys(prisma).filter(k => !k.startsWith("_")));
process.exit(0);
