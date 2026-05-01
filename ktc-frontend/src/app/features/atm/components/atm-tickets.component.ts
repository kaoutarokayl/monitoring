import { Component, Input, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AtmService, AtmTicketDto } from '../services/atm.service';

@Component({
  selector: 'app-atm-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './atm-tickets.component.html',
  styleUrls: ['./atm-tickets.component.css']
})
export class AtmTicketsComponent implements OnInit {
  @Input() clientId?: number;

  private route = inject(ActivatedRoute);
  private atmService = inject(AtmService);

  // ── State ──────────────────────────────────────────────────────────────
  atmId = signal<number | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Filter signals
  daysFilter = signal(14);
  statusFilter = signal('All');
  
  // Data signal
  tickets = signal<AtmTicketDto[]>([]);

  // Computed values
  displayedTickets = computed(() => {
    return this.tickets();
  });

  // Effect to reload tickets when filters or atmId change
  private ticketsEffect = effect(() => {
    const id = this.atmId();
    // Access filter signals to create dependency
    this.daysFilter();
    this.statusFilter();
    
    if (id) {
      this.loadTickets();
    }
  });

  // Accessors for ngModel compatibility
  get daysFilterValue(): number {
    return this.daysFilter();
  }

  set daysFilterValue(value: number) {
    this.daysFilter.set(value);
  }

  get statusFilterValue(): string {
    return this.statusFilter();
  }

  set statusFilterValue(value: string) {
    this.statusFilter.set(value);
  }

  ngOnInit(): void {
    // Extract ATM ID from route
    let idStr = this.route.snapshot.paramMap.get('id');
    if (!idStr && this.route.parent) {
      idStr = this.route.parent.snapshot.paramMap.get('id');
    }

    const finalId = this.clientId ?? (idStr ? Number(idStr) : null);
    if (finalId) {
      this.atmId.set(finalId);
      // Effect will be triggered automatically by setting atmId
    } else {
      this.error.set("Aucun identifiant d'ATM fourni.");
      this.isLoading.set(false);
    }
  }

  loadTickets(): void {
    const id = this.atmId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.atmService.getAtmTickets(id, this.daysFilter(), this.statusFilter()).subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement tickets:', err);
        this.error.set("Erreur lors de la récupération des tickets.");
        this.isLoading.set(false);
      }
    });
  }

  // Helper to format duration
  formatDuration(duration: string | null | undefined): string {
    if (!duration) return '-';
    return duration;
  }

  // Helper to display safe text values
  displayValue(value: string | null | undefined): string {
    if (!value || !value.trim()) return 'N/A';
    return value;
  }

  // Helper to get status badge class
  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() ?? '';
    if (statusLower.includes('closed')) return 'status-closed';
    if (statusLower.includes('dispatched')) return 'status-dispatched';
    if (statusLower.includes('open')) return 'status-open';
    return 'status-unknown';
  }

  // Helper to format date
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  // Helper to format closed status
  formatClosed(isClosed: boolean): string {
    return isClosed ? '✓ Oui' : '-';
  }
}
