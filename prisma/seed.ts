import { Prisma, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

import {
  aboutSections,
  contactChannels,
  profileInfo,
  siteConfig,
  techStacks,
  timeline,
} from "../src/data/mock-content";

const prisma = new PrismaClient();

const contentBlocks: Array<{ key: string; data: Prisma.InputJsonValue }> = [
  { key: "site-config", data: siteConfig as unknown as Prisma.InputJsonValue },
  { key: "about-sections", data: aboutSections as unknown as Prisma.InputJsonValue },
  { key: "contact-channels", data: contactChannels as unknown as Prisma.InputJsonValue },
  { key: "profile-info", data: profileInfo as unknown as Prisma.InputJsonValue },
  { key: "tech-stacks", data: techStacks as unknown as Prisma.InputJsonValue },
  { key: "timeline", data: timeline as unknown as Prisma.InputJsonValue },
];

async function main() {
  console.log("Seeding blog skeleton...");

  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contentBlock.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: await hash("admin123456", 12),
      nickname: "Feiyuz",
      email: "hello@feiyuz.dev",
      role: "ADMIN",
    },
  });

  for (const block of contentBlocks) {
    await prisma.contentBlock.create({ data: block });
  }

  console.log("Seed complete:", {
    users: await prisma.user.count(),
    blocks: await prisma.contentBlock.count(),
    posts: await prisma.post.count(),
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
