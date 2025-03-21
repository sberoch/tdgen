import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getRandomSentence = (minWords: number, maxWords: number) => {
  const words = [
    'Sonne',
    'Mond',
    'Sterne',
    'Fluss',
    'Berge',
    'Tal',
    'Wald',
    'Haus',
    'Tür',
    'Fenster',
    'Buch',
    'Papier',
    'Feder',
    'Tinte',
    'Baum',
    'Straße',
    'Auto',
    'Reise',
    'Zug',
    'Flugzeug',
    'Himmel',
    'Meer',
    'Welle',
    'Musik',
    'Lied',
    'Tanz',
    'Glück',
    'Freude',
    'Schmerz',
    'Herz',
    'Liebe',
    'Freund',
    'Garten',
    'Blume',
    'Dorf',
    'Stadt',
    'Licht',
    'Schatten',
    'Wind',
    'Regen',
  ];
  const wordCount =
    Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  let sentence = '';
  for (let i = 0; i < wordCount; i++) {
    sentence += words[Math.floor(Math.random() * words.length)] + ' ';
  }
  return sentence.trim() + '.';
};

async function main() {
  await prisma.permission.createMany({
    data: [
      { name: 'CREATE' },
      { name: 'READ' },
      { name: 'UPDATE' },
      { name: 'DELETE' },
    ],
  });
  const permissions = await prisma.permission.findMany();
  console.log('Created permissions.');

  const user = await prisma.user.create({
    data: {
      userId: '4016651',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      permissions: {
        connect: permissions.map((permission) => ({ id: permission.id })),
      },
    },
  });
  console.log('Created admin user.');

  await prisma.jobTask.createMany({
    data: Array.from({ length: 100 }, () => ({
      title: getRandomSentence(3, 10).slice(0, 100),
      text: getRandomSentence(50, 150).slice(0, 2000),
      metadata: {},
      createdById: user.id,
    })),
  });
  console.log('Created job tasks.');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
