import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeAll, afterAll, beforeEach, describe, test } from 'vitest';

let testEnv: RulesTestEnvironment;
const PROJECT_ID = 'ai-studio-pibusinessmarket-77787f2f-7898-4843-8acf-68b0116d2c80';

describe('Firestore Security Rules - 21 Adversarial Scenarios', () => {
  beforeAll(async () => {
    const rulesPath = resolve(__dirname, '../../firestore.rules');
    const rules = readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules, host: '127.0.0.1', port: 8080 },
    });
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.doc('users/super_admin_uid').set({ platformRole: 'superadmin', username: 'akhileshs68' });
      await db.doc('businesses/biz_a').set({ name: 'Business A', ownerUid: 'owner_a_uid', verificationStatus: 'Pending', businessStatus: 'Active' });
      await db.doc('businessMembers/biz_a_owner_a_uid').set({ businessId: 'biz_a', userUid: 'owner_a_uid', role: 'Owner', status: 'active' });
      await db.doc('businessMembers/biz_a_staff_uid').set({ businessId: 'biz_a', userUid: 'staff_uid', role: 'Staff', status: 'active' });
      await db.doc('businessMembers/biz_a_biz_admin_uid').set({ businessId: 'biz_a', userUid: 'biz_admin_uid', role: 'Super Admin', status: 'active' });
      await db.doc('businesses/biz_b').set({ name: 'Business B', ownerUid: 'owner_b_uid', verificationStatus: 'Pending', businessStatus: 'Active' });
      await db.doc('businessMembers/biz_b_owner_b_uid').set({ businessId: 'biz_b', userUid: 'owner_b_uid', role: 'Owner', status: 'active' });
    });
  });

  test('1. Buyer creates Owner membership -> DENIED', async () => {
    const db = testEnv.authenticatedContext('buyer_uid').firestore();
    await assertFails(db.doc('businessMembers/biz_a_buyer_uid').set({ businessId: 'biz_a', userUid: 'buyer_uid', role: 'Owner', status: 'active' }));
  });

  test('2. Seller creates Owner membership in another business -> DENIED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertFails(db.doc('businessMembers/biz_b_owner_a_uid').set({ businessId: 'biz_b', userUid: 'owner_a_uid', role: 'Owner', status: 'active' }));
  });

  test('3. Business Admin creates Owner membership -> DENIED', async () => {
    const db = testEnv.authenticatedContext('biz_admin_uid').firestore();
    await assertFails(db.doc('businessMembers/biz_a_new_owner').set({ businessId: 'biz_a', userUid: 'new_owner', role: 'Owner', status: 'active' }));
  });

  test('4. Business Admin creates normal Staff membership -> ALLOWED', async () => {
    const db = testEnv.authenticatedContext('biz_admin_uid').firestore();
    await assertSucceeds(db.doc('businessMembers/biz_a_new_staff').set({ businessId: 'biz_a', userUid: 'new_staff', role: 'Staff', status: 'active' }));
  });

  test('5. Business Owner creates second Owner -> DENIED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertFails(db.doc('businessMembers/biz_a_second_owner').set({ businessId: 'biz_a', userUid: 'second_owner', role: 'Owner', status: 'active' }));
  });

  test('6. Business Owner changes Staff role to Business Admin -> ALLOWED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertSucceeds(db.doc('businessMembers/biz_a_staff_uid').update({ role: 'Business Admin' }));
  });

  test('7. Business Owner changes Staff permissions -> ALLOWED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertSucceeds(db.doc('businessMembers/biz_a_staff_uid').update({ permissions: ['inv'] }));
  });

  test('8. Business Owner changes Staff status -> ALLOWED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertSucceeds(db.doc('businessMembers/biz_a_staff_uid').update({ status: 'inactive' }));
  });

  test('9. Staff changes own role -> DENIED', async () => {
    const db = testEnv.authenticatedContext('staff_uid').firestore();
    await assertFails(db.doc('businessMembers/biz_a_staff_uid').update({ role: 'Owner' }));
  });

  test('10. Staff changes own permissions -> ALLOWED', async () => {
    const db = testEnv.authenticatedContext('staff_uid').firestore();
    await assertSucceeds(db.doc('businessMembers/biz_a_staff_uid').update({ customNotes: 'hello' }));
  });

  test('11. Staff changes businessId -> DENIED', async () => {
    const db = testEnv.authenticatedContext('staff_uid').firestore();
    await assertFails(db.doc('businessMembers/biz_a_staff_uid').update({ businessId: 'biz_b' }));
  });

  test('12. Staff changes userUid -> DENIED', async () => {
    const db = testEnv.authenticatedContext('staff_uid').firestore();
    await assertFails(db.doc('businessMembers/biz_a_staff_uid').update({ userUid: 'other_uid' }));
  });

  test('13. Business Admin deletes canonical Owner -> DENIED', async () => {
    const db = testEnv.authenticatedContext('biz_admin_uid').firestore();
    await assertFails(db.doc('businessMembers/biz_a_owner_a_uid').delete());
  });

  test('14. Business Owner deletes canonical Owner -> DENIED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertFails(db.doc('businessMembers/biz_a_owner_a_uid').delete());
  });

  test('15. Business Owner changes verificationStatus -> DENIED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertFails(db.doc('businesses/biz_a').update({ verificationStatus: 'Approved' }));
  });

  test('16. Business Owner changes approvalStatus -> DENIED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertFails(db.doc('businesses/biz_a').update({ approvalStatus: 'Approved' }));
  });

  test('17. Business Owner changes businessStatus -> DENIED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertFails(db.doc('businesses/biz_a').update({ businessStatus: 'Suspended' }));
  });

  test('18. Business Owner edits ordinary business fields -> ALLOWED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertSucceeds(db.doc('businesses/biz_a').update({ description: 'Updated description' }));
  });

  test('19. Super Admin manages membership -> ALLOWED', async () => {
    const db = testEnv.authenticatedContext('super_admin_uid').firestore();
    await assertSucceeds(db.doc('businessMembers/biz_a_owner_a_uid').update({ status: 'archived' }));
  });

  test('20. Initial business + Owner membership in SAME transaction -> ALLOWED', async () => {
    const db = testEnv.authenticatedContext('new_creator_uid').firestore();
    const batch = db.batch();
    batch.set(db.doc('businesses/biz_new'), { name: 'New Biz', ownerUid: 'new_creator_uid', verificationStatus: 'Pending' });
    batch.set(db.doc('businessMembers/biz_new_new_creator_uid'), { businessId: 'biz_new', userUid: 'new_creator_uid', role: 'Owner', status: 'active' });
    await assertSucceeds(batch.commit());
  });

  test('21. Cross-business membership injection -> DENIED', async () => {
    const db = testEnv.authenticatedContext('owner_a_uid').firestore();
    await assertFails(db.doc('businessMembers/mismatched_id').set({ businessId: 'biz_a', userUid: 'owner_a_uid', role: 'Staff', status: 'active' }));
  });
});
