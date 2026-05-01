import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AtmService, ClientAtm, BusinessDto, BranchDto, HardwareTypeDto, LastClientContactDto } from '../services/atm.service';

@Component({
  selector: 'app-atm-general',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atm-general.component.html',
  styleUrls: ['./atm-general.component.css']
})
export class AtmGeneralComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private atmService = inject(AtmService);

  // ── State ──────────────────────────────────────────────────────────────────
  atmId = signal<number | null>(null);
  atm = signal<ClientAtm | null>(null);
  lastClientContact = signal<LastClientContactDto | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  businesses = signal<BusinessDto[]>([]);
  branches = signal<BranchDto[]>([]);
  hardwareTypes = signal<HardwareTypeDto[]>([]);

  // ── Computed helpers ───────────────────────────────────────────────────────
  businessName = (): string => {
    const bId = this.atm()?.businessId;
    if (!bId) return 'N/A';
    const b = this.businesses().find(x => x.businessId === bId);
    return b?.businessName ?? 'N/A';
  };

  branchName = (): string => {
    const brId = this.atm()?.branchId;
    if (!brId) return 'N/A';
    const br = this.branches().find(x => x.branchId === brId);
    return br?.branchName ?? 'N/A';
  };

  hardwareTypeName = (): string => {
    const hwId = this.atm()?.hardwareTypeId;
    if (!hwId) return 'N/A';
    const hw = this.hardwareTypes().find(x => x.hardwareTypeId === hwId);
    return hw?.name ?? 'N/A';
  };

  connectivityLabel = (): string => {
    const conn = this.atm()?.connectable;
    const labels: { [key: number]: string } = {
      1: 'Non connectable',
      2: 'IP Statique',
      3: 'IP Dynamique'
    };
    return labels[conn ?? 0] ?? 'N/A';
  };

  googleMapsUrl = (): string => {
    const lat = this.atm()?.latitude;
    const lng = this.atm()?.longitude;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  ngOnInit(): void {
    const idParam = this.route.parent?.snapshot.paramMap.get('id');
    if (idParam) {
      this.atmId.set(Number(idParam));
      this.loadData();
    } else {
      this.router.navigate(['/admin/atms']);
    }
  }

  ngOnDestroy(): void {
    // Cleanup si nécessaire
  }

  loadData(): void {
    // Charger les données de référence + l'ATM en parallèle
    if (this.atmId()) {
      forkJoin({
        businesses: this.atmService.getBusinesses().pipe(catchError(() => of([]))),
        branches: this.atmService.getBranches().pipe(catchError(() => of([]))),
        hardwareTypes: this.atmService.getHardwareTypes().pipe(catchError(() => of([]))),
        atm: this.atmService.getClientById(this.atmId()!),
        lastContact: this.atmService.getLastClientContact(this.atmId()!).pipe(catchError(() => of(null)))
      }).subscribe({
        next: ({ businesses, branches, hardwareTypes, atm, lastContact }) => {
          this.businesses.set(businesses);
          this.branches.set(branches);
          this.hardwareTypes.set(hardwareTypes);
          this.atm.set(atm);
          this.lastClientContact.set(lastContact);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('ATM introuvable ou erreur de chargement');
          this.isLoading.set(false);
        }
      });
    }
  }

  isRecentContact(timestmp?: string | null): boolean {
    if (!timestmp) return false;
    const lastContact = new Date(timestmp);
    const now = new Date();
    const diffHours = (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  }

  formattedComments(): string {
    const raw = this.atm()?.comments;
    if (!raw) return '';

    const parsed = new DOMParser().parseFromString(raw, 'application/xml');
    if (parsed.querySelector('parsererror')) {
      return raw;
    }

    const commentNode = parsed.querySelector('Comment');
    if (commentNode) {
      const user = commentNode.getAttribute('User');
      const timestamp = commentNode.getAttribute('Timestamp');
      const text = commentNode.textContent?.trim() ?? '';

      const meta = [user, timestamp].filter(Boolean).join(' | ');
      return meta ? `${meta} - ${text}` : text;
    }

    return parsed.documentElement?.textContent?.trim() || raw;
  }

  goEdit(): void {
    if (this.atmId()) {
      this.router.navigate(['/admin/atms', this.atmId(), 'edit']);
    }
  }
}