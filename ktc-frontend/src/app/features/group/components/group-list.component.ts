import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupService, Group, GroupDetails } from '../services/group.service';
import { AtmService, ClientAtm } from '../../atm/services/atm.service';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly atmService   = inject(AtmService);
  private readonly router       = inject(Router);

  // ── State ─────────────────────────────────────────────────────────────────
  groups           = signal<Group[]>([]);
  selectedGroupId  = signal<number | null>(null);
  selectedGroupDtl = signal<GroupDetails | null>(null);
  isLoading        = signal(false);
  error            = signal<string | null>(null);
  searchQuery      = signal('');
  sortField        = signal<keyof Group>('groupName');
  sortAsc          = signal(true);

  // ── Add-client state ───────────────────────────────────────────────────────
  allAtms           = signal<ClientAtm[]>([]);
  loadingAtms       = signal(false);
  selectedClientIds = signal<Set<number>>(new Set());
  isAddingBulk      = signal(false);
  clientSearch      = signal('');

  // ── Computed ───────────────────────────────────────────────────────────────
  filtered = computed(() => {
    const q     = this.searchQuery().toLowerCase();
    const field = this.sortField();
    const asc   = this.sortAsc();

    return [...this.groups()]
      .filter(g =>
        !q ||
        g.groupName?.toLowerCase().includes(q) ||
        String(g.groupId).includes(q) ||
        g.groupDescription?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const va = (a as any)[field] ?? '';
        const vb = (b as any)[field] ?? '';
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return asc ? cmp : -cmp;
      });
  });

  memberIds = computed(() =>
    new Set((this.selectedGroupDtl()?.clients ?? []).map(c => c.clientId))
  );

  availableAtms = computed(() => {
    const q = this.clientSearch().toLowerCase();
    const members = this.memberIds();
    return this.allAtms().filter(a =>
      !members.has(a.clientId) && (
        !q ||
        a.clientName.toLowerCase().includes(q) ||
        a.networkAddress.includes(q) ||
        String(a.clientId).includes(q)
      )
    );
  });

  totalCount = computed(() => this.groups().length);

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void { this.load(); }

  // ── Load ───────────────────────────────────────────────────────────────────
  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.groupService.getAllGroups().subscribe({
      next: data => {
        this.groups.set(data);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Impossible de charger les groupes');
        this.isLoading.set(false);
      }
    });
  }

  selectGroup(groupId: number): void {
    this.selectedGroupId.set(groupId);
    this.selectedGroupDtl.set(null);
    this.selectedClientIds.set(new Set());
    this.clientSearch.set('');

    this.groupService.getGroupDetails(groupId).subscribe({
      next: data => this.selectedGroupDtl.set(data),
      error: err => console.error('Erreur chargement groupe:', err)
    });
  }

  closeDetail(): void {
    this.selectedGroupId.set(null);
    this.selectedGroupDtl.set(null);
    this.selectedClientIds.set(new Set());
    this.clientSearch.set('');
  }

  // ── Sorting ────────────────────────────────────────────────────────────────
  sort(field: keyof Group): void {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
  }

  sortIcon(field: keyof Group): string {
    if (this.sortField() !== field) return '↕';
    return this.sortAsc() ? '↑' : '↓';
  }

  // ── ATMs disponibles ───────────────────────────────────────────────────────
  loadAvailableAtms(): void {
    if (this.allAtms().length > 0) return;
    this.loadingAtms.set(true);
    this.atmService.getClients().subscribe({
      next: data => { this.allAtms.set(data); this.loadingAtms.set(false); },
      error: () => this.loadingAtms.set(false)
    });
  }

  // ── Sélection multi ───────────────────────────────────────────────────────
  toggleSelection(clientId: number): void {
    this.selectedClientIds.update(s => {
      const n = new Set(s);
      n.has(clientId) ? n.delete(clientId) : n.add(clientId);
      return n;
    });
  }

  isSelected(clientId: number): boolean {
    return this.selectedClientIds().has(clientId);
  }

  // ── Ajouter plusieurs ATMs ─────────────────────────────────────────────────
  addSelectedClients(): void {
    const ids = Array.from(this.selectedClientIds());
    if (ids.length === 0 || !this.selectedGroupId()) return;

    this.isAddingBulk.set(true);
    let completed = 0;
    const errors: string[] = [];

    ids.forEach(clientId => {
      this.groupService.addClientToGroup(this.selectedGroupId()!, clientId).subscribe({
        next: () => {
          const atm = this.allAtms().find(a => a.clientId === clientId);
          if (atm) {
            this.selectedGroupDtl.update(gd => gd
              ? { ...gd, clients: [...(gd.clients ?? []), atm as any] }
              : gd
            );
          }
          if (++completed === ids.length) {
            this.isAddingBulk.set(false);
            this.selectedClientIds.set(new Set());
          }
        },
        error: err => {
          errors.push(`${clientId}: ${err?.error?.message ?? 'Erreur'}`);
          if (++completed === ids.length) {
            this.isAddingBulk.set(false);
            if (errors.length) alert(`Erreurs:\n${errors.join('\n')}`);
          }
        }
      });
    });
  }

  // ── Retirer un ATM ────────────────────────────────────────────────────────
  removeClientFromGroup(clientId: number): void {
    if (!confirm('Retirer cet ATM du groupe ?')) return;
    if (!this.selectedGroupId()) return;

    this.groupService.removeClientFromGroup(this.selectedGroupId()!, clientId).subscribe({
      next: () => {
        this.selectedGroupDtl.update(gd => gd
          ? { ...gd, clients: (gd.clients ?? []).filter(c => c.clientId !== clientId) }
          : gd
        );
      },
      error: err => alert(err?.error?.message ?? 'Erreur lors du retrait')
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  goCreate(): void {
    this.router.navigate(['/admin/groups/create']);
  }

  goEdit(id: number): void {
    this.router.navigate(['/admin/groups', id, 'edit']);
  }

  // ── Supprimer ──────────────────────────────────────────────────────────────
  confirmDelete(g: Group): void {
    if (!confirm(`Supprimer le groupe "${g.groupName}" (#${g.groupId}) ?`)) return;
    this.groupService.deleteGroup(g.groupId).subscribe({
      next: () => {
        this.groups.update(list => list.filter(x => x.groupId !== g.groupId));
        if (this.selectedGroupId() === g.groupId) {
          this.closeDetail();
        }
      },
      error: err => alert(err?.error?.message ?? 'Erreur lors de la suppression')
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  groupTypeLabel(typeId?: number): string {
    const labels: Record<number, string> = {
      1: 'Tous les ATMs',
      2: 'Manuel',
      3: 'Schedulé',
      4: 'Dynamique'
    };
    return typeId ? (labels[typeId] ?? `Type ${typeId}`) : '—';
  }
}