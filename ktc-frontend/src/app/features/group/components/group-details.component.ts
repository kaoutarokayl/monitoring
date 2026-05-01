import { Component, Input, OnInit, OnChanges, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService, GroupDetails } from '../services/group.service';
import { AtmService, ClientAtm } from '../../atm/services/atm.service';

@Component({
  selector: 'app-group-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.css']
})
export class GroupDetailsComponent implements OnInit, OnChanges {
  @Input() groupId!: number;
  @Output() clientRemoved = new EventEmitter<number>();

  private readonly groupService = inject(GroupService);
  private readonly atmService   = inject(AtmService);

  // -- State ------------------------------------------------------------------
  groupDetails  = signal<GroupDetails | null>(null);
  isLoading     = signal(false);
  error         = signal<string | null>(null);

  // Ajout client(s)
  showAddModal      = signal(false);
  allAtms           = signal<ClientAtm[]>([]);
  loadingAtms       = signal(false);
  addSearch         = signal('');
  addingClientId    = signal<number | null>(null);
  selectedClientIds = signal<Set<number>>(new Set()); // Multi-s�lection
  isAddingBulk      = signal(false);

  // -- Computed ---------------------------------------------------------------
  memberIds = computed(() =>
    new Set((this.groupDetails()?.clients ?? []).map(c => c.clientId))
  );

  availableAtms = computed(() => {
    const q = this.addSearch().toLowerCase();
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

  groupTypeLabel = computed(() => {
    const labels: Record<number, string> = { 1: 'Tous les ATMs', 2: 'Manuel', 3: 'Schedul�', 4: 'Dynamique' };
    const t = this.groupDetails()?.groupTypeId;
    return t ? (labels[t] ?? `Type ${t}`) : '�';
  });

  // -- Lifecycle --------------------------------------------------------------
  ngOnInit(): void { this.load(); }

  ngOnChanges(): void { this.load(); }

  load(): void {
    if (!this.groupId) return;
    this.isLoading.set(true);
    this.error.set(null);
    this.groupService.getGroupDetails(this.groupId).subscribe({
      next: data => { this.groupDetails.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Erreur lors du chargement du groupe'); this.isLoading.set(false); }
    });
  }

  // -- Remove client ----------------------------------------------------------
  removeClient(clientId: number): void {
    if (!confirm('Retirer cet ATM du groupe ?')) return;
    this.groupService.removeClientFromGroup(this.groupId, clientId).subscribe({
      next: () => {
        this.groupDetails.update(gd => gd ? {
          ...gd,
          clients: (gd.clients ?? []).filter(c => c.clientId !== clientId)
        } : gd);
        this.clientRemoved.emit(clientId);
      },
      error: err => alert(err?.error?.message ?? 'Erreur lors du retrait')
    });
  }

  // -- Add client modal -------------------------------------------------------
  openAddModal(): void {
    this.showAddModal.set(true);
    this.addSearch.set('');
    if (this.allAtms().length === 0) {
      this.loadingAtms.set(true);
      this.atmService.getClients().subscribe({
        next: data => { this.allAtms.set(data); this.loadingAtms.set(false); },
        error: () => { this.loadingAtms.set(false); }
      });
    }
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.selectedClientIds.set(new Set());
  }

  addClient(clientId: number): void {
    this.addingClientId.set(clientId);
    this.groupService.addClientToGroup(this.groupId, clientId).subscribe({
      next: () => {
        const atm = this.allAtms().find(a => a.clientId === clientId);
        if (atm) {
          this.groupDetails.update(gd => gd ? {
            ...gd,
            clients: [...(gd.clients ?? []), atm as any]
          } : gd);
        }
        this.addingClientId.set(null);
      },
      error: err => {
        this.addingClientId.set(null);
        alert(err?.error?.message ?? 'Erreur lors de l\'ajout');
      }
    });
  }

  // -- Multi-select ----------------------------------------------------------
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

  // -- Bulk add ---------------------------------------------------------------
  addSelectedClients(): void {
    const ids = Array.from(this.selectedClientIds());
    if (ids.length === 0) return;

    this.isAddingBulk.set(true);
    let completed = 0;
    const errors: string[] = [];

    ids.forEach(clientId => {
      this.groupService.addClientToGroup(this.groupId, clientId).subscribe({
        next: () => {
          const atm = this.allAtms().find(a => a.clientId === clientId);
          if (atm) {
            this.groupDetails.update(gd => gd ? {
              ...gd,
              clients: [...(gd.clients ?? []), atm as any]
            } : gd);
          }
          completed++;
          if (completed === ids.length) {
            this.isAddingBulk.set(false);
            this.selectedClientIds.set(new Set());
            this.closeAddModal();
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

  connectableLabel(val: number): string {
    return ['�', 'Non connectable', 'IP Statique', 'IP Dynamique'][val] ?? String(val);
  }
}
