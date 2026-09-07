const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. Toshboyev Qahramon (Dushanba 5-para: 1-B & 8-A)
  // 1-B Jismoniy tarbiya (cmtqvku56023oic04pre6k20p) vs 8-A Jismoniy tarbiya (cmtqvku5f02ijic049yotmdp8)
  console.log('--- Checking Toshboyev Qahramon available slots ---');
  const tqLessons = await prisma.lesson.findMany({
    where: { scheduleId, teacherId: 't_39_23' }, // let's find his ID
    include: { class: true }
  });
  console.log('Toshboyev Qahramon total lessons:', tqLessons.length);

  // Let's find all teachers involved in the 7 collisions
  const collisionLessonIds = [
    'cmtqvku56023oic04pre6k20p', 'cmtqvku5f02ijic049yotmdp8',
    'cmtqvku5b02c6ic0427zwxei4', 'cmtqvku5c02dxic04p3glkhew',
    'cmtqvku5f02ific04ll8a74wn', 'cmtqvku5k02r2ic04asakv9hi',
    'cmtqvku5f02jgic04m5e3gbvb', 'cmtqvku5h02mhic04b7wzgpb2',
    'cmtqvku5h02lhic04k91dp5da', 'cmtqvku5i02odic04wd3rkly5',
    'cmtqvku5h02lpic042jzqujg1', 'cmtqvku5j02ojic04s6nz8djq',
    'cmtqvku5k02q1ic04wiihnrte', 'cmtqvku5l02rric0432v5se4b'
  ];

  const clLessons = await prisma.lesson.findMany({
    where: { id: { in: collisionLessonIds } },
    include: { class: { include: { shift: true } }, subject: true, teacher: true }
  });

  for (const l of clLessons) {
    console.log(`[${l.id}] ${l.teacher.fullName} | ${l.class.name} (${l.class.shift?.name}) | ${l.subject.name} (${l.groupType}) | Day ${l.dayOfWeek} P${l.periodNumber}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
