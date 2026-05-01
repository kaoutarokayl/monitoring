import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtmService, ClientAtm } from '../services/atm.service';

@Component({
  selector: 'app-atm-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './atm-list.component.html',
  styleUrls: ['./atm-list.component.css']
})
export class AtmListComponent implements OnInit {
  private atmService = inject(AtmService);
  private router = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────
  atms = signal<ClientAtm[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  sortField = signal<keyof ClientAtm>('clientName');
  sortAsc = signal(true);

  // ── Computed ───────────────────────────────────────────────────────────────
  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const field = this.sortField();
    const asc = this.sortAsc();

    return [...this.atms()]
      .filter(a => {
        const matchQ = !q ||
          a.clientName.toLowerCase().includes(q) ||
          a.networkAddress.includes(q) ||
          String(a.clientId).includes(q);
        const matchS =
          status === 'all' ||
          (status === 'active' && a.active) ||
          (status === 'inactive' && !a.active);
        return matchQ && matchS;
      })
      .sort((a, b) => {
        const va = a[field] ?? '';
        const vb = b[field] ?? '';
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return asc ? cmp : -cmp;
      });
  });

  totalCount = computed(() => this.atms().length);
  activeCount = computed(() => this.atms().filter(a => a.active).length);
  inactiveCount = computed(() => this.atms().filter(a => !a.active).length);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.atmService.getClients().subscribe({
      next: data => {
        this.atms.set(data);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Impossible de charger les ATMs');
        this.isLoading.set(false);
      }
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  goCreate(): void {
    this.router.navigate(['/admin/atms/create']);
  }

  goEdit(id: number): void {
    this.router.navigate(['/admin/atms', id]);
  }

  goMap(): void {
    this.router.navigate(['/admin/atms/map']);
  }

  confirmDelete(atm: ClientAtm): void {
    if (!confirm(`Supprimer l'ATM "${atm.clientName}" (#${atm.clientId}) ?`)) return;
    this.atmService.deleteClient(atm.clientId).subscribe({
      next: () => this.atms.update(list => list.filter(a => a.clientId !== atm.clientId)),
      error: err => alert(err?.error?.message ?? 'Erreur lors de la suppression')
    });
  }

  // ── Sorting ────────────────────────────────────────────────────────────────
  sort(field: keyof ClientAtm): void {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
  }

  sortIcon(field: keyof ClientAtm): string {
    if (this.sortField() !== field) return '↕';
    return this.sortAsc() ? '↑' : '↓';
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  trackByClientId(_: number, atm: ClientAtm): number {
    return atm.clientId;
  }

  connectableLabel(val: number): string {
    return ['—', 'Non connectable', 'IP Statique', 'IP Dynamique'][val] ?? String(val);
  }
}
