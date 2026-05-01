import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AtmService, AtmComponentStatusDto } from '../services/atm.service';
import { AppCountersTableComponent } from './app-counters-table.component';
import { ReplenishmentTableComponent } from './replenishment-table.component';
import { XfsCountersComponent } from './xfs-counters.component';

type StatusSubTabId = 'details' | 'status' | 'app-counters' | 'replenishment' | 'xfs-counters';

type ComponentSubTab = {
  id: StatusSubTabId;
  label: string;
};

type ComponentTabRule = {
  matcher: RegExp;
  tabs: ComponentSubTab[];
};

type ComponentSummary = {
  id: number;
  name: string;
  displayName: string;
  globalSeverity: string;
  tabs: ComponentSubTab[];
};

const DEFAULT_TABS: ComponentSubTab[] = [
  { id: 'details', label: 'Details' }
];

const COMPONENT_TAB_RULES: ComponentTabRule[] = [
  {
    matcher: /kxcardreader/i,
    tabs: [
      { id: 'details', label: 'Details' },
      { id: 'app-counters', label: 'Application Counters' },
      { id: 'replenishment', label: 'Replenishment' }
    ]
  },
  {
    matcher: /kxreceiptprinter/i,
    tabs: [
      { id: 'details', label: 'Details' },
      { id: 'app-counters', label: 'Application Counters' },
      { id: 'replenishment', label: 'Replenishment' }
    ]
  },
  {
    matcher: /kxcashacceptor/i,
    tabs: [
      { id: 'status', label: 'Status' },
      { id: 'app-counters', label: 'Application Counters' },
      { id: 'replenishment', label: 'Replenishment' },
      { id: 'xfs-counters', label: 'XFS Counters' }
    ]
  },
  {
    matcher: /kxcashdispenser/i,
    tabs: [
      { id: 'status', label: 'Status' },
      { id: 'app-counters', label: 'Application Counters' },
      { id: 'replenishment', label: 'Replenishment' },
      { id: 'xfs-counters', label: 'XFS Counters' }
    ]
  },
  {
    matcher: /bundlecheckscanner|checkacceptor/i,
    tabs: [
      { id: 'status', label: 'Status' },
      { id: 'xfs-counters', label: 'XFS Counters' }
    ]
  }
];

@Component({
  selector: 'app-atm-status',
  standalone: true,
  imports: [
    CommonModule,
    AppCountersTableComponent,
    ReplenishmentTableComponent,
    XfsCountersComponent
  ],
  templateUrl: './atm-status.component.html',
  styleUrls: ['./atm-status.component.css']
})
export class AtmStatusComponent implements OnInit {
  @Input() clientId?: number;
  
  private route = inject(ActivatedRoute);
  private atmService = inject(AtmService);

  isLoading = signal(true);
  error = signal<string | null>(null);

  rawStatus = signal<AtmComponentStatusDto[]>([]);
  selectedComponent = signal<string | null>(null);
  activeSubTab = signal<StatusSubTabId>('details');
  resolvedClientId = signal<number | null>(null);

  // Compute unique components and their worst severity
  uniqueComponents = computed<ComponentSummary[]>(() => {
    const statusList = this.rawStatus();
    const componentRows = new Map<string, AtmComponentStatusDto[]>();

    for (const row of statusList) {
      if (!componentRows.has(row.componentName)) {
        componentRows.set(row.componentName, []);
      }

      componentRows.get(row.componentName)!.push(row);
    }

    return Array.from(componentRows.entries())
      .map(([componentName, rows]) => ({
        id: rows[0]?.componentId ?? 0,
        name: componentName,
        displayName: this.formatComponentName(componentName),
        globalSeverity: this.computeComponentSeverity(rows),
        tabs: this.getTabsForComponent(componentName)
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  });

  selectedComponentSummary = computed(() =>
    this.uniqueComponents().find(component => component.name === this.selectedComponent()) ?? null
  );

  availableSubTabs = computed(() => this.selectedComponentSummary()?.tabs ?? DEFAULT_TABS);

  selectedComponentDisplayLabel = computed(() => {
    const selectedTab = this.availableSubTabs().find(tab => tab.id === this.activeSubTab());
    return selectedTab?.label ?? 'Details';
  });

  formatComponentName(name: string): string {
    if (!name) return '';
    let formatted = name;
    
    // Supprimer les préfixes techniques
    formatted = formatted.replace(/^KXDevice\.KX/, '');
    formatted = formatted.replace(/^KXDevice\./, '');
    formatted = formatted.replace(/^Win32_/, '');
    
    // Remplacer les points restants par des tirets
    formatted = formatted.replace(/\./g, ' - ');
    
    // Ajouter des espaces pour le CamelCase (ex: CardReader -> Card Reader, ICCard -> IC Card)
    formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    
    return formatted.trim();
  }

  // Group properties by category for the selected component
  selectedComponentPropertiesGrouped = computed(() => {
    const selected = this.selectedComponentSummary()?.name;
    if (!selected) return [];
    
    const props = this.rawStatus().filter(s => s.componentName === selected);
    
    const groups = new Map<string, AtmComponentStatusDto[]>();
    for (const prop of props) {
      const cat = prop.propertyCategory || 'Général';
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)!.push(prop);
    }
    
    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items
    })).sort((a, b) => a.category.localeCompare(b.category));
  });

  ngOnInit(): void {
    // Try to get from Input, then current route, then parent route
    let idStr = this.route.snapshot.paramMap.get('id');
    if (!idStr && this.route.parent) {
      idStr = this.route.parent.snapshot.paramMap.get('id');
    }

    const finalId = this.clientId ?? (idStr ? Number(idStr) : null);
    this.resolvedClientId.set(finalId);

    if (finalId) {
      this.loadStatus(finalId);
      this.route.queryParamMap.subscribe(params => {
        const requested = (params.get('component') || '').trim().toLowerCase();
        if (!requested) return;
        const match = this.uniqueComponents().find(c =>
          c.name.toLowerCase() === requested ||
          c.displayName.toLowerCase() === requested ||
          c.displayName.toLowerCase().includes(requested)
        );
        if (match) {
          this.selectComponent(match.name);
        }
      });
    } else {
      this.error.set("Aucun identifiant d'ATM fourni.");
      this.isLoading.set(false);
    }
  }

  loadStatus(id: number): void {
    this.isLoading.set(true);
    this.atmService.getAtmStatus(id).subscribe({
      next: (data) => {
        this.rawStatus.set(data);
        if (data.length > 0) {
          const firstComponent = this.uniqueComponents()[0];
          if (firstComponent) {
            this.selectedComponent.set(firstComponent.name);
            this.activeSubTab.set(firstComponent.tabs[0]?.id ?? 'details');
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set("Erreur lors de la récupération du statut.");
        this.isLoading.set(false);
      }
    });
  }

  selectComponent(name: string): void {
    this.selectedComponent.set(name);
    const summary = this.uniqueComponents().find(component => component.name === name);
    this.activeSubTab.set(summary?.tabs[0]?.id ?? 'details');
  }

  selectSubTab(subTab: StatusSubTabId): void {
    this.activeSubTab.set(subTab);
  }

  getSeverityClass(severity: string | undefined | null): string {
    if (!severity) return 'status-gray';
    switch (severity.toUpperCase()) {
      case 'OK': return 'status-green';
      case 'WARNING': return 'status-orange';
      case 'CRITICAL': return 'status-red';
      default: return 'status-gray';
    }
  }

  private getWorstSeverity(sev1: string, sev2: string): string {
    const levels: Record<string, number> = { 'OK': 0, 'WARNING': 1, 'CRITICAL': 2, 'UNKNOWN': -1 };
    const val1 = levels[sev1?.toUpperCase() || 'UNKNOWN'] ?? -1;
    const val2 = levels[sev2?.toUpperCase() || 'UNKNOWN'] ?? -1;
    
    if (val1 >= val2) return sev1?.toUpperCase() || 'UNKNOWN';
    return sev2?.toUpperCase() || 'UNKNOWN';
  }

  private getTabsForComponent(componentName: string): ComponentSubTab[] {
    return COMPONENT_TAB_RULES.find(rule => rule.matcher.test(componentName))?.tabs ?? DEFAULT_TABS;
  }

  private computeComponentSeverity(rows: AtmComponentStatusDto[]): string {
    if (rows.length === 0) {
      return 'UNKNOWN';
    }

    const deviceStatus = this.findPropertyValue(rows, 'devicestatus');
    const detailedDeviceStatus = this.findPropertyValue(rows, 'detaileddevicestatus');
    const dispenserStatus = this.findPropertyValue(rows, 'dispenserstatus');

    // Explicit "no device / no data" stays gray.
    if (this.hasNoDataState(deviceStatus) && this.hasNoDataState(detailedDeviceStatus)) {
      return 'UNKNOWN';
    }

    // If we don't have canonical keys, fallback to any status-like property for this component.
    const fallbackStatusValue = this.findAnyStatusValue(rows);
    const effectiveDeviceStatus = deviceStatus ?? fallbackStatusValue;

    if (this.hasErrorState(detailedDeviceStatus)) {
      return 'CRITICAL';
    }

    const isDeviceHealthy = this.hasHealthyState(effectiveDeviceStatus);
    const isDispenserYellow = this.hasYellowState(dispenserStatus);

    if (isDeviceHealthy && isDispenserYellow) {
      return 'WARNING';
    }

    if (isDeviceHealthy) {
      return 'OK';
    }

    if (this.hasErrorState(effectiveDeviceStatus)) {
      return 'CRITICAL';
    }

    if (this.hasYellowState(effectiveDeviceStatus)) {
      return 'WARNING';
    }

    return 'UNKNOWN';
  }

  private findPropertyValue(rows: AtmComponentStatusDto[], propertyKey: string): string | null {
    const normalizedKey = this.normalizeKey(propertyKey);
    const match = rows.find(row => {
      const normalized = this.normalizeKey(row.propertyName);
      // Match both exact keys and "St..." prefixed variants from KX statuses.
      return normalized === normalizedKey
        || normalized.endsWith(normalizedKey)
        || normalized.includes(normalizedKey);
    });
    return match?.value ?? null;
  }

  private findAnyStatusValue(rows: AtmComponentStatusDto[]): string | null {
    const statusRow = rows.find(row => {
      const key = this.normalizeKey(row.propertyName);
      return key.includes('status') && (this.hasHealthyState(row.value) || this.hasYellowState(row.value) || this.hasErrorState(row.value) || this.hasNoDataState(row.value));
    });

    return statusRow?.value ?? null;
  }

  private normalizeKey(value: string): string {
    return (value ?? '').toLowerCase().replace(/[\s_\-.]/g, '');
  }

  private hasHealthyState(value: string | null): boolean {
    const normalized = (value ?? '').toLowerCase();
    return normalized.includes('healthy') || normalized.includes('ok');
  }

  private hasYellowState(value: string | null): boolean {
    const normalized = (value ?? '').toLowerCase();
    return normalized.includes('yellow') || normalized.includes('warning') || normalized.includes('degraded');
  }

  private hasErrorState(value: string | null): boolean {
    const normalized = (value ?? '').toLowerCase();
    return normalized.includes('hardware error')
      || normalized.includes('error')
      || normalized.includes('fault')
      || normalized.includes('failed')
      || normalized.includes('critical');
  }

  private hasNoDataState(value: string | null): boolean {
    const normalized = (value ?? '').toLowerCase();
    return normalized.includes('nodevice')
      || normalized.includes('no device')
      || normalized.includes('nodata')
      || normalized.includes('no data')
      || normalized.includes('unknown');
  }
}

