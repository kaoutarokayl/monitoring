export interface ClientAtm {
  clientId: number;
  ktcGuid: string;
  clientName: string;
  networkAddress: string;
  connectable: number;          // 1=Non connectable | 2=IP Statique | 3=IP Dynamique
  detailsUnknown: boolean;
  latitude: number;
  longitude: number;
  timezone: string;
  comments?: string;
  businessId: number;
  branchId: number;
  hardwareTypeId: number;
  hardwareTypeName?: string;
  active: boolean;
  clientType: number;
}

export interface BusinessDto {
  businessId: number;
  businessName: string;
  displayId: string;
}

export interface BusinessDetailsDto extends BusinessDto {
  additionalInfo?: string;
}

export interface BranchDto {
  branchId: number;
  branchName: string;
  displayId: string;
  additionalInfo?: string;
  businessId: number;
  level1RegionId: number;
  level2RegionId: number;
  level3RegionId: number;
  level4RegionId: number;
  level5RegionId: number;
}

export interface RegionDto {
  regionId: number;
  regionName: string;
  displayId: string;
}

export interface RegionDetailsDto extends RegionDto {
  businessId: number;
  regionLevel: number;
  parentRegionId: number;
  additionalInfo?: string;
}

export interface HardwareTypeDto {
  hardwareTypeId: number;
  name: string;
  description: string;
  typeGroup: string;
  canBeConfigured: boolean;
  canBeMonitored: boolean;
}
export interface RegionListDto {
  regionId: number;
  regionName: string;
  displayId: string;
  regionLevel: number;
  parentRegionId: number;
  businessName: string;
}

export interface CreateOrUpdateAtmRequest {
  clientName: string;
  networkAddress: string;
  connectable: number;
  detailsUnknown: boolean;
  latitude: number;
  longitude: number;
  timezone: string;
  comments?: string;
  clientType: number;
  gridPosition: number;
  businessId: number;
  branchId: number;
  hardwareTypeId: number;
  ownerId: number;
  deleteLater: boolean;
  active: boolean;
  subnet: string;
  level1RegionId: number;
  level2RegionId: number;
  level3RegionId: number;
  level4RegionId: number;
  level5RegionId: number;
  salt: string;
  authHash: string;
  hypervisorActive: boolean;
  mergeToClientId: number;
  featureFlags: string;
}

export interface CreateBranchRequest {
  branchName: string;
  displayId?: string;
  businessId: number;
  level1RegionId: number;
  level2RegionId: number;
  level3RegionId: number;
  level4RegionId: number;
  level5RegionId: number;
  additionalInfo?: string;
}

export interface CreateBusinessRequest {
  businessName: string;
  displayId?: string;
  additionalInfo?: string;
}

export interface CreateRegionRequest {
  regionName: string;
  displayId?: string;
  businessId: number;
  regionLevel: number;
  parentRegionId: number;
  additionalInfo?: string;
}

export interface AtmComponentStatusDto {
  componentId: number;
  componentName: string;
  propertyCategory: string;
  propertyName: string;
  value: string;
  severity: string;
}

export interface AtmAssetHistoryDto {
  user: string;
  timestamp: string;
  componentName: string;
  propertyName: string;
  oldValue: string;
  newValue: string;
  comment: string;
}

export interface LastClientContactDto {
  clientId: number;
  timestmp?: string | null;           // ISO datetime
  timeoffset: number;
  lastMsgId: number;
  lastMsgReply?: string | null;
  nextMessageExpected?: string | null; // ISO datetime
  msgRejectedInfo?: string | null;
  msgQueueSize: number;
  msgCreatedTs?: string | null;        // ISO datetime
  replayFlag: boolean;
  mutualAuth: boolean;
}

export interface AtmSoftwareInfoDto {
  swId: number;
  softwareName: string;
  version: string;
  installType: number;
  installTypeLabel: string;
  installDate: string;
  complianceRulesCount: number;
}

export interface AtmCertificateDto {
  certificateStore: string;
  subjectName: string;
  issuer: string;
  friendlyName: string;
  notBefore: string;
  notAfter: string;
  isPrivate: boolean;
  firstSeen: string;
  serialNumber: string;
}

export interface AtmTicketDto {
  ticketId: number;
  ticketType: string;
  clientName: string;
  created: string;
  isClosed: boolean;
  duration: string;
  status: string;
  errorId: number;
  code: string;
  errorText: string;
  owner: string;
  lastChangeBy: string;
  lastChangeDate: string;
  lastComment: string;
  slaSummary: string;
  dispatchedTo: string;
}

export interface AppCounterDto {
  componentId: number;
  propertyId: number;
  propertyName: string;
  currencyCode: string;
  denominationId?: number | null;
  denominationValue?: number | null;
  counterValue: number;
  timestmp: string;
  lastResetTimestmp?: string | null;
}

export interface ReplenishmentDto {
  replenishmentId: number;
  componentId: number;
  timestmp: string;
  transactionId?: number | null;
  propertyId: number;
  propertyName: string;
  denominationId: number;
  denominationValue?: number | null;
  beforeCount: number;
  afterCount: number;
}

export interface XfsCounterDto {
  viewType: string;
  componentId: number;
  number: string;
  typeId: number;
  currencyCode: string;
  denominationId?: number | null;
  denominationValue?: number | null;
  currencyValue?: number | null;
  unitCount?: number | null;
  totalValue?: number | null;
  count?: number | null;
  statusId: number;
  timestmp: string;
}

export interface XfsCountersResponseDto {
  logicalView: XfsCounterDto[];
  physicalView: XfsCounterDto[];
}

export interface AtmActionDto {
  actionId: number;
  user: string;
  command: string;
  status: string;
  /** dbo.Actions.addedtime (UTC) — toujours renseigné pour une nouvelle action en file */
  addedTime?: string | null;
  started?: string | null;
  finished?: string | null;
  lastComment: string;
}

export interface AtmScheduleDto {
  scheduleId: number;
  scheduleName: string;
  frequency: string;
  nextDue: string;
  groupId: number;
  groupName: string;
  commandId: number;
  commandName: string;
  comments: string;
  lastActioned?: string | null;
  businessId: number;
  businessName: string;
  performActionEveryTime: boolean;
}

export interface CreateScheduleRequest {
  scheduleName: string;
  frequency: string;
  nextDue: string;
  groupId: number;
  commandId: number;
  comments?: string;
  businessId: number;
  performActionEveryTime: boolean;
}

/** Réponse API GET clients/{id}/actions : historique dbo.Actions + utilisateurs pour filtre */
export interface AtmActionsResponseDto {
  items: AtmActionDto[];
  addedByUsers: string[];
}

export interface AtmUploadDto {
  actionId: number;
  fileLocation: string;
  fileName?: string;
  fileType: number;
  fileTypeLabel?: string;
  commandName?: string;
  scheduleName?: string;
  status?: string;
  addedTime?: string | null;
  comments?: string | null;
}

/** Ligne dbo.CommandTypes — libellés dynamiques (Refresh, Reboot, … selon la base). */
export interface RemoteCommandTypeDto {
  commandId: number;
  commandName: string;
  description: string;
}

/** Paramètres spécifiques pour Upload Trace */
export interface UploadTraceParams {
  traceType?: string;  // ex: 'Active Trace'
  timeFilterType?: 'last30min' | 'last1hour' | 'custom';
  customFilterValue?: string;
}

/** Paramètres spécifiques pour Upload Trace Backup */
export interface UploadTraceBackupParams {
  startDate?: string;  // ISO format
  endDate?: string;    // ISO format
}

/** Paramètres spécifiques pour Upload Event Log */
export interface UploadEventLogParams {
  logType?: 'Application' | 'System' | 'Other' | 'CustomFilter';
  customFilter?: string;
}

/** Paramètres spécifiques pour Upload Registry */
export interface UploadRegistryParams {
  registryKeyName?: string;
}

/** Paramètres spécifiques pour Upload File (fichier simple) */
export interface UploadFileParams {
  fileName?: string;
  fileSize?: number;
}

/** Paramètres d'upload — chaque type peut être null si pas de paramètres */
export interface UploadCommandParams {
  file?: UploadFileParams;
  trace?: UploadTraceParams;
  traceBackup?: UploadTraceBackupParams;
  eventLog?: UploadEventLogParams;
  registry?: UploadRegistryParams;
}

export interface DispatchRemoteActionsRequest {
  commandId: number;
  clientIds: number[];
  initiatedBy?: string;
  uploadParams?: UploadCommandParams;
}

export interface DispatchRemoteActionsResponse {
  created: number;
  skippedClientIds: string[];
}

export interface ElectronicJournalEntryDto {
  transactionId: number;
  timestamp: string;
  type: string;
  amount?: number | null;
  effectiveAmount?: number | null;
  ejStartId?: number | null;
  ejEndId?: number | null;
}

export interface LookupItemDto {
  id: number;
  code: string;
}

export interface TransactionAuditDto {
  sessionId: number;
  transactionId: number;
  transactionGuid: string;
  timestamp: string;
  type: string;
  amount: number;
  completion: string;
  reason: string;
  hasEj: boolean;
}

export interface TransactionSearchCriteria {
  from?: string | null;
  to?: string | null;
  amount?: number | null;
  typeLookupId?: number | null;
  reasonLookupId?: number | null;
  completionLookupId?: number | null;
  sessionId?: number | null;
  transactionId?: number | null;
  transactionGuid?: string | null;
}

export interface VideoJournalEventDto {
  transactionInformation: string;
  transactionId?: number | null;
  sessionId?: number | null;
  transactionGuid?: string | null;
  timestamp: string;
  type: string;
  completion: string;
  cameraPosition: string;
  position: string;
  suspect: boolean;
  amount?: number | null;
  mediaId: number;
  mediaFileName: string;
  mediaUrl: string;
  mediaKind: string;
}

export interface ServiceStateMetricDto {
  state: string;
  seconds: number;
  duration: string;
  percent: number;
}

export interface UnavailableReasonMetricDto {
  reasonId: number;
  reason: string;
  seconds: number;
  duration: string;
  percent: number;
}

export interface ErrorCodeMetricDto {
  errorCodeTypeId: number;
  code: string;
  reason: string;
  seconds: number;
  duration: string;
  percent: number;
}

export interface AtmAvailabilityReportDto {
  from: string;
  to: string;
  totalSeconds: number;
  totalDuration: string;
  serviceStates: ServiceStateMetricDto[];
  uptimeSeconds: number;
  uptimeDuration: string;
  uptimePercent: number;
  downtimeSeconds: number;
  downtimeDuration: string;
  downtimePercent: number;
  topUnavailableReasons: UnavailableReasonMetricDto[];
  topErrorCodes: ErrorCodeMetricDto[];
  coveringText: string;
}

export interface CashUnitStatusDto {
  cashUnitId: number;
  typeName: string;
  statusName: string;
  timestamp: string;
  currencyCode: string;
  currencyValue: number;
  unitCount: number;
  totalValue: number;
}

export interface CashUnitSummaryDto {
  componentId: number;
  componentName: string;
  cashUnits: CashUnitStatusDto[];
  totalCashValue: number;
}

export interface CassetteDenominationCountDto {
  currencyCode: string;
  denomination: number;
  count: number;
  totalValue: number;
}

export interface PhysicalCassetteDto {
  cassetteId: number;
  componentId: number;
  position: string;
  typeName: string;
  currentStatus: string;
  lastStatusUpdate: string;
  isReported: boolean;
  denominations: CassetteDenominationCountDto[];
}

export interface CassetteSummaryDto {
  componentId: number;
  componentName: string;
  cassettes: PhysicalCassetteDto[];
  totalCassettes: number;
  healthyCassettes: number;
  lowCassettes: number;
  emptyCassettes: number;
}

export interface AtmCashCassetteOverviewDto {
  clientId: number;
  clientName: string;
  cashUnitsByComponent: CashUnitSummaryDto[];
  cassettesByComponent: CassetteSummaryDto[];
  totalCashValue: number;
  lastUpdated: string;
}

export interface CashHistoryEntryDto {
  timestamp: string;
  previousTotal: number;
  currentTotal: number;
  change: number;
  previousUnitCount: number;
  currentUnitCount: number;
}

export interface CashFlowReportDto {
  clientId: number;
  componentId: number;
  componentName: string;
  currencyCode: string;
  currentTotal: number;
  lastUpdate?: string | null;
  historicalChanges: CashHistoryEntryDto[];
}

export interface CashUnitHistoryRowDto {
  clientId: number;
  componentId: number;
  componentName: string;
  cashUnitId: number;
  typeName: string;
  statusName: string;
  timestamp: string;
  currencyCode: string;
  currencyValue: number;
  unitCount: number;
  totalValue: number;
  addedTime?: string | null;
}
