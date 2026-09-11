import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkOverloaded() {
  const teachers = await prisma.teacher.findMany({
    where: { schoolId: 'cmthn422g0001uff8vhccbxmz' },
  });
  const classes = await prisma.class.findMany({
    where: { schoolId: 'cmthn422g0001uff8vhccbxmz' },
    include: { subjects: true },
  });

  const subjects = await prisma.subject.findMany();
  const subMap = new Map(subjects.map(s => [s.id, s.name]));

  console.log(`Total teachers: ${teachers.length}, Total classes: ${classes.length}`);

  let overCount = 0;
  for (const t of teachers) {
    let teachingHours = 0;
    let homeroomHours = 0;

    classes.forEach((c) => {
      (c.subjects || []).forEach((s) => {
        if (s.teacherId === t.id) {
          teachingHours += s.weeklyHours;
          const name = subMap.get(s.subjectId) || s.subjectId;
          if (name.toLowerCase().includes('tarbiya') || name.toLowerCase().includes('kelajak') || name.toLowerCase().includes('sinf soati')) {
            homeroomHours += s.weeklyHours;
          }
        }
      });
    });

    const isHomeroomTeacher = !!t.homeroomClassId;
    const capacity = Number(t.weeklyHourCapacity) || 20;

    const isSpecial4 = ['AVLIYOQULOV', 'HABIYEVA', 'SAFAROV', 'TO\'LAYEVA'].some(n => t.fullName.toUpperCase().includes(n));
    if (isSpecial4) {
      console.log(`=== SPECIAL 4: ${t.fullName}: Capacity=${capacity}, isHomeroom=${isHomeroomTeacher}, TotalTeachingHours=${teachingHours}, homeroomHours=${homeroomHours} ===`);
    }

    if (t.fullName.includes('BOLTAYEVA') || t.fullName.includes('AMIROVA JAMILA')) {
      console.log(`=== ${t.fullName}: Capacity=${capacity}, isHomeroom=${isHomeroomTeacher}, TotalTeachingHours=${teachingHours}, homeroomHours=${homeroomHours} ===`);
      classes.forEach((c) => {
        (c.subjects || []).forEach((s) => {
          if (s.teacherId === t.id) {
            console.log(`  Class ${c.name}: Subject ${subMap.get(s.subjectId)} (${s.subjectId}), weeklyHours: ${s.weeklyHours}`);
          }
        });
      });
    }

    if (teachingHours > capacity) {
      overCount++;
      console.log(`Overloaded: ${t.fullName} -> TeachingHours: ${teachingHours}, Capacity: ${capacity}, Homeroom: ${t.homeroomClassId}`);
    }
  }

  console.log(`Total overloaded teachers: ${overCount}`);
}

checkOverloaded().finally(() => prisma.$disconnect());
