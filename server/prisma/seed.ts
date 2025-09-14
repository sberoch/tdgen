// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// const getRandomSentence = (minWords: number, maxWords: number) => {
//   const words = [
//     'Sonne',
//     'Mond',
//     'Sterne',
//     'Fluss',
//     'Berge',
//     'Tal',
//     'Wald',
//     'Haus',
//     'Tür',
//     'Fenster',
//     'Buch',
//     'Papier',
//     'Feder',
//     'Tinte',
//     'Baum',
//     'Straße',
//     'Auto',
//     'Reise',
//     'Zug',
//     'Flugzeug',
//     'Himmel',
//     'Meer',
//     'Welle',
//     'Musik',
//     'Lied',
//     'Tanz',
//     'Glück',
//     'Freude',
//     'Schmerz',
//     'Herz',
//     'Liebe',
//     'Freund',
//     'Garten',
//     'Blume',
//     'Dorf',
//     'Stadt',
//     'Licht',
//     'Schatten',
//     'Wind',
//     'Regen',
//   ];
//   const wordCount =
//     Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
//   let sentence = '';
//   for (let i = 0; i < wordCount; i++) {
//     sentence += words[Math.floor(Math.random() * words.length)] + ' ';
//   }
//   return sentence.trim() + '.';
// };

async function main() {
  // const jobTasks = await prisma.jobTask.findMany();
  // if (jobTasks.length === 0) {
  //   await prisma.jobTask.createMany({
  //     data: Array.from({ length: 100 }, () => ({
  //       title: getRandomSentence(3, 10).slice(0, 100),
  //       text: getRandomSentence(50, 150).slice(0, 2000),
  //       metadata: {
  //         paymentGroup: `EG ${Math.floor(Math.random() * 15) + 1}`,
  //       },
  //       createdById: '4016651',
  //     })),
  //   });
  //   console.log('Created job tasks.');
  // }
}

main()
  .then(() => {
    console.log('Seed completed.');
  })
  .catch((e) => {
    console.error(e);
  });
// .catch((e) => {
//   console.error(e);
// })
// .finally(() => {
//   void prisma.$disconnect();
// });
