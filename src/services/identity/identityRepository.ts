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
    const doc = await this.getById(uid);
    return doc;
  }

  public async getIdentityByPiUid(piUid: string): Promise<EnterpriseIdentity | null> {
    if (!piUid) return null;
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
      id: identity.uid
    });
  }
}

export const identityRepository = new IdentityRepository();
