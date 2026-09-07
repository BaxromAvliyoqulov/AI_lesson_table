const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  const teachers = await prisma.teacher.findMany({
    where: {
      schoolId,
      fullName: { in: [
        "JO'RAYEVA IQBOL PARDABOY QIZI",
        "QURBONALIYEVA NIGORA ABDUJALILOVNA",
        "TO'LAYEVA O'G'ILSHOD ASADULLAYEVNA",
        "XOLMIRZAYEV MUXRIDDIN"
      ] }
    }
  });

  console.log('=== BOSHLANG\'ICH INGLIZ TILI O\'QITUVCHILARI ===');
  for (const t of teachers) {
    const cs = await prisma.classSubject.findMany({
      where: { schoolId, teacherId: t.id },
      include: { class: true, subject: true }
    });
    const lessons = await prisma.lesson.findMany({
      where: { schoolId, scheduleId: activeSchedId, teacherId: t.id }
    });
    console.log(`\nO'qituvchi: ${t.fullName} (capacity: ${t.weeklyHourCapacity} soat)`);
    console.log(`  ClassSubjects (${cs.length} ta): ${cs.map(c => `${c.class.name} [${c.groupType}]`).join(', ')}`);
    console.log(`  Jadvaldagi darslar soni: ${lessons.length} ta`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
