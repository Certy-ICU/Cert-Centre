const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient();

async function main() {
  try {
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

    console.log("Success");
  } catch (error) {
    console.log("Error seeding the database categories", error);
  } finally {
    await database.$disconnect();
  }
}

main();