import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AtmService,
  BusinessDto,
  BranchDto,
  HardwareTypeDto,
  CreateOrUpdateAtmRequest
} from '../services/atm.service';

// Leaflet loaded via CDN in index.html
declare const L: any;

@Component({
  selector: 'app-atm-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './atm-form.component.html',
  styleUrls: ['./atm-form.component.css']
})
export class AtmFormComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private atmService = inject(AtmService);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);

  // ── State ──────────────────────────────────────────────────────────────────
  isEdit        = signal(false);
  editId        = signal<number | null>(null);
  isLoading     = signal(true);
  isSaving      = signal(false);
  error         = signal<string | null>(null);
  successMsg    = signal<string | null>(null);

  businesses    = signal<BusinessDto[]>([]);
  branches      = signal<BranchDto[]>([]);
  hardwareTypes = signal<HardwareTypeDto[]>([]);

  // ── Map picker state ───────────────────────────────────────────────────────
  mapPickerOpen = signal(false);
  pickedLat     = signal<number | null>(null);
  pickedLng     = signal<number | null>(null);

  private pickerMap: any    = null;
  private pickerMarker: any = null;

  // ── Computed helpers ───────────────────────────────────────────────────────
  hasCoords = computed(() => {
    const lat = this.form.value.latitude;
    const lng = this.form.value.longitude;
    return lat && lng && !(lat === 0 && lng === 0);
  });

  googleMapsUrl = computed(() => {
    const lat = this.form.value.latitude;
    const lng = this.form.value.longitude;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  });

  // ── Form ───────────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    clientName:     ['', [Validators.required, Validators.minLength(2)]],
    networkAddress: ['', [Validators.required]],
    connectable:    [1,  [Validators.required]],
    active:         [true],
    detailsUnknown: [false],
    latitude:       [0,  [Validators.required, Validators.min(-90),  Validators.max(90)]],
    longitude:      [0,  [Validators.required, Validators.min(-180), Validators.max(180)]],
    timezone:       ['UTC', [Validators.required]],
    comments:       [''],
    clientType:     [1],
    gridPosition:   [0],
    businessId:     [0],
    branchId:       [0],
    hardwareTypeId: [0],
    ownerId:        [0],
    deleteLater:    [false],
    subnet:         [''],
    level1RegionId: [0],
    level2RegionId: [0],
    level3RegionId: [0],
    level4RegionId: [0],
    level5RegionId: [0],
    salt:           [''],
    authHash:       [''],
    hypervisorActive: [false],
    mergeToClientId:  [0],
    featureFlags:     ['']
  });

  get f() { return this.form.controls; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.editId.set(Number(idParam));
    }

    forkJoin({
      businesses:    this.atmService.getBusinesses(),
      hardwareTypes: this.atmService.getHardwareTypes(),
      branches:      this.atmService.getBranches()
    }).subscribe({
      next: ({ businesses, hardwareTypes, branches }) => {
        this.businesses.set(businesses);
        this.hardwareTypes.set(hardwareTypes);
        this.branches.set(branches);

        if (this.isEdit() && this.editId()) {
          this.atmService.getClientById(this.editId()!).subscribe({
            next: atm => {
              this.form.patchValue({
                clientName:     atm.clientName,
                networkAddress: atm.networkAddress,
                connectable:    atm.connectable,
                active:         atm.active,
                detailsUnknown: atm.detailsUnknown,
                latitude:       atm.latitude,
                longitude:      atm.longitude,
                timezone:       atm.timezone,
                comments:       atm.comments ?? '',
                clientType:     atm.clientType,
                businessId:     atm.businessId,
                branchId:       atm.branchId,
                hardwareTypeId: atm.hardwareTypeId
              });
              this.isLoading.set(false);
            },
            error: () => {
              this.error.set('ATM introuvable');
              this.isLoading.set(false);
            }
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.error.set('Impossible de charger les données de référence');
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyPickerMap();
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.successMsg.set(null);

    const payload: CreateOrUpdateAtmRequest = {
      ...this.form.value,
      connectable:    Number(this.form.value.connectable),
      businessId:     Number(this.form.value.businessId),
      branchId:       Number(this.form.value.branchId),
      hardwareTypeId: Number(this.form.value.hardwareTypeId)
    };

    const obs = this.isEdit()
      ? this.atmService.updateClient(this.editId()!, payload)
      : this.atmService.createClient(payload);

    obs.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.successMsg.set(res.message);
        setTimeout(() => this.router.navigate(['/admin/atms']), 1000);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.message ?? 'Erreur lors de l\'enregistrement');
      }
    });
  }

  cancel(): void {
    if (this.isEdit() && this.editId()) {
      // Si édition, retourner à la page détail (onglet Général)
      this.router.navigate(['/admin/atms', this.editId(), 'general']);
    } else {
      // Si création, retourner à la liste
      this.router.navigate(['/admin/atms']);
    }
  }

  // ── Map Picker ─────────────────────────────────────────────────────────────

  openMapPicker(): void {
    // Seed picked coords from form (if non-zero)
    const lat = Number(this.form.value.latitude);
    const lng = Number(this.form.value.longitude);
    const hasExisting = lat !== 0 || lng !== 0;

    this.pickedLat.set(hasExisting ? lat : null);
    this.pickedLng.set(hasExisting ? lng : null);
    this.mapPickerOpen.set(true);

    // Init map after Angular renders the modal div
    setTimeout(() => this.initPickerMap(hasExisting ? lat : null, hasExisting ? lng : null), 50);
  }

  closeMapPicker(): void {
    this.mapPickerOpen.set(false);
    this.destroyPickerMap();
  }

  confirmMapPick(): void {
    if (this.pickedLat() === null || this.pickedLng() === null) return;
    this.form.patchValue({
      latitude:  this.pickedLat(),
      longitude: this.pickedLng()
    });
    this.form.get('latitude')!.markAsTouched();
    this.form.get('longitude')!.markAsTouched();
    this.closeMapPicker();
  }

  // ── Picker map internals ───────────────────────────────────────────────────

  private initPickerMap(initLat: number | null, initLng: number | null): void {
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded. Add CDN links to index.html.');
      return;
    }

    const centerLat = initLat ?? 31.7917;  // Morocco center fallback
    const centerLng = initLng ?? -7.0926;
    const zoom      = (initLat !== null) ? 13 : 6;

    this.pickerMap = L.map('picker-map', {
      center: [centerLat, centerLng],
      zoom,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.pickerMap);

    // Place existing marker if coords provided
    if (initLat !== null && initLng !== null) {
      this.placeMarker(initLat, initLng);
    }

    // Click to place / move marker
    this.pickerMap.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.placeMarker(lat, lng);
      this.pickedLat.set(parseFloat(lat.toFixed(6)));
      this.pickedLng.set(parseFloat(lng.toFixed(6)));
    });
  }

  private placeMarker(lat: number, lng: number): void {
    const icon = L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="28" height="36">
               <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
                     fill="#4f46e5" stroke="white" stroke-width="2"/>
               <circle cx="14" cy="14" r="5" fill="white"/>
             </svg>`,
      className: '',
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -36]
    });

    if (this.pickerMarker) {
      this.pickerMarker.setLatLng([lat, lng]);
    } else {
      this.pickerMarker = L.marker([lat, lng], { icon, draggable: true })
        .addTo(this.pickerMap)
        .bindPopup('📍 Position sélectionnée')
        .openPopup();

      // Allow drag to fine-tune position
      this.pickerMarker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        this.pickedLat.set(parseFloat(pos.lat.toFixed(6)));
        this.pickedLng.set(parseFloat(pos.lng.toFixed(6)));
      });
    }
  }

  private destroyPickerMap(): void {
    if (this.pickerMarker) {
      this.pickerMarker.remove();
      this.pickerMarker = null;
    }
    if (this.pickerMap) {
      this.pickerMap.remove();
      this.pickerMap = null;
    }
  }

  // ── Geocoding (Nominatim / OpenStreetMap — gratuit, sans clé) ─────────────
  geocodeAddress(address: string): void {
    if (!address.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    fetch(url, { headers: { 'Accept-Language': 'fr' } })
      .then(r => r.json())
      .then((results: any[]) => {
        if (!results.length) {
          alert('Adresse introuvable. Essayez un terme plus précis.');
          return;
        }
        const { lat, lon } = results[0];
        const numLat = parseFloat(parseFloat(lat).toFixed(6));
        const numLng = parseFloat(parseFloat(lon).toFixed(6));
        this.pickerMap.setView([numLat, numLng], 14, { animate: true });
        this.placeMarker(numLat, numLng);
        this.pickedLat.set(numLat);
        this.pickedLng.set(numLng);
      })
      .catch(() => alert('Erreur lors de la recherche d\'adresse.'));
  }
}
