import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AtmService,
  CreateRegionRequest,
  BusinessDto
} from '../../atm/services/atm.service';

@Component({
  selector: 'app-region-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './region-form.component.html',
  styleUrls: ['./region-form.component.css']
})
export class RegionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private atmService = inject(AtmService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ── State ─────────────────────────────
  isEdit = signal(false);
  editId = signal<number | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  // ⭐ IMPORTANT : businesses list
  businesses = signal<BusinessDto[]>([]);

  // ── Form ─────────────────────────────
  form: FormGroup = this.fb.group({
    regionName: ['', [Validators.required, Validators.minLength(2)]],
    displayId: [''],
    additionalInfo: [''],

    businessId: [0, [Validators.required, Validators.min(1)]],
    regionLevel: [1, [Validators.required]],
    parentRegionId: [0]
  });

  get f() { return this.form.controls; }

  // ── INIT ─────────────────────────────
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    this.atmService.getBusinesses().subscribe({
      next: (data) => {
        this.businesses.set(data);

        if (idParam) {
          this.isEdit.set(true);
          this.editId.set(Number(idParam));
          this.loadRegion(Number(idParam));
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.error.set('Erreur chargement businesses');
        this.isLoading.set(false);
      }
    });
  }

  // ── LOAD REGION ─────────────────────
  private loadRegion(id: number): void {
    this.atmService.getRegionById(id).subscribe({
      next: (r) => {
        this.form.patchValue({
          regionName: r.regionName,
          displayId: r.displayId,
          additionalInfo: r.additionalInfo ?? '',
          businessId: r.businessId,
          regionLevel: r.regionLevel,
          parentRegionId: r.parentRegionId
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Region introuvable');
        this.isLoading.set(false);
      }
    });
  }

  // ── SUBMIT ───────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.value.businessId === 0) {
      this.error.set("Veuillez sélectionner un business");
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const payload: CreateRegionRequest = {
      regionName: this.form.value.regionName.trim(),
      displayId: this.form.value.displayId?.trim() || null,
      additionalInfo: this.form.value.additionalInfo?.trim() || null,

      businessId: Number(this.form.value.businessId),
      regionLevel: Number(this.form.value.regionLevel),
      parentRegionId: Number(this.form.value.parentRegionId) || 0
    };

    const obs = this.isEdit()
      ? this.atmService.updateRegion(this.editId()!, payload)
      : this.atmService.createRegion(payload);

    obs.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.successMsg.set(res.message);
        setTimeout(() => this.router.navigate(['/admin/regions']), 1000);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.message ?? 'Erreur serveur');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/regions']);
  }
}

