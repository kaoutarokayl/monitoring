import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AtmCertificateDto, AtmService } from '../services/atm.service';

@Component({
  selector: 'app-atm-certificates',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atm-certificates.component.html',
  styleUrls: ['./atm-certificates.component.css']
})
export class AtmCertificatesComponent implements OnInit {
  @Input() clientId?: number;

  private route = inject(ActivatedRoute);
  private atmService = inject(AtmService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  certificates = signal<AtmCertificateDto[]>([]);

  ngOnInit(): void {
    let idStr = this.route.snapshot.paramMap.get('id');
    if (!idStr && this.route.parent) {
      idStr = this.route.parent.snapshot.paramMap.get('id');
    }

    const finalId = this.clientId ?? (idStr ? Number(idStr) : null);
    if (finalId) {
      this.loadCertificates(finalId);
    } else {
      this.error.set("Aucun identifiant d'ATM fourni.");
      this.isLoading.set(false);
    }
  }

  loadCertificates(id: number): void {
    this.isLoading.set(true);
    this.atmService.getAtmCertificates(id).subscribe({
      next: (data) => {
        this.certificates.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Erreur lors de la récupération des certificats.');
        this.isLoading.set(false);
      }
    });
  }
}
