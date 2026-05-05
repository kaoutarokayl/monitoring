import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AtmService, AtmUploadDto } from '../services/atm.service';

@Component({
  selector: 'app-atm-uploads',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './atm-uploads.component.html',
  styleUrls: ['./atm-uploads.component.css']
})
export class AtmUploadsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly atmService = inject(AtmService);

  readonly clientId = signal<number | null>(null);
  readonly rows = signal<AtmUploadDto[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly totalCount = computed(() => this.rows().length);

  ngOnInit(): void {
    const idStr = this.route.parent?.snapshot.paramMap.get('id')
      ?? this.route.snapshot.paramMap.get('id');
    const id = idStr ? Number(idStr) : null;
    this.clientId.set(id);
    if (!id) {
      this.error.set('Identifiant ATM invalide.');
      return;
    }
    this.loadUploads(id);
  }

  private loadUploads(clientId: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.rows.set([]);

    this.atmService.getClientUploads(clientId).subscribe({
      next: (items) => {
        const enriched = (items ?? []).map((item) => ({
          ...item,
          fileName: (item.fileName || item.fileLocation.split(/[\\/]/).pop()) ?? item.fileLocation
        }));
        this.rows.set(enriched);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Impossible de charger les uploads.');
        this.isLoading.set(false);
      }
    });
  }

  refresh(): void {
    const id = this.clientId();
    if (!id) return;
    this.loadUploads(id);
  }
}