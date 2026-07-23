import { prismaClient } from "../index";

const DEFAULT_REGION_ID = "region-india-1";

async function main() {
    await prismaClient.region.upsert({
        where: { id: DEFAULT_REGION_ID },
        update: {},
        create: {
            id: DEFAULT_REGION_ID,
            name: "india"
        }
    });
}

main().finally(() => prismaClient.$disconnect());
