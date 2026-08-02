/**
 * Enterprise Identity Repository
 * Data access abstraction for EnterpriseIdentity records.
 */

import { BaseRepository } from '../../repositories/baseRepository';
import { EnterpriseIdentity } from './identityTypes';

export class IdentityRepository extends BaseRepository<EnterpriseIdentity & { id: string }> {
  constructor() {
    super('identities');
  }

  public async getIdentityByUid(uid: string): Promise<EnterpriseIdentity | null> {
    const doc = await this.getById(uid);
    return doc;
  }

  public async saveIdentity(identity: EnterpriseIdentity): Promise<void> {
    await this.save({
      ...identity,
      id: identity.uid
    });
  }
}

export const identityRepository = new IdentityRepository();
