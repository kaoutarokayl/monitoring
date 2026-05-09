export interface Campaign {
  campaignId: number;
  name: string;
  packageName: string;
  startDate: Date;
  endDate: Date;
  purgeDate: Date;
  priority: number;
  campaignType: number;         // 0: General, 1: Targeted, 2: External
  campaignStatus: number;       // 0: Enabled, 1: Disabled, 2: Expired, 3: Purged, 4: Cancelled
  campaignInTestmode: boolean;
  downloadId: number;
  campaignData: string;
  dynamicCampaignData: string;
  externalId: string;
  maxShows: number;
  restHours: number;
  interactive: boolean;
  maxShowMeLaterShows: number;
  showMeLaterRestHours: number;
}

export interface CreateCampaignRequest {
  name: string;
  packageName?: string;
  startDate?: Date;
  endDate?: Date;
  purgeDate?: Date;
  priority?: number;
  campaignType?: number;
  campaignStatus?: number;
  campaignInTestmode?: boolean;
  downloadId?: number;
  campaignData?: string;
  dynamicCampaignData?: string;
  externalId?: string;
  maxShows?: number;
  restHours?: number;
  interactive?: boolean;
  maxShowMeLaterShows?: number;
  showMeLaterRestHours?: number;
}

export interface CampaignBusiness {
  campaignId: number;
  businessId: number;
  businessName: string;
}

export interface CampaignGroup {
  campaignId: number;
  groupId: number;
  groupName: string;
  groupIncluded: boolean;
}

export interface CampaignBINRange {
  campaignId: number;
  binMin: number;
  binMax: number;
}

export interface CampaignCard {
  campaignId: number;
  cardHash: string;
  cardData: string;
  priority: number;
  statusCode: number;
  shownCount: number;
  cooldownTimestamp: Date;
  showAgain: boolean;
}

export interface CampaignShownCount {
  campaignId: number;
  businessId: number;
  businessName: string;
  count: number;
}