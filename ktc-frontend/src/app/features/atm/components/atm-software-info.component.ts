import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AtmService, AtmSoftwareInfoDto } from '../services/atm.service';

@Component({
  selector: 'app-atm-software-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atm-software-info.component.html',
  styleUrls: ['./atm-software-info.component.css']
})
export class AtmSoftwareInfoComponent implements OnInit {
  @Input() clientId?: number;

  private route = inject(ActivatedRoute);
  private atmService = inject(AtmService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  softwareData = signal<AtmSoftwareInfoDto[]>([]);
  groupedSoftware = computed(() => {
    const order = [
      'KALSoftware',
      'Microsoft Hot Fix',
      'MSI Installed Program',
      'Operating System Info',
      'Hypervisor',
      'Other'
    ];

    const groups = new Map<string, AtmSoftwareInfoDto[]>();
    for (const item of this.softwareData()) {
      const type = this.normalizeType(item.installTypeLabel);
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(item);
    }

    return Array.from(groups.entries())
      .map(([type, items]) => ({
        type,
        items: [...items].sort((a, b) => {
          const dateA = new Date(a.installDate).getTime();
          const dateB = new Date(b.installDate).getTime();
          if (dateA !== dateB) return dateB - dateA;
          return a.softwareName.localeCompare(b.softwareName);
        })
      }))
      .sort((a, b) => {
        const indexA = order.indexOf(a.type);
        const indexB = order.indexOf(b.type);
        const safeA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        const safeB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        if (safeA !== safeB) return safeA - safeB;
        return a.type.localeCompare(b.type);
      });
  });

  ngOnInit(): void {
    let idStr = this.route.snapshot.paramMap.get('id');
    if (!idStr && this.route.parent) {
      idStr = this.route.parent.snapshot.paramMap.get('id');
    }

    const finalId = this.clientId ?? (idStr ? Number(idStr) : null);

    if (finalId) {
      this.loadSoftwareInfo(finalId);
    } else {
      this.error.set("Aucun identifiant d'ATM fourni.");
      this.isLoading.set(false);
    }
  }

  loadSoftwareInfo(id: number): void {
    this.isLoading.set(true);
    this.atmService.getAtmSoftwareInfo(id).subscribe({
      next: (data) => {
        this.softwareData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Erreur lors de la récupération des logiciels installés.');
        this.isLoading.set(false);
      }
    });
  }

  private normalizeType(typeLabel: string | null | undefined): string {
    const value = (typeLabel ?? '').trim().toLowerCase();
    if (value === 'ktc software package' || value === 'kalsoftware') return 'KALSoftware';
    if (value === 'windows hotfix' || value === 'microsoft hot fix') return 'Microsoft Hot Fix';
    if (value === 'msi installed program') return 'MSI Installed Program';
    if (value === 'operating system' || value === 'operating system info') return 'Operating System Info';
    if (value === 'hypervisor') return 'Hypervisor';
    return 'Other';
  }
}
