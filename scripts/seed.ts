const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const database = new PrismaClient();

async function main() {
  try {
    // Get existing categories to avoid duplicates
    const existingCategories = await database.category.findMany();
    const existingCategoryNames = existingCategories.map(category => category.name);
    
    // Categories to add
    const categoriesToAdd = [
      "Eco-Tourism",
      "Cyber Security",
      "Legal",
      "Supply Chain Management",
      "Accounting",
      "Engineering",
      "Cinematography",
      "Data Science",
      "Digital Marketing",
      "Artificial Intelligence"
    ].filter(name => !existingCategoryNames.includes(name));
    
    if (categoriesToAdd.length > 0) {
      // Add new categories that don't already exist
      await database.category.createMany({
        data: categoriesToAdd.map(name => ({ name })),
      });
      console.log(`Success: ${categoriesToAdd.length} new categories have been added`);
    } else {
      console.log("All categories already exist in the database");
    }
    
    // Log total categories after seeding
    const categoryCount = await database.category.count();
    console.log(`Total categories in database: ${categoryCount}`);
    
  } catch (error) {
    console.log("Error seeding the database categories", error);
  } finally {
    await database.$disconnect();
  }
}

main();