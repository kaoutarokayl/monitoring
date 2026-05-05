export * from '../models/atm.models';
import { ClientAtm, BusinessDto, BusinessDetailsDto, BranchDto, RegionDto, RegionDetailsDto, HardwareTypeDto, CreateOrUpdateAtmRequest, CreateBranchRequest, CreateBusinessRequest, CreateRegionRequest, AtmComponentStatusDto, AtmAssetHistoryDto, RegionListDto, LastClientContactDto, AtmSoftwareInfoDto, AtmCertificateDto, AtmTicketDto, AppCounterDto, ReplenishmentDto, XfsCountersResponseDto, AtmActionsResponseDto, AtmUploadDto, RemoteCommandTypeDto, DispatchRemoteActionsRequest, DispatchRemoteActionsResponse, ElectronicJournalEntryDto, LookupItemDto, TransactionAuditDto, TransactionSearchCriteria, VideoJournalEventDto, AtmAvailabilityReportDto, AtmCashCassetteOverviewDto, CashFlowReportDto, CashUnitHistoryRowDto, CassetteSummaryDto, AtmScheduleDto, CreateScheduleRequest } from '../models/atm.models';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── Models calqués sur vos DTOs C# ──────────────────────────────────────────

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AtmService {
  private readonly http = inject(HttpClient);
  private readonly BASE = 'http://localhost:5239/api/atm';

  // ── Clients / ATMs ────────────────────────────────────────────────────────

  getClients(): Observable<ClientAtm[]> {
    return this.http.get<ClientAtm[]>(`${this.BASE}/clients`);
  }

  getClientById(id: number): Observable<ClientAtm> {
    return this.http.get<ClientAtm>(`${this.BASE}/clients/${id}`);
  }

  createClient(req: CreateOrUpdateAtmRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/clients`, req);
  }

  updateClient(id: number, req: CreateOrUpdateAtmRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.BASE}/clients/${id}`, req);
  }

  deleteClient(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.BASE}/clients/${id}`);
  }

  getAtmStatus(clientId: number): Observable<AtmComponentStatusDto[]> {
    return this.http.get<AtmComponentStatusDto[]>(`${this.BASE}/clients/${clientId}/status`);
  }

  getApplicationCounters(clientId: number, componentId: number): Observable<AppCounterDto[]> {
    return this.http.get<AppCounterDto[]>(`${this.BASE}/clients/${clientId}/components/${componentId}/application-counters`);
  }

  getReplenishments(clientId: number, componentId: number): Observable<ReplenishmentDto[]> {
    return this.http.get<ReplenishmentDto[]>(`${this.BASE}/clients/${clientId}/components/${componentId}/replenishments`);
  }

  getXfsCounters(clientId: number, componentId: number): Observable<XfsCountersResponseDto> {
    return this.http.get<XfsCountersResponseDto>(`${this.BASE}/clients/${clientId}/components/${componentId}/xfs-counters`);
  }

  getClientActions(
    clientId: number,
    opts?: { days?: number; addedByUser?: string; from?: string; to?: string }
  ): Observable<AtmActionsResponseDto> {
    const params: Record<string, string> = {};
    if (opts?.from) params['from'] = opts.from;
    if (opts?.to) params['to'] = opts.to;
    if (opts?.days != null && opts.days > 0) params['days'] = String(opts.days);
    if (opts?.addedByUser) params['addedByUser'] = opts.addedByUser;
    return this.http.get<AtmActionsResponseDto>(`${this.BASE}/clients/${clientId}/actions`, { params });
  }

  getRemoteCommandTypes(): Observable<RemoteCommandTypeDto[]> {
    return this.http.get<RemoteCommandTypeDto[]>(`${this.BASE}/command-types`);
  }

  getClientSchedules(clientId: number): Observable<AtmScheduleDto[]> {
    return this.http.get<AtmScheduleDto[]>(`${this.BASE}/clients/${clientId}/schedules`);
  }

  getClientUploads(clientId: number): Observable<AtmUploadDto[]> {
    return this.http.get<AtmUploadDto[]>(`${this.BASE}/clients/${clientId}/uploads`);
  }

  createSchedule(body: CreateScheduleRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/schedules`, body);
  }

  dispatchRemoteCommand(body: DispatchRemoteActionsRequest): Observable<DispatchRemoteActionsResponse> {
    return this.http.post<DispatchRemoteActionsResponse>(`${this.BASE}/clients/dispatch-command`, body);
  }

  getElectronicJournal(clientId: number, from: string, to: string): Observable<ElectronicJournalEntryDto[]> {
    return this.http.get<ElectronicJournalEntryDto[]>(`${this.BASE}/clients/${clientId}/electronic-journal`, {
      params: { from, to }
    });
  }

  getTransactionTypeCodes(): Observable<LookupItemDto[]> {
    return this.http.get<LookupItemDto[]>(`${this.BASE}/transactions/lookups/type-codes`);
  }

  getTransactionReasonCodes(): Observable<LookupItemDto[]> {
    return this.http.get<LookupItemDto[]>(`${this.BASE}/transactions/lookups/reason-codes`);
  }

  getTransactionCompletionCodes(): Observable<LookupItemDto[]> {
    return this.http.get<LookupItemDto[]>(`${this.BASE}/transactions/lookups/completion-codes`);
  }

  searchAtmTransactions(clientId: number, criteria: TransactionSearchCriteria): Observable<TransactionAuditDto[]> {
    return this.http.post<TransactionAuditDto[]>(`${this.BASE}/clients/${clientId}/transactions/search`, criteria);
  }

  searchVideoJournal(clientId: number, from: string, to: string, search?: string): Observable<VideoJournalEventDto[]> {
    const params: Record<string, string> = { from, to };
    if (search) params['search'] = search;
    return this.http.get<VideoJournalEventDto[]>(`${this.BASE}/clients/${clientId}/videojournal/search`, { params });
  }

  getAvailability(clientId: number, from: string, to: string): Observable<AtmAvailabilityReportDto> {
    return this.http.get<AtmAvailabilityReportDto>(`${this.BASE}/clients/${clientId}/availability`, {
      params: { from, to }
    });
  }

  getAtmAssetHistory(clientId: number): Observable<AtmAssetHistoryDto[]> {
    return this.http.get<AtmAssetHistoryDto[]>(`${this.BASE}/clients/${clientId}/assethistory`);
  }

  getCashCassetteOverview(clientId: number): Observable<AtmCashCassetteOverviewDto> {
    return this.http.get<AtmCashCassetteOverviewDto>(`${this.BASE}/clients/${clientId}/cash-cassette-overview`);
  }

  getCassetteSummary(clientId: number): Observable<CassetteSummaryDto[]> {
    return this.http.get<CassetteSummaryDto[]>(`${this.BASE}/clients/${clientId}/cassettes-summary`);
  }

  getCashFlow(clientId: number, componentId: number, from?: string, to?: string): Observable<CashFlowReportDto> {
    const params: Record<string, string> = { componentId: componentId.toString() };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<CashFlowReportDto>(`${this.BASE}/clients/${clientId}/cash-flow`, { params });
  }

  getCashUnitsHistory(clientId: number, params?: {
    componentId?: number;
    from?: string;
    to?: string;
    limit?: number;
  }): Observable<CashUnitHistoryRowDto[]> {
    const query: Record<string, string> = {};
    if (params?.componentId !== undefined) query['componentId'] = params.componentId.toString();
    if (params?.from) query['from'] = params.from;
    if (params?.to) query['to'] = params.to;
    if (params?.limit !== undefined) query['limit'] = params.limit.toString();
    return this.http.get<CashUnitHistoryRowDto[]>(`${this.BASE}/clients/${clientId}/cash-units-history`, { params: query });
  }

  // ── Businesses ────────────────────────────────────────────────────────────

  getBusinesses(): Observable<BusinessDto[]> {
    return this.http.get<BusinessDto[]>(`${this.BASE}/businesses`);
  }

  getBusinessById(id: number): Observable<BusinessDetailsDto> {
    return this.http.get<BusinessDetailsDto>(`${this.BASE}/businesses/${id}`);
  }

  createBusiness(req: CreateBusinessRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/businesses`, req);
  }

  updateBusiness(id: number, req: Partial<CreateBusinessRequest>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.BASE}/businesses/${id}`, req);
  }

  deleteBusiness(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.BASE}/businesses/${id}`);
  }

  // ── Branches ──────────────────────────────────────────────────────────────

  getBranches(): Observable<BranchDto[]> {
    return this.http.get<BranchDto[]>(`${this.BASE}/branches`);
  }

  getBranchById(id: number): Observable<BranchDto> {
    return this.http.get<BranchDto>(`${this.BASE}/branches/${id}`);
  }

  createBranch(req: CreateBranchRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/branches`, req);
  }

  updateBranch(id: number, req: CreateBranchRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.BASE}/branches/${id}`, req);
  }

  deleteBranch(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.BASE}/branches/${id}`);
  }

  // ── Regions ───────────────────────────────────────────────────────────────

getRegions(): Observable<RegionListDto[]> {
  return this.http.get<RegionListDto[]>(`${this.BASE}/regions`);
}
  getRegionById(id: number): Observable<RegionDetailsDto> {
    return this.http.get<RegionDetailsDto>(`${this.BASE}/regions/${id}`);
  }

  createRegion(req: CreateRegionRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/regions`, req);
  }

  updateRegion(id: number, req: CreateRegionRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.BASE}/regions/${id}`, req);
  }

  deleteRegion(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.BASE}/regions/${id}`);
  }

  // ── Hardware Types ────────────────────────────────────────────────────────

  getHardwareTypes(): Observable<HardwareTypeDto[]> {
    return this.http.get<HardwareTypeDto[]>(`${this.BASE}/hardwaretypes`);
  }

  getHardwareTypesByBusiness(businessId: number): Observable<HardwareTypeDto[]> {
    return this.http.get<HardwareTypeDto[]>(`${this.BASE}/businesses/${businessId}/hardwaretypes`);
  }

  // ── Last Client Contact ───────────────────────────────────────────────────

  getLastClientContact(clientId: number): Observable<LastClientContactDto> {
    return this.http.get<LastClientContactDto>(`${this.BASE}/clients/${clientId}/lastcontact`);
  }

  getAtmSoftwareInfo(clientId: number): Observable<AtmSoftwareInfoDto[]> {
    return this.http.get<AtmSoftwareInfoDto[]>(`${this.BASE}/clients/${clientId}/softwareinfo`);
  }

  getAtmCertificates(clientId: number): Observable<AtmCertificateDto[]> {
    return this.http.get<AtmCertificateDto[]>(`${this.BASE}/clients/${clientId}/certificates`);
  }

  getAtmTickets(clientId: number, days: number = 14, statusFilter: string = 'All'): Observable<AtmTicketDto[]> {
    return this.http.get<AtmTicketDto[]>(`${this.BASE}/clients/${clientId}/tickets`, {
      params: {
        days: days.toString(),
        statusFilter: statusFilter
      }
    });
  }
}

