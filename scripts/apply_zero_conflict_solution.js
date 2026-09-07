const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';
  const schoolId = 'cmthn422g0001uff8vhccbxmz';

  console.log('=== 1. FAOL JADVAL MA\'LUMOTLARINI YUKLASH ===');
  const [lessons, classes, subjects, teachers] = await Promise.all([
    prisma.lesson.findMany({ where: { scheduleId }, include: { class: true, subject: true, teacher: true } }),
    prisma.class.findMany({ where: { schoolId } }),
    prisma.subject.findMany({ where: { schoolId } }),
    prisma.teacher.findMany({ where: { schoolId } })
  ]);

  function findLesson(cName, day, p, subSnippet = '') {
    return lessons.find(l => {
      const cls = classes.find(c => c.id === l.classId);
      if (cls?.name !== cName) return false;
      if (day !== null && l.dayOfWeek !== day) return false;
      if (p !== null && l.periodNumber !== p) return false;
      if (subSnippet && !l.subject.name.toLowerCase().includes(subSnippet.toLowerCase())) return false;
      return true;
    });
  }

  const updates = [];

  function stageMove(l, toDay, toP, newTeacherId = null) {
    if (!l) return;
    updates.push({
      id: l.id,
      dayOfWeek: toDay,
      periodNumber: toP,
      teacherId: newTeacherId || l.teacherId,
      desc: `${l.class.name} ${l.subject.name}: D${l.dayOfWeek}P${l.periodNumber} -> D${toDay}P${toP}${newTeacherId ? ' (Yangi ustoz)' : ''}`
    });
  }

  function stageSwap(l1, l2) {
    if (!l1 || !l2) return;
    const d1 = l1.dayOfWeek, p1 = l1.periodNumber;
    const d2 = l2.dayOfWeek, p2 = l2.periodNumber;
    updates.push({
      id: l1.id,
      isSwapFirst: true
    });
    updates.push({
      id: l2.id,
      dayOfWeek: d1,
      periodNumber: p1,
      teacherId: l2.teacherId,
      isSwapSecond: true,
      partnerId: l1.id,
      partnerDay: d2,
      partnerPeriod: p2,
      partnerTeacherId: l1.teacherId,
      desc: `[SWAP] ${l1.class.name} ${l1.subject.name} (D${d1}P${p1}) <-> ${l2.class.name} ${l2.subject.name} (D${d2}P${p2})`
    });
  }

  // --- 1. BOSHLANG'ICH SINFLARDA MATEMATIKA (12 ta sinf) ---
  stageMove(findLesson('1-A', 1, 5, 'Matematika'), 3, 5);
  stageMove(findLesson('1-B', 2, 5, 'Matematika'), 3, 5);
  stageSwap(findLesson('1-D', 2, 5, 'Matematika'), findLesson('1-D', 3, 5, 'Tarbiya'));
  stageSwap(findLesson('2-A', 1, 5, 'Matematika'), findLesson('2-A', 3, 3, "O'qish"));
  stageMove(findLesson('2-B', 1, 4, 'Matematika'), 3, 5);
  stageSwap(findLesson('2-D', 5, 5, 'Matematika'), findLesson('2-D', 3, 2, 'Rus tili'));
  stageSwap(findLesson('3-A', 1, 5, 'Matematika'), findLesson('3-A', 3, 5, 'Texnologiya'));
  stageSwap(findLesson('3-B', 1, 5, 'Matematika'), findLesson('3-B', 3, 5, 'Tarbiya'));
  stageSwap(findLesson('3-D', 2, 5, 'Matematika'), findLesson('3-D', 3, 2, 'Musiqa'));
  stageSwap(findLesson('4-A', 1, 5, 'Matematika'), findLesson('4-A', 3, 5, "Tasviriy"));
  stageMove(findLesson('4-B', 1, 5, 'Matematika'), 3, 5);
  stageSwap(findLesson('4-D', 4, 5, 'Matematika'), findLesson('4-D', 3, 5, 'Tarbiya'));

  // --- 2. YUQORI SINFLARDA MATEMATIKA/ALGEBRA (7 ta sinf) ---
  stageMove(findLesson('5-A', 1, 5, 'Matematika'), 3, 4);
  stageSwap(findLesson('5-B', 2, 5, 'Matematika'), findLesson('5-B', 3, 1, "Tasviriy"));
  stageMove(findLesson('6-A', 2, 6, 'Matematika'), 3, 6);
  stageMove(findLesson('5-D', 1, 6, 'Matematika'), 3, 5);
  stageMove(findLesson('6-D', 2, 5, 'Matematika'), 3, 5);
  stageMove(findLesson('7-A', 5, 6, 'Algebra'), 3, 6);
  stageMove(findLesson('7-B', 6, 5, 'Algebra'), 3, 5);

  // --- 3. BOSHQA DUBLIKATLAR VA TO'QNASHUVLAR ---
  stageMove(findLesson('5-B', 6, 5, 'Tarix'), 5, 6);
  stageMove(findLesson('5-A', 2, 1, 'Texnologiya'), 3, 5);
  stageSwap(findLesson('8-A', 1, 2, 'Fizika'), findLesson('8-A', 6, 3, 'Ona tili'));
  stageMove(findLesson('10-B', 6, 2, 'Geometriya'), 3, 4);
  stageMove(findLesson('9-A', 6, 6, 'Informatika'), 3, 5);
  stageMove(findLesson('1-B', 1, 5, 'Jismoniy'), 4, 4);

  // --- 4. 9-A VA 10-A JISMONIY TARBIYA GURUHLARINI ALASHTIRISH ---
  const pe9a_g1 = lessons.filter(l => l.class.name === '9-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_1');
  const pe9a_g2 = lessons.filter(l => l.class.name === '9-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_2');
  if (pe9a_g1.length >= 2 && pe9a_g2.length >= 2) {
    stageMove(pe9a_g1[0], 3, 6, 't_39_49'); // Qahramon
    stageMove(pe9a_g2[0], 3, 6, 't_39_42'); // Safarov Otabek
    stageMove(pe9a_g1[1], 5, 6, 't_39_49');
    stageMove(pe9a_g2[1], 5, 6, 't_39_42');
  }

  const pe10a_g1 = lessons.filter(l => l.class.name === '10-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_1');
  const pe10a_g2 = lessons.filter(l => l.class.name === '10-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_2');
  if (pe10a_g1.length >= 2 && pe10a_g2.length >= 2) {
    stageMove(pe10a_g1[0], 3, 5, 't_39_49');
    stageMove(pe10a_g2[0], 3, 5, 't_39_42');
    stageMove(pe10a_g1[1], 4, 5, 't_39_49');
    stageMove(pe10a_g2[1], 4, 5, 't_39_42');
  }

  console.log(`\n=== 2. PRISMA BAZASIGA ${updates.length} TA TUZATISHNI YOZISH ===`);
  for (const u of updates) {
    if (u.isSwapFirst) {
      // Step 1: Move to temporary period 99
      await prisma.lesson.update({
        where: { id: u.id },
        data: { periodNumber: 99 }
      });
    } else if (u.isSwapSecond) {
      // Step 2: Move second lesson to final position
      await prisma.lesson.update({
        where: { id: u.id },
        data: {
          dayOfWeek: u.dayOfWeek,
          periodNumber: u.periodNumber,
          teacherId: u.teacherId
        }
      });
      // Step 3: Move first lesson from 99 to its final position
      await prisma.lesson.update({
        where: { id: u.partnerId },
        data: {
          dayOfWeek: u.partnerDay,
          periodNumber: u.partnerPeriod,
          teacherId: u.partnerTeacherId
        }
      });
      console.log(`  -> ${u.desc}`);
    } else {
      console.log(`  -> ${u.desc}`);
      await prisma.lesson.update({
        where: { id: u.id },
        data: {
          dayOfWeek: u.dayOfWeek,
          periodNumber: u.periodNumber,
          teacherId: u.teacherId
        }
      });
    }
  }

  // Also clean ClassSubject for 9-A and 10-A PE to guarantee data integrity
  console.log('\n=== 3. 9-A VA 10-A CLASSSUBJECT TOZALASH ===');
  const peSub = subjects.find(s => s.name.toLowerCase().includes('jismoniy'));
  const c9a = classes.find(c => c.name === '9-A');
  const c10a = classes.find(c => c.name === '10-A');
  
  if (peSub && c9a && c10a) {
    // Delete existing duplicate PE ClassSubjects
    await prisma.classSubject.deleteMany({
      where: {
        classId: { in: [c9a.id, c10a.id] },
        subjectId: peSub.id
      }
    });
    // Create clean canonical: 9-A (G1 Qahramon 2h, G2 Safarov 2h)
    await prisma.classSubject.createMany({
      data: [
        { schoolId, classId: c9a.id, subjectId: peSub.id, teacherId: 't_39_49', weeklyHours: 2, groupType: 'GROUP_1' },
        { schoolId, classId: c9a.id, subjectId: peSub.id, teacherId: 't_39_42', weeklyHours: 2, groupType: 'GROUP_2' },
        { schoolId, classId: c10a.id, subjectId: peSub.id, teacherId: 't_39_49', weeklyHours: 2, groupType: 'GROUP_1' },
        { schoolId, classId: c10a.id, subjectId: peSub.id, teacherId: 't_39_42', weeklyHours: 2, groupType: 'GROUP_2' },
      ]
    });
    console.log('9-A va 10-A Jismoniy tarbiya ClassSubject-lari toza kanonik holatga keltirildi!');
  }

  console.log('\n✅ BARCHA O\'ZGARISHLAR BAZAGA MUVAFFAQIYATLI SAQLANDI!');
  await prisma.$disconnect();
}

main().catch(console.error);
