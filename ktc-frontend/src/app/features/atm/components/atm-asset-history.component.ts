import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AtmService, AtmAssetHistoryDto } from '../services/atm.service';

@Component({
  selector: 'app-atm-asset-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atm-asset-history.component.html',
  styleUrls: ['./atm-asset-history.component.css']
})
export class AtmAssetHistoryComponent implements OnInit {
  @Input() clientId?: number;
  
  private route = inject(ActivatedRoute);
  private atmService = inject(AtmService);

  isLoading = signal(true);
  error = signal<string | null>(null);

  historyData = signal<AtmAssetHistoryDto[]>([]);

  ngOnInit(): void {
    let idStr = this.route.snapshot.paramMap.get('id');
    if (!idStr && this.route.parent) {
      idStr = this.route.parent.snapshot.paramMap.get('id');
    }

    const finalId = this.clientId ?? (idStr ? Number(idStr) : null);

    if (finalId) {
      this.loadHistory(finalId);
    } else {
      this.error.set("Aucun identifiant d'ATM fourni.");
      this.isLoading.set(false);
    }
  }

  loadHistory(id: number): void {
    this.isLoading.set(true);
    this.atmService.getAtmAssetHistory(id).subscribe({
      next: (data) => {
        this.historyData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set("Erreur lors de la récupération de l'historique.");
        this.isLoading.set(false);
      }
    });
  }
}

