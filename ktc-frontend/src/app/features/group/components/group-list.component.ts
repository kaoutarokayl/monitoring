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

  // -- State ------------------------------------------------------------------
  groups           = signal<Group[]>([]);
  selectedGroupId  = signal<number | null>(null);
  selectedGroupDtl = signal<GroupDetails | null>(null);
  isLoading        = signal(false);
  error            = signal<string | null>(null);
  searchQuery      = signal('');
  
  // -- Add client state -------------------------------------------------------
  allAtms           = signal<ClientAtm[]>([]);
  loadingAtms       = signal(false);
  selectedClientIds = signal<Set<number>>(new Set());
  isAddingBulk      = signal(false);
  clientSearch      = signal('');

  // -- Computed ---------------------------------------------------------------
  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.groups().filter(g => {
      return !q ||
        g.groupName?.toLowerCase().includes(q) ||
        String(g.groupId).includes(q) ||
        g.groupDescription?.toLowerCase().includes(q);
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

  // -- Lifecycle --------------------------------------------------------------
  ngOnInit(): void {
    this.load();
  }

  // -- Actions ----------------------------------------------------------------
  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.groupService.getAllGroups().subscribe({
      next: data => {
        this.groups.set(data);
        this.isLoading.set(false);
        if (data.length > 0 && !this.selectedGroupId()) {
          this.selectGroup(data[0].groupId);
        }
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
      next: data => {
        this.selectedGroupDtl.set(data);
      },
      error: err => {
        console.error('Erreur lors du chargement du groupe:', err);
      }
    });
  }

  loadAvailableAtms(): void {
    if (this.allAtms().length === 0) {
      this.loadingAtms.set(true);
      this.atmService.getClients().subscribe({
        next: data => {
          this.allAtms.set(data);
          this.loadingAtms.set(false);
        },
        error: () => {
          this.loadingAtms.set(false);
        }
      });
    }
  }

  toggleSelection(clientId: number): void {
    this.selectedClientIds.update(selected => {
      const newSelected = new Set(selected);
      if (newSelected.has(clientId)) {
        newSelected.delete(clientId);
      } else {
        newSelected.add(clientId);
      }
      return newSelected;
    });
  }

  isSelected(clientId: number): boolean {
    return this.selectedClientIds().has(clientId);
  }

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
            this.selectedGroupDtl.update(gd => gd ? {
              ...gd,
              clients: [...(gd.clients ?? []), atm as any]
            } : gd);
          }
          completed++;
          if (completed === ids.length) {
            this.isAddingBulk.set(false);
            this.selectedClientIds.set(new Set());
          }
        },
        error: err => {
          errors.push(`${clientId}: ${err?.error?.message ?? 'Erreur'}`);
          completed++;
          if (completed === ids.length) {
            this.isAddingBulk.set(false);
            if (errors.length > 0) {
              alert(`Erreurs lors de l'ajout:\n${errors.join('\n')}`);
            }
          }
        }
      });
    });
  }

  removeClientFromGroup(clientId: number): void {
    if (!confirm('Retirer cet ATM du groupe ?')) return;
    if (!this.selectedGroupId()) return;

    this.groupService.removeClientFromGroup(this.selectedGroupId()!, clientId).subscribe({
      next: () => {
        this.selectedGroupDtl.update(gd => gd ? {
          ...gd,
          clients: (gd.clients ?? []).filter(c => c.clientId !== clientId)
        } : gd);
      },
      error: err => alert(err?.error?.message ?? 'Erreur lors du retrait')
    });
  }

  goCreate(): void {
    this.router.navigate(['/admin/groups/create']);
  }

  goEdit(id: number): void {
    this.router.navigate(['/admin/groups', id, 'edit']);
  }

  confirmDelete(g: Group): void {
    if (!confirm(`Supprimer le groupe "${g.groupName}" (#${g.groupId}) ?`)) return;
    this.groupService.deleteGroup(g.groupId).subscribe({
      next: () => {
        this.groups.update(list => list.filter(x => x.groupId !== g.groupId));
        if (this.selectedGroupId() === g.groupId) {
          this.selectedGroupId.set(null);
          this.selectedGroupDtl.set(null);
        }
      },
      error: err => alert(err?.error?.message ?? 'Erreur lors de la suppression')
    });
  }

  groupTypeLabel(typeId?: number): string {
    const labels: Record<number, string> = { 1: 'Tous les ATMs', 2: 'Manuel', 3: 'Schedulé', 4: 'Dynamique' };
    return typeId ? (labels[typeId] ?? `Type ${typeId}`) : '—';
  }
}

