const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const collisions = [
    { name: 'Toshboyev Qahramon (Dushanba 5-para)', ids: ['cmtqvku56023oic04pre6k20p', 'cmtqvku5f02ijic049yotmdp8'] },
    { name: 'Sagirayev Rustam (Seshanba 5-para)', ids: ['cmtqvku5b02c6ic0427zwxei4', 'cmtqvku5c02dxic04p3glkhew'] },
    { name: 'Mamayusupova Dilfuza (Dushanba 2-para)', ids: ['cmtqvku5f02ific04ll8a74wn', 'cmtqvku5k02r2ic04asakv9hi'] },
    { name: 'Toshboyev Oybek (Shanba 6-para)', ids: ['cmtqvku5f02jgic04m5e3gbvb', 'cmtqvku5h02mhic04b7wzgpb2'] },
    { name: 'Toshboyev Qahramon (Dushanba 2-para)', ids: ['cmtqvku5h02lhic04k91dp5da', 'cmtqvku5i02odic04wd3rkly5'] },
    { name: 'Toshboyev Qahramon (Seshanba 2-para)', ids: ['cmtqvku5h02lpic042jzqujg1', 'cmtqvku5j02ojic04s6nz8djq'] },
    { name: 'Boboyev Abdumalik (Shanba 2-para)', ids: ['cmtqvku5k02q1ic04wiihnrte', 'cmtqvku5l02rric0432v5se4b'] }
  ];

  for (const c of collisions) {
    console.log(`\n=== ${c.name} ===`);
    for (const id of c.ids) {
      const l = await prisma.lesson.findUnique({
        where: { id },
        include: { class: { include: { shift: true } }, subject: true, teacher: true }
      });
      console.log(`- [${l.id}] ${l.class.name} (${l.class.shift?.name || 'no shift'}), Fan: ${l.subject.name}, Guruh: ${l.groupType}, Day: ${l.dayOfWeek}, Period: ${l.periodNumber}, Teacher: ${l.teacher.fullName}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
