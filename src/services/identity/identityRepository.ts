/**
 * Enterprise Identity Repository
 * Data access abstraction for EnterpriseIdentity records.
 */

import { BaseRepository } from '../../repositories/baseRepository';
import { EnterpriseIdentity } from './identityTypes';
import { where } from 'firebase/firestore';

export class IdentityRepository extends BaseRepository<EnterpriseIdentity & { id: string }> {
  constructor() {
    super('identities');
  }

  public async getIdentityByUid(uid: string): Promise<EnterpriseIdentity | null> {
    // 1. Try direct fetch by piUid first (if uid is already a piUid)
    let doc = await this.getById(uid);
    if (doc) return doc;

    // 2. Otherwise query where uid == uid (legacy support)
    const results = await this.findWhere(where('uid', '==', uid));
    return results.length > 0 ? results[0] : null;
  }

  public async getIdentityByPiUid(piUid: string): Promise<EnterpriseIdentity | null> {
    if (!piUid) return null;
    // O(1) direct document fetch by canonical piUid ID!
    const doc = await this.getById(piUid);
    if (doc) return doc;

    const results = await this.findWhere(where('piUid', '==', piUid));
    return results.length > 0 ? results[0] : null;
  }

  public async getIdentityByUsername(username: string): Promise<EnterpriseIdentity | null> {
    if (!username) return null;
    const results = await this.findWhere(where('username', '==', username));
    return results.length > 0 ? results[0] : null;
  }

  public async saveIdentity(identity: EnterpriseIdentity): Promise<void> {
    await this.save({
      ...identity,
      id: identity.piUid || identity.uid
    });
  }
}

export const identityRepository = new IdentityRepository();
