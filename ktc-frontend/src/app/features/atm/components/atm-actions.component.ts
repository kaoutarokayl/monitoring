import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AtmActionDto, AtmService } from '../services/atm.service';
import { formatCommandDisplayLabel } from '../remote-toolbar-commands';

@Component({
  selector: 'app-atm-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atm-actions.component.html',
  styleUrls: ['./atm-actions.component.css']
})
export class AtmActionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly atmService = inject(AtmService);

  readonly clientId = signal<number | null>(null);

  /** Fenêtre mobile en jours glissants */
  readonly days = signal(7);

  /** Filtre « Added by User » ; chaîne vide = tous */
  readonly addedByUser = signal('');

  /** Filtre statut ; chaîne vide = tous */
  readonly statusFilter = signal('');

  /** Recherche plein-texte */
  readonly searchQuery = signal('');

  /** Colonne de tri actuelle */
  readonly sortColumn = signal<keyof AtmActionDto>('addedTime');

  /** Direction du tri : 1 = asc, -1 = desc */
  readonly sortDirection = signal<1 | -1>(-1);

  /** Ligne développée pour le panneau de détail */
  readonly expandedRowId = signal<number | null>(null);

  /** Pagination */
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  /** Utilisateurs distincts présents dans la fenêtre */
  readonly addedByUsers = signal<string[]>([]);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AtmActionDto[]>([]);

  /** Horodatage du dernier rechargement */
  readonly lastRefresh = signal<string | null>(null);

  /** Statuts distincts pour le filtre */
  readonly availableStatuses = computed(() =>
    [...new Set(this.rows().map(r => r.status).filter(Boolean))].sort()
  );

  /** Lignes après filtres + tri */
  readonly filteredRows = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const user = this.addedByUser();
    const status = this.statusFilter();
    const col = this.sortColumn();
    const dir = this.sortDirection();

    let data = this.rows().filter(r => {
      if (user && r.user !== user) return false;
      if (status && (r.status ?? '').trim().toLowerCase() !== status.trim().toLowerCase()) return false;
      if (q) {
        const hay = [r.user, r.command, r.status, r.lastComment].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...data].sort((a, b) => {
      const av = (a[col] as string) ?? '';
      const bv = (b[col] as string) ?? '';
      return av < bv ? dir : av > bv ? -dir : 0;
    });
  });

  /**
   * Statistiques de synthèse.
   * Les statuts viennent tels quels de dbo.Actions (chaîne SQL brute).
   * On normalise en minuscules pour être robuste à la casse.
   */
  readonly stats = computed(() => {
    const d = this.filteredRows();
    const norm = (r: AtmActionDto) => (r.status ?? '').trim().toLowerCase();
    return {
      total:     d.length,
      // Exécuté avec succès
      done:      d.filter(r => ['done', 'completed', 'success', 'ok', 'finished'].includes(norm(r))).length,
      // En attente ou en cours — IMMEDIATE = envoyé mais pas encore traité par l'ATM
      pending:   d.filter(r => ['pending', 'immediate', 'inprogress', 'in_progress',
                                'in progress', 'waiting', 'queued', 'started', 'sent'].includes(norm(r))).length,
      // Échoué
      error:     d.filter(r => ['error', 'failed', 'failure', 'ko', 'timeout', 'faulted'].includes(norm(r))).length,
      // Annulé
      cancelled: d.filter(r => ['cancelled', 'canceled', 'aborted', 'rejected'].includes(norm(r))).length,
    };
  });

  /** Nombre total de pages */
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize))
  );

  /** Lignes de la page courante */
  readonly pagedRows = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredRows().slice(start, start + this.pageSize);
  });

  /** Numéros de pages (null = ellipsis) */
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | null)[];
    const cur = this.currentPage();
    const pages: (number | null)[] = [1];
    if (cur > 3) pages.push(null);
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push(null);
    pages.push(total);
    return pages;
  });

  readonly isEmpty = computed(() =>
    !this.isLoading() && !this.error() && this.filteredRows().length === 0
  );

  ngOnInit(): void {
    const idStr = this.route.parent?.snapshot.paramMap.get('id')
      ?? this.route.snapshot.paramMap.get('id');
    this.clientId.set(idStr ? Number(idStr) : null);
    this.refresh();
  }

  bumpDays(delta: number): void {
    this.days.set(Math.min(365, Math.max(1, this.days() + delta)));
  }

  onDaysInput(ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    if (!Number.isFinite(v)) return;
    this.days.set(Math.min(365, Math.max(1, Math.round(v))));
  }

  onUserFilterChange(ev: Event): void {
    this.addedByUser.set((ev.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  onStatusFilterChange(ev: Event): void {
    this.statusFilter.set((ev.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  onSearchInput(ev: Event): void {
    this.searchQuery.set((ev.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  sortBy(col: keyof AtmActionDto): void {
    if (this.sortColumn() === col) {
      this.sortDirection.set(this.sortDirection() === -1 ? 1 : -1);
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set(-1);
    }
    this.currentPage.set(1);
  }

  sortIcon(col: keyof AtmActionDto): string {
    if (this.sortColumn() !== col) return '↕';
    return this.sortDirection() === -1 ? '↓' : '↑';
  }

  isSorted(col: keyof AtmActionDto): boolean {
    return this.sortColumn() === col;
  }

  toggleRow(id: number): void {
    this.expandedRowId.set(this.expandedRowId() === id ? null : id);
  }

  isExpanded(id: number): boolean {
    return this.expandedRowId() === id;
  }

  goToPage(p: number): void {
    this.currentPage.set(Math.max(1, Math.min(this.totalPages(), p)));
    this.expandedRowId.set(null);
  }

  calcDuration(started: string | null, finished: string | null): string | null {
    if (!started || !finished) return null;
    const secs = Math.round((new Date(finished).getTime() - new Date(started).getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${String(secs % 60).padStart(2, '0')}s`;
  }

  statusClass(status: string): string {
    const s = (status ?? '').trim().toLowerCase();
    if (['done', 'completed', 'success', 'ok', 'finished'].includes(s))           return 'badge--ok';
    if (['error', 'failed', 'failure', 'ko', 'timeout', 'faulted'].includes(s))   return 'badge--err';
    if (['cancelled', 'canceled', 'aborted', 'rejected'].includes(s))             return 'badge--neutral';
    // IMMEDIATE, pending, inprogress, waiting, etc.
    return 'badge--warn';
  }

  displayCommandLabel(name: string): string {
    return formatCommandDisplayLabel(name);
  }

  private normalizeActionRow(x: Record<string, unknown>): AtmActionDto {
    const pick = (a: string, b: string): string | null => {
      const v = x[a] ?? x[b];
      if (v == null || v === '') return null;
      const t = String(v).trim();
      return t === '' ? null : t;
    };
    return {
      actionId: Number(x['actionId'] ?? x['ActionId'] ?? 0),
      user: pick('user', 'User') ?? '',
      command: pick('command', 'Command') ?? '',
      status: pick('status', 'Status') ?? '',
      addedTime: pick('addedTime', 'AddedTime'),
      started: pick('started', 'Started'),
      finished: pick('finished', 'Finished'),
      lastComment: pick('lastComment', 'LastComment') ?? '',
    };
  }

  refresh(): void {
    const id = this.clientId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.expandedRowId.set(null);
    this.currentPage.set(1);

    const user = this.addedByUser().trim();
    this.atmService
      .getClientActions(id, {
        days: this.days(),
        addedByUser: user ? user : undefined,
      })
      .subscribe({
        next: (res) => {
          const items = (res.items ?? []).map(r =>
            this.normalizeActionRow(r as unknown as Record<string, unknown>)
          );
          this.rows.set(items);
          this.addedByUsers.set(res.addedByUsers ?? []);
          this.lastRefresh.set(new Date().toLocaleTimeString('fr-FR'));
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Erreur lors du chargement des Actions.');
          this.isLoading.set(false);
        },
      });
  }
}