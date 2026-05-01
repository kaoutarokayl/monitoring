import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtmService, BusinessDto } from '../../atm/services/atm.service';

@Component({
  selector: 'app-business-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-list.component.html',
  styleUrls: ['./business-list.component.css']
})
export class BusinessListComponent implements OnInit {
  private atmService = inject(AtmService);
  private router     = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────
  businesses   = signal<BusinessDto[]>([]);
  isLoading    = signal(true);
  error        = signal<string | null>(null);
  searchQuery  = signal('');
  sortField    = signal<keyof BusinessDto>('businessName');
  sortAsc      = signal(true);

  // ── Computed ───────────────────────────────────────────────────────────────
  filtered = computed(() => {
    const q     = this.searchQuery().toLowerCase();
    const field = this.sortField();
    const asc   = this.sortAsc();

    return [...this.businesses()]
      .filter(b => {
        return !q ||
          b.businessName.toLowerCase().includes(q) ||
          b.displayId.toLowerCase().includes(q) ||
          String(b.businessId).includes(q);
      })
      .sort((a, b) => {
        const va = a[field] ?? '';
        const vb = b[field] ?? '';
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return asc ? cmp : -cmp;
      });
  });

  totalCount = computed(() => this.businesses().length);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.atmService.getBusinesses().subscribe({
      next: data => {
        this.businesses.set(data);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Impossible de charger les businesses');
        this.isLoading.set(false);
      }
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  goCreate(): void {
    this.router.navigate(['/admin/businesses/create']);
  }

  goEdit(id: number): void {
    this.router.navigate(['/admin/businesses', id, 'edit']);
  }

  confirmDelete(b: BusinessDto): void {
    if (!confirm(`Supprimer le business "${b.businessName}" (#${b.businessId}) ?`)) return;
    this.atmService.deleteBusiness(b.businessId).subscribe({
      next: () => this.businesses.update(list => list.filter(x => x.businessId !== b.businessId)),
      error: err => alert(err?.error?.message ?? 'Erreur lors de la suppression')
    });
  }

  // ── Sorting ────────────────────────────────────────────────────────────────
  sort(field: keyof BusinessDto): void {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
  }

  sortIcon(field: keyof BusinessDto): string {
    if (this.sortField() !== field) return '↕';
    return this.sortAsc() ? '↑' : '↓';
  }
}

