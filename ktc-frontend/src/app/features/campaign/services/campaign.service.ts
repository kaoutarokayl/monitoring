import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Campaign,
  CreateCampaignRequest,
  CampaignBusiness,
  CampaignGroup,
  CampaignBINRange,
  CampaignShownCount
} from '../models/campaign.models';

export interface BusinessDto {
  businessId: number;
  businessName: string;
  displayId: string;
}

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private readonly http      = inject(HttpClient);
  private readonly apiUrl    = 'http://localhost:5239/api/campaign';
  private readonly atmApiUrl = 'http://localhost:5239/api/atm';

  // ── Businesses (GET /api/atm/businesses) ───────────────────────────────────
  getAllBusinesses(): Observable<BusinessDto[]> {
    return this.http.get<BusinessDto[]>(`${this.atmApiUrl}/businesses`);
  }

  // ── Campaigns ──────────────────────────────────────────────────────────────
  getAllCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(this.apiUrl);
  }

  getCampaignById(campaignId: number): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.apiUrl}/${campaignId}`);
  }

  getCampaignBusinesses(campaignId: number): Observable<CampaignBusiness[]> {
    return this.http.get<CampaignBusiness[]>(`${this.apiUrl}/${campaignId}/businesses`);
  }

  getCampaignGroups(campaignId: number): Observable<CampaignGroup[]> {
    return this.http.get<CampaignGroup[]>(`${this.apiUrl}/${campaignId}/groups`);
  }

  getCampaignBINRanges(campaignId: number): Observable<CampaignBINRange[]> {
    return this.http.get<CampaignBINRange[]>(`${this.apiUrl}/${campaignId}/bin-ranges`);
  }

  getCampaignShownCounts(campaignId: number): Observable<CampaignShownCount[]> {
    return this.http.get<CampaignShownCount[]>(`${this.apiUrl}/${campaignId}/shown-counts`);
  }

  // ── CREATE / UPDATE / DELETE ───────────────────────────────────────────────
  createCampaign(request: CreateCampaignRequest): Observable<any> {
    return this.http.post(this.apiUrl, request);
  }

  updateCampaign(campaignId: number, request: CreateCampaignRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${campaignId}`, request);
  }

  deleteCampaign(campaignId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${campaignId}`);
  }
}