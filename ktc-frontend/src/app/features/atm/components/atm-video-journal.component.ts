import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AtmService } from '../services/atm.service';
import { VideoJournalEventDto } from '../models/atm.models';

@Component({
  selector: 'app-atm-video-journal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './atm-video-journal.component.html',
  styleUrl: './atm-video-journal.component.css'
})
export class AtmVideoJournalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly atmService = inject(AtmService);
  private readonly fb = inject(FormBuilder);

  readonly clientId = computed(() => Number(this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id') ?? 0));

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly rows = signal<VideoJournalEventDto[]>([]);
  readonly selected = signal<VideoJournalEventDto | null>(null);

  readonly selectedMediaUrl = computed(() => {
    const s = this.selected();
    if (!s?.mediaUrl) return null;
    // backend returns relative /api/...; keep it
    return s.mediaUrl;
  });

  readonly isSelectedVideo = computed(() => (this.selected()?.mediaKind ?? '').toLowerCase() === 'video');
  readonly isSelectedImage = computed(() => (this.selected()?.mediaKind ?? '').toLowerCase() === 'image');

  readonly filterForm = this.fb.group({
    from: ['', Validators.required],
    to: ['', Validators.required],
    search: ['']
  });

  ngOnInit(): void {
    const now = new Date();
    this.filterForm.patchValue({
      from: this.toLocalInput(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
      to: this.toLocalInput(now),
      search: ''
    });

    this.refresh();
  }

  refresh(): void {
    const id = this.clientId();
    if (!id || this.filterForm.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    const { from, to, search } = this.filterForm.value;

    this.atmService.searchVideoJournal(id, from!, to!, (search ?? '').trim() || undefined)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.selected.set(rows.length > 0 ? rows[0] : null);
        },
        error: () => {
          this.error.set('Erreur lors du chargement du VideoJournal.');
          this.rows.set([]);
          this.selected.set(null);
        }
      });
  }

  selectRow(r: VideoJournalEventDto): void {
    this.selected.set(r);
  }

  trackByMediaId = (_: number, r: VideoJournalEventDto) => r.mediaId;

  private toLocalInput(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

