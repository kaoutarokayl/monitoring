import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtmService, BranchDto } from '../../atm/services/atm.service';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.css']
})
export class BranchListComponent implements OnInit {
  private atmService = inject(AtmService);
  private router     = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────
  branches    = signal<BranchDto[]>([]);
  isLoading   = signal(true);
  error       = signal<string | null>(null);
  searchQuery = signal('');
  sortField   = signal<keyof BranchDto>('branchName');
  sortAsc     = signal(true);

  // ── Computed ───────────────────────────────────────────────────────────────
  filtered = computed(() => {
    const q     = this.searchQuery().toLowerCase();
    const field = this.sortField();
    const asc   = this.sortAsc();

    return [...this.branches()]
      .filter(b => {
        return !q ||
          b.branchName.toLowerCase().includes(q) ||
          (b.displayId || '').toLowerCase().includes(q) ||
          String(b.branchId).includes(q) ||
          String(b.businessId).includes(q);
      })
      .sort((a, b) => {
        const va = (a[field] ?? '').toString().toLowerCase();
        const vb = (b[field] ?? '').toString().toLowerCase();
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return asc ? cmp : -cmp;
      });
  });

  totalCount = computed(() => this.branches().length);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.atmService.getBranches().subscribe({
      next: data => {
        this.branches.set(data);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Impossible de charger les branches');
        this.isLoading.set(false);
      }
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  goCreate(): void {
    this.router.navigate(['/admin/branches/create']);
  }

  goEdit(id: number): void {
    this.router.navigate(['/admin/branches', id, 'edit']);
  }

  confirmDelete(branch: BranchDto): void {
    if (!confirm(`Supprimer la branche "${branch.branchName}" (#${branch.branchId}) ?`)) return;

    this.atmService.deleteBranch(branch.branchId).subscribe({
      next: () => {
        this.branches.update(list =>
          list.filter(b => b.branchId !== branch.branchId)
        );
      },
      error: err => {
        alert(err?.error?.message || 'Erreur lors de la suppression');
      }
    });
  }

  // ── Sorting ────────────────────────────────────────────────────────────────
  sort(field: keyof BranchDto): void {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
  }

  sortIcon(field: keyof BranchDto): string {
    if (this.sortField() !== field) return '↕';
    return this.sortAsc() ? '↑' : '↓';
  }
}

