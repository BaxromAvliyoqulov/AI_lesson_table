const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backups/code_8_school_39_backup.json', 'utf8'));

const iqbol = data.teachers.find(t => t.fullName && t.fullName.includes('IQBOL'));
const lessons = data.lessons.filter(l => l.teacherId === iqbol.id);

console.log(`=== IQBOL BACKUP LESSONS (${lessons.length} ta) ===`);
const days = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

for (let d = 1; d <= 6; d++) {
  const dl = lessons.filter(l => l.dayOfWeek === d);
  console.log(`\n${days[d]} (${dl.length} ta dars):`);
  dl.sort((a, b) => a.periodNumber - b.periodNumber);
  for (const l of dl) {
    const cls = data.classes.find(c => c.id === l.classId);
    console.log(`  P${l.periodNumber}: ${cls?.name} [${l.groupType}]`);
  }
}
