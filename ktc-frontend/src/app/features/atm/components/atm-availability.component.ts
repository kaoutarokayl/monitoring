import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AtmService } from '../services/atm.service';
import { AtmAvailabilityReportDto } from '../models/atm.models';

@Component({
  selector: 'app-atm-availability',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './atm-availability.component.html',
  styleUrl: './atm-availability.component.css'
})
export class AtmAvailabilityComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly atmService = inject(AtmService);
  private readonly fb = inject(FormBuilder);

  readonly clientId = computed(() => Number(this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id') ?? 0));

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly report = signal<AtmAvailabilityReportDto | null>(null);

  readonly filterForm = this.fb.group({
    from: ['', Validators.required],
    to: ['', Validators.required]
  });

  ngOnInit(): void {
    const now = new Date();
    this.filterForm.patchValue({
      from: this.toLocalInput(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
      to: this.toLocalInput(now)
    });
    this.refresh();
  }

  refresh(): void {
    const id = this.clientId();
    if (!id || this.filterForm.invalid) return;

    const { from, to } = this.filterForm.value;
    this.isLoading.set(true);
    this.error.set(null);

    this.atmService.getAvailability(id, from!, to!)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (r) => this.report.set(r),
        error: () => this.error.set('Erreur lors du chargement du rapport Availability.')
      });
  }

  pctWidth(p: number): string {
    const v = Math.max(0, Math.min(100, Number(p ?? 0)));
    return `${v}%`;
  }

  private toLocalInput(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

