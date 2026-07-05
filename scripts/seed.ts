/**
 * Seed helper — run from browser console after admin login:
 *
 * import { httpsCallable } from 'firebase/functions';
 * import { functions } from './src/lib/firebase';
 * import { INIT_KB, INIT_SC, INIT_TQ, INIT_NEWS } from './src/lib/seed-data';
 *
 * const seed = httpsCallable(functions, 'seedDatabase');
 * await seed({ kb: INIT_KB, scripts: INIT_SC, tests: INIT_TQ, news: INIT_NEWS });
 *
 * Admin role:
 * const setAdmin = httpsCallable(functions, 'setAdminRole');
 * await setAdmin({ email: 'admin@daksdrive.uz' });
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "../src/lib/firebase";
import { INIT_KB, INIT_SC, INIT_TQ, INIT_NEWS, SEED_ADMIN, SEED_DEMO_USER } from "../src/lib/seed-data";

export { INIT_KB, INIT_SC, INIT_TQ, INIT_NEWS, SEED_ADMIN, SEED_DEMO_USER };

export async function runSeedDatabase() {
  const seed = httpsCallable(functions, "seedDatabase");
  const result = await seed({
    kb: INIT_KB,
    scripts: INIT_SC,
    tests: INIT_TQ,
    news: INIT_NEWS,
  });
  return result.data;
}

export async function runSetAdminRole(email: string) {
  const setAdmin = httpsCallable(functions, "setAdminRole");
  const result = await setAdmin({ email });
  return result.data;
}
