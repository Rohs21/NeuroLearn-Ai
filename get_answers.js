const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const answers = await prisma.userAnswer.findMany()
  console.log(answers)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
