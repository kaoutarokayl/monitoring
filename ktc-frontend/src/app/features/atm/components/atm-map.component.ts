import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AtmService, ClientAtm } from '../services/atm.service';

// Leaflet is loaded via CDN (add to index.html if not already there):
//   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
//   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
declare const L: any;

@Component({
  selector: 'app-atm-map',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './atm-map.component.html',
  styleUrls: ['./atm-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AtmMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private atmService = inject(AtmService);
  private router     = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────
  atms            = signal<ClientAtm[]>([]);
  isLoading       = signal(true);
  error           = signal<string | null>(null);
  searchQuery     = signal('');
  filterStatus    = signal<'all' | 'active' | 'inactive'>('all');
  selectedAtm     = signal<ClientAtm | null>(null);
  sidebarCollapsed = signal(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  filtered = computed(() => {
    const q      = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    return this.atms().filter(a => {
      const matchQ = !q ||
        a.clientName.toLowerCase().includes(q) ||
        a.networkAddress.includes(q) ||
        String(a.clientId).includes(q);
      const matchS =
        status === 'all' ||
        (status === 'active'   && a.active) ||
        (status === 'inactive' && !a.active);
      return matchQ && matchS;
    });
  });

  totalCount    = computed(() => this.atms().length);
  activeCount   = computed(() => this.atms().filter(a => a.active).length);
  inactiveCount = computed(() => this.atms().filter(a => !a.active).length);

  // ── Leaflet internals ──────────────────────────────────────────────────────
  private map: any;
  private markersLayer: any;
  private markerMap = new Map<number, any>(); // clientId → L.Marker

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.atmService.getClients().subscribe({
      next: data => {
        this.atms.set(data);
        this.isLoading.set(false);
        this.renderMarkers();
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Impossible de charger les ATMs');
        this.isLoading.set(false);
      }
    });
  }

  // ── Map init ───────────────────────────────────────────────────────────────
  private initMap(): void {
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded. Add CDN links to index.html.');
      return;
    }

    this.map = L.map('atm-map', {
      center: [31.7917, -7.0926], // Morocco center
      zoom: 6,
      zoomControl: true
    });

    // Tile layer — OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer = L.featureGroup().addTo(this.map);

    // If data already loaded before map init, render now
    if (this.atms().length > 0) {
      this.renderMarkers();
    }
  }

  // ── Markers ────────────────────────────────────────────────────────────────
  private renderMarkers(): void {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();
    this.markerMap.clear();

    for (const atm of this.atms()) {
      if (!atm.latitude && !atm.longitude) continue; // skip (0,0) entries
      if (atm.latitude === 0 && atm.longitude === 0) continue;

      const color = atm.active ? '#16a34a' : '#dc2626';
      const icon  = this.buildIcon(color);

      const marker = L.marker([atm.latitude, atm.longitude], { icon })
        .bindPopup(this.buildPopupHtml(atm), { maxWidth: 260 })
        .on('click', () => this.selectAtm(atm));

      this.markersLayer.addLayer(marker);
      this.markerMap.set(atm.clientId, marker);
    }

    // Fit bounds if there are markers
    if (this.markersLayer.getLayers().length > 0) {
      this.map.fitBounds(this.markersLayer.getBounds(), { padding: [40, 40] });
    }
  }

  private buildIcon(color: string): any {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="28" height="36">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="14" cy="14" r="5" fill="white"/>
      </svg>`;
    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -36]
    });
  }

  private buildPopupHtml(atm: ClientAtm): string {
    const status = atm.active
      ? `<span style="color:#16a34a;font-weight:700">● Actif</span>`
      : `<span style="color:#dc2626;font-weight:700">● Inactif</span>`;
    const conn = this.connectableLabel(atm.connectable);
    return `
      <div style="font-family:system-ui,sans-serif;min-width:200px">
        <div style="font-weight:900;font-size:14px;margin-bottom:4px">${atm.clientName}</div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:8px">#${atm.clientId}</div>
        <table style="font-size:12px;border-collapse:collapse;width:100%">
          <tr><td style="padding:2px 6px 2px 0;color:#6b7280;font-weight:700">IP</td><td><code style="background:#f3f4f6;padding:1px 4px;border-radius:3px">${atm.networkAddress}</code></td></tr>
          <tr><td style="padding:2px 6px 2px 0;color:#6b7280;font-weight:700">Statut</td><td>${status}</td></tr>
          <tr><td style="padding:2px 6px 2px 0;color:#6b7280;font-weight:700">Conn.</td><td>${conn}</td></tr>
          ${atm.hardwareTypeName ? `<tr><td style="padding:2px 6px 2px 0;color:#6b7280;font-weight:700">HW</td><td>${atm.hardwareTypeName}</td></tr>` : ''}
        </table>
        <div style="margin-top:10px;text-align:right">
          <a href="/admin/atms/${atm.clientId}/edit" style="background:#4f46e5;color:white;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;text-decoration:none">✏️ Modifier</a>
        </div>
      </div>`;
  }

  // ── Public actions ─────────────────────────────────────────────────────────
  selectAtm(atm: ClientAtm): void {
    this.selectedAtm.set(atm);
    const marker = this.markerMap.get(atm.clientId);
    if (marker && this.map) {
      this.map.setView([atm.latitude, atm.longitude], 14, { animate: true });
      marker.openPopup();
    }
  }

  flyTo(atm: ClientAtm): void {
    if (this.map) {
      this.map.flyTo([atm.latitude, atm.longitude], 14, { animate: true, duration: 1 });
    }
    this.selectedAtm.set(atm);
  }

  fitAll(): void {
    if (this.map && this.markersLayer?.getLayers().length > 0) {
      this.map.fitBounds(this.markersLayer.getBounds(), { padding: [40, 40], animate: true });
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
    // Invalidate map size after sidebar animation
    setTimeout(() => this.map?.invalidateSize(), 230);
  }

  goBack(): void   { this.router.navigate(['/admin/atms']); }
  goEdit(id: number): void { this.router.navigate(['/admin/atms', id, 'edit']); }

  connectableLabel(val: number): string {
    return ['—', 'Non connectable', 'IP Statique', 'IP Dynamique'][val] ?? String(val);
  }
}
