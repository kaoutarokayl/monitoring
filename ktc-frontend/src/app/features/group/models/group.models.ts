import { ClientAtm } from '../../atm/models/atm.models';
export type { ClientAtm } from '../../atm/services/atm.service';

// -- Models pour les groupes ------------------------------------------

export interface Group {
  groupId: number;
  groupName: string;
  groupTypeId?: number;
  groupQuery?: string;
  groupDescription?: string;
  includeMothballed?: boolean;
  evaluationInterval?: number;
  lastChangedTimestamp?: Date;
}

export interface GroupDetails extends Group {
  clients?: ClientAtm[];
}

export interface ClientGroup {
  groupId: number;
  clientId: number;
}

export interface CreateGroupRequest {
  groupName: string;
  groupTypeId?: number;
  groupQuery?: string;
  groupDescription?: string;
  includeMothballed?: boolean;
  evaluationInterval?: number;
}

export interface UpdateGroupRequest extends CreateGroupRequest {
  groupId: number;
}

