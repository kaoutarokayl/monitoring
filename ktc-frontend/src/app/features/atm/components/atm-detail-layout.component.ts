import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AtmService, ClientAtm } from '../services/atm.service';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-atm-detail-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './atm-detail-layout.component.html',
  styleUrls: ['./atm-detail-layout.component.css']
})
export class AtmDetailLayoutComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private atmService = inject(AtmService);
  private layoutService = inject(LayoutService);

  atmId = signal<number | null>(null);
  atm = signal<ClientAtm | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    // Minimiser la sidebar automatiquement quand on entre dans les détails ATM
    this.layoutService.setSidebarCollapsed(true);

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.atmId.set(Number(idParam));
      this.loadAtm();
    } else {
      this.router.navigate(['/admin/atms']);
    }
  }

  ngOnDestroy(): void {
    // Restaurer la sidebar à la sortie des détails
    this.layoutService.setSidebarCollapsed(false);
  }

  loadAtm(): void {
    const id = this.atmId();
    if (!id) return;
    this.atmService.getClientById(id).subscribe({
      next: (data) => {
        this.atm.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set("ATM introuvable");
        this.isLoading.set(false);
      }
    });
  }
}

