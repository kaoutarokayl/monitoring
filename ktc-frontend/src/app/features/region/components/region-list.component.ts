import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtmService, RegionListDto } from '../../atm/services/atm.service';

@Component({
  selector: 'app-region-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './region-list.component.html',
  styleUrls: ['./region-list.component.css']
})
export class RegionListComponent implements OnInit {
  private atmService = inject(AtmService);
  private router     = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────
  regions      = signal<RegionListDto[]>([]);
  isLoading    = signal(true);
  error        = signal<string | null>(null);
  searchQuery  = signal('');
  sortField    = signal<keyof RegionListDto>('regionName');
  sortAsc      = signal(true);

  // ── Computed ───────────────────────────────────────────────────────────────
  filtered = computed(() => {
    const q     = this.searchQuery().toLowerCase();
    const field = this.sortField();
    const asc   = this.sortAsc();

    return [...this.regions()]
      .filter(b => {
        return !q ||
          b.regionName.toLowerCase().includes(q) ||
          b.displayId.toLowerCase().includes(q) ||
          b.businessName.toLowerCase().includes(q) ||
          String(b.regionId).includes(q);
      })
      .sort((a, b) => {
        const va = a[field] ?? '';
        const vb = b[field] ?? '';
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return asc ? cmp : -cmp;
      });
  });

  totalCount = computed(() => this.regions().length);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.atmService.getRegions().subscribe({
      next: data => {
        this.regions.set(data);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Impossible de charger les régions');
        this.isLoading.set(false);
      }
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  goCreate(): void {
    this.router.navigate(['/admin/regions/create']);
  }

  goEdit(id: number): void {
    this.router.navigate(['/admin/regions', id, 'edit']);
  }

  confirmDelete(r: RegionListDto): void {
    if (!confirm(`Supprimer la région "${r.regionName}" (#${r.regionId}) ?`)) return;
    this.atmService.deleteRegion(r.regionId).subscribe({
      next: () => this.regions.update(list => list.filter(x => x.regionId !== r.regionId)),
      error: err => alert(err?.error?.message ?? 'Erreur lors de la suppression')
    });
  }

  // ── Sorting ────────────────────────────────────────────────────────────────
  sort(field: keyof RegionListDto): void {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
  }

  sortIcon(field: keyof RegionListDto): string {
    if (this.sortField() !== field) return '↕';
    return this.sortAsc() ? '↑' : '↓';
  }
}