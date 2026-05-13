import { createUser } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

const SEED_USERS = [
  { email: 'admin@khzs.nl', password: 'admin123', role: 'admin' as const },
  { email: 'editor@khzs.nl', password: 'editor123', role: 'editor' as const },
];

try {
  for (const user of SEED_USERS) {
    const hashedPassword = hashPassword(user.password);
    const created = createUser(user.email, hashedPassword, user.role);
    console.log(`✓ Aangemaakt: ${created.email} (${created.role})`);
  }
  console.log('\n✓ Database seed voltooid!');
} catch (error: any) {
  if (error.message?.includes('UNIQUE constraint failed')) {
    console.log('ℹ Users bestaan al');
  } else {
    console.error('Fout:', error);
    process.exit(1);
  }
}
