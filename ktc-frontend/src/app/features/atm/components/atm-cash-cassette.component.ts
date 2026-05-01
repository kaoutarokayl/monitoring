import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  AtmService,
  AtmCashCassetteOverviewDto,
  CashFlowReportDto,
  CashUnitHistoryRowDto,
  CassetteSummaryDto,
  PhysicalCassetteDto
} from '../services/atm.service';

export type TabId = 'overview' | 'cashunits' | 'cassettes' | 'flow' | 'history';

@Component({
  selector: 'app-atm-cash-cassette',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './atm-cash-cassette.component.html',
  styleUrls: ['./atm-cash-cassette.component.css']
})
export class AtmCashCassetteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly atmService = inject(AtmService);

  // ── État principal ───────────────────────────────
  clientId = signal<number | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // ── Données API ──────────────────────────────────
  overview        = signal<AtmCashCassetteOverviewDto | null>(null);
  cassetteSummary = signal<CassetteSummaryDto[]>([]);
  cashFlow        = signal<CashFlowReportDto | null>(null);
  historyRows     = signal<CashUnitHistoryRowDto[]>([]);

  // ── UI ───────────────────────────────────────────
  activeTab          = signal<TabId>('overview');
  selectedComponentId = signal<number | null>(null);
  expandedCassette   = signal<number | null>(null);

  // Filtres
  from  = '';
  to    = '';
  limit = 300;

  // Recherche / tri historique
  historySearch  = '';
  historySortCol = signal('timestamp');
  historySortAsc = signal(false);

  // Tri cash units
  cashSortCol = signal('cashUnitId');
  cashSortAsc = signal(true);

  // ── Computed ─────────────────────────────────────
  readonly availableComponents = computed(() => {
    const map = new Map<number, string>();
    (this.overview()?.cashUnitsByComponent ?? []).forEach(c => map.set(c.componentId, c.componentName));
    this.cassetteSummary().forEach(c => { if (!map.has(c.componentId)) map.set(c.componentId, c.componentName); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  });

  readonly allCashUnits = computed(() => {
    const ov  = this.overview();
    if (!ov) return [];
    const sid = this.selectedComponentId();
    return (sid
      ? ov.cashUnitsByComponent.filter(c => c.componentId === sid)
      : ov.cashUnitsByComponent
    ).flatMap(c => c.cashUnits.map(u => ({ ...u, componentName: c.componentName, componentId: c.componentId })));
  });

  readonly sortedCashUnits = computed(() => {
    const col = this.cashSortCol();
    const asc = this.cashSortAsc();
    return [...this.allCashUnits()].sort((a, b) => {
      const va = (a as any)[col] ?? '';
      const vb = (b as any)[col] ?? '';
      return asc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
  });

  readonly filteredHistory = computed(() => {
    const q = this.historySearch.toLowerCase();
    let rows = q
      ? this.historyRows().filter(r =>
          [r.componentName, r.typeName, r.statusName, r.currencyCode]
            .some(v => v?.toLowerCase().includes(q)))
      : this.historyRows();
    const col = this.historySortCol();
    const asc = this.historySortAsc();
    return [...rows].sort((a, b) => {
      const va = (a as any)[col] ?? '';
      const vb = (b as any)[col] ?? '';
      return asc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
  });

  readonly overviewStats = computed(() => {
    const ov = this.overview();
    const cs = this.cassetteSummary();
    return {
      totalCash:        ov?.totalCashValue ?? 0,
      lastUpdated:      ov?.lastUpdated,
      cashComponents:   ov?.cashUnitsByComponent.length ?? 0,
      totalCassettes:   cs.reduce((s, c) => s + c.totalCassettes,   0),
      healthyCassettes: cs.reduce((s, c) => s + c.healthyCassettes,  0),
      lowCassettes:     cs.reduce((s, c) => s + c.lowCassettes,     0),
      emptyCassettes:   cs.reduce((s, c) => s + c.emptyCassettes,   0),
    };
  });

  // ── Lifecycle ─────────────────────────────────────
  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id'));
    if (!id) { this.error.set('ATM introuvable.'); this.isLoading.set(false); return; }
    this.clientId.set(id);
    this.loadAll();
  }

  // ── Chargement des données ─────────────────────────
  loadAll(): void {
    const id = this.clientId();
    if (!id) return;
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      overview: this.atmService.getCashCassetteOverview(id),
      summary:  this.atmService.getCassetteSummary(id).pipe(catchError(() => of([] as CassetteSummaryDto[])))
    }).subscribe({
      next: ({ overview, summary }) => {
        this.overview.set(overview);
        this.cassetteSummary.set(summary);
        if (!this.selectedComponentId() && overview.cashUnitsByComponent.length) {
          this.selectedComponentId.set(overview.cashUnitsByComponent[0].componentId);
        }
        this.loadHistoryAndFlow();
        this.isLoading.set(false);
      },
      error: () => { this.error.set('Erreur de chargement.'); this.isLoading.set(false); }
    });
  }

  loadHistoryAndFlow(): void {
    const id  = this.clientId();
    if (!id) return;
    const cid = this.selectedComponentId() ?? undefined;

    this.atmService.getCashUnitsHistory(id, {
      componentId: cid, from: this.from || undefined, to: this.to || undefined, limit: this.limit
    }).subscribe({ next: d => this.historyRows.set(d), error: () => this.historyRows.set([]) });

    if (!cid) { this.cashFlow.set(null); return; }
    this.atmService.getCashFlow(id, cid, this.from || undefined, this.to || undefined).subscribe({
      next: d => this.cashFlow.set(d), error: () => this.cashFlow.set(null)
    });
  }

  // ── Helpers UI ────────────────────────────────────
  setTab(t: TabId): void { this.activeTab.set(t); }

  selectComponent(id: number | null): void {
    this.selectedComponentId.set(id);
    this.loadHistoryAndFlow();
  }

  toggleCassette(id: number): void {
    this.expandedCassette.set(this.expandedCassette() === id ? null : id);
  }

  sortHistory(col: string): void {
    if (this.historySortCol() === col) this.historySortAsc.set(!this.historySortAsc());
    else { this.historySortCol.set(col); this.historySortAsc.set(false); }
  }

  sortCash(col: string): void {
    if (this.cashSortCol() === col) this.cashSortAsc.set(!this.cashSortAsc());
    else { this.cashSortCol.set(col); this.cashSortAsc.set(true); }
  }

  sortIcon(col: string, forCash = false): string {
    const active = forCash ? this.cashSortCol() : this.historySortCol();
    const asc    = forCash ? this.cashSortAsc()  : this.historySortAsc();
    if (active !== col) return '↕';
    return asc ? '↑' : '↓';
  }

  resetFilters(): void {
    this.from = ''; this.to = ''; this.limit = 300; this.historySearch = '';
    this.selectedComponentId.set(null);
    this.loadHistoryAndFlow();
  }

  statusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'HEALTHY':     return 'status--ok';
      case 'LOW':         return 'status--warn';
      case 'EMPTY':       return 'status--danger';
      case 'INOPERATIVE': return 'status--danger';
      case 'HIGH':        return 'status--info';
      default:            return 'status--muted';
    }
  }

  healthPct(comp: CassetteSummaryDto): number {
    return comp.totalCassettes > 0 ? Math.round(comp.healthyCassettes / comp.totalCassettes * 100) : 0;
  }
}