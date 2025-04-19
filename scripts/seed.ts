const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient();

async function main() {
  try {
    // Check if categories already exist
    const categoryCount = await database.category.count();
    
    if (categoryCount === 0) {
      // Only create categories if none exist
      await database.category.createMany({
        data: [
          { name: "Eco-Tourism" },
          { name: "Cyber Security" },
          { name: "Legal" },
          { name: "Supply Chain Management" },
          { name: "Accounting" },
          { name: "Engineering" },
          { name: "Cinematography" },
        ],
      });
      console.log("Success: Categories have been created");
    } else {
      console.log("Categories already exist, skipping seed operation");
    }
  } catch (error) {
    console.log("Error seeding the database categories", error);
  } finally {
    await database.$disconnect();
  }
}

main();