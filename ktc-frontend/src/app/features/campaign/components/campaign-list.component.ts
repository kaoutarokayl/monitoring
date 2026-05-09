import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CampaignService, BusinessDto } from '../services/campaign.service';
import { Campaign } from '../models/campaign.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css']
})
export class CampaignListComponent implements OnInit {
  private readonly campaignService = inject(CampaignService);
  private readonly router = inject(Router);

  // ── State ─────────────────────────────────────────────────────────────────
  campaigns          = signal<Campaign[]>([]);
  businesses         = signal<BusinessDto[]>([]);
  selectedCampaignId = signal<number | null>(null);
  isLoading          = signal(false);
  error              = signal<string | null>(null);

  // Filters
  searchQuery    = signal('');
  statusFilter   = signal<number | null>(null);
  typeFilter     = signal<number | null>(null);
  businessFilter = signal<string>('');

  // Sort
  sortField = signal<keyof Campaign>('name');
  sortAsc   = signal(true);

  // ── Computed ───────────────────────────────────────────────────────────────
  filtered = computed(() => {
    const q       = this.searchQuery().toLowerCase();
    const statusF = this.statusFilter();
    const typeF   = this.typeFilter();
    const field   = this.sortField();
    const asc     = this.sortAsc();

    return [...this.campaigns()]
      .filter(c => {
        if (q && !(
          c.name?.toLowerCase().includes(q) ||
          c.packageName?.toLowerCase().includes(q) ||
          c.externalId?.toLowerCase().includes(q) ||
          String(c.campaignId).includes(q)
        )) return false;
        if (statusF !== null && Number(c.campaignStatus) !== statusF) return false;
        if (typeF   !== null && Number(c.campaignType)   !== typeF)   return false;
        return true;
      })
      .sort((a, b) => {
        let va: any = (a as any)[field];
        let vb: any = (b as any)[field];
        if (field === 'startDate' || field === 'endDate' || field === 'purgeDate') {
          va = va ? new Date(va).getTime() : 0;
          vb = vb ? new Date(vb).getTime() : 0;
        }
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return asc ? cmp : -cmp;
      });
  });

  currentBusiness = computed(() => {
    const id = this.businessFilter();
    if (!id) return null;
    return this.businesses().find(b => String(b.businessId) === id)?.businessName ?? null;
  });

  testCampaignName = computed(() => {
    const id = this.selectedCampaignId();
    if (!id) return null;
    const c = this.campaigns().find(x => x.campaignId === id);
    return c?.campaignInTestmode ? c.name : null;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
  }

  // ── Load campaigns + businesses in parallel ────────────────────────────────
  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      campaigns:  this.campaignService.getAllCampaigns(),
      businesses: this.campaignService.getAllBusinesses()
    }).subscribe({
      next: ({ campaigns, businesses }) => {
        this.campaigns.set(campaigns);
        this.businesses.set(businesses);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Load error:', err);
        this.error.set('Impossible de charger les données. Vérifiez la connexion au serveur.');
        this.isLoading.set(false);
      }
    });
  }

  // Reload only campaigns (bouton Update / Apply / OK)
  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.campaignService.getAllCampaigns().subscribe({
      next: (campaigns) => {
        this.campaigns.set(campaigns);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Load error:', err);
        this.error.set('Impossible de charger les campagnes.');
        this.isLoading.set(false);
      }
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  selectCampaign(campaignId: number): void {
    this.selectedCampaignId.set(
      this.selectedCampaignId() === campaignId ? null : campaignId
    );
  }

  isSelected(campaignId: number): boolean {
    return this.selectedCampaignId() === campaignId;
  }

  // ── Sort ───────────────────────────────────────────────────────────────────
  sort(field: keyof Campaign): void {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
  }

  sortIcon(field: keyof Campaign): string {
    if (this.sortField() !== field) return '↕';
    return this.sortAsc() ? '↑' : '↓';
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  goCreate(): void {
    this.router.navigate(['/campaign/create']);
  }

  goEdit(campaignId: number): void {
    this.router.navigate(['/campaign', campaignId, 'edit']);
  }

  goDetails(campaignId: number): void {
    this.router.navigate(['/campaign', campaignId]);
  }

  openMarketingControl(): void {
    const id = this.selectedCampaignId();
    if (id) this.router.navigate(['/campaign', id, 'marketing']);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  deleteCampaign(campaignId: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) return;

    this.campaignService.deleteCampaign(campaignId).subscribe({
      next: () => {
        this.campaigns.update(items => items.filter(c => c.campaignId !== campaignId));
        if (this.selectedCampaignId() === campaignId) this.selectedCampaignId.set(null);
      },
      error: () => alert('Erreur lors de la suppression de la campagne')
    });
  }

  // ── Label helpers ──────────────────────────────────────────────────────────
  getStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      0: 'Enabled', 1: 'Disabled', 2: 'Expired', 3: 'Purged', 4: 'Cancelled'
    };
    return labels[status] ?? 'Unknown';
  }

  getTypeLabel(type: number): string {
    const labels: Record<number, string> = {
      0: 'General', 1: 'Targeted', 2: 'External'
    };
    return labels[type] ?? 'Unknown';
  }
}