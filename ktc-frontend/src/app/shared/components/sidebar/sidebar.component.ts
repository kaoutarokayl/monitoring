import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { LayoutService } from '../../../core/services/layout.service';

interface GroupDto {
  groupId: number;
  groupName: string;
  groupTypeId: number;
}

interface ClientSimpleDto {
  clientId: number;
  clientName: string;
  networkAddress: string;
  active: boolean;
  branchId?: number;
  businessId?: number;
}

interface GroupDetailsDto extends GroupDto {
  clients: ClientSimpleDto[];
}

interface BusinessNode {
  businessId: number;
  businessName: string;
  branches: BranchNode[];
}

interface BranchNode {
  branchId: number;
  branchName: string;
  clients: ClientSimpleDto[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  private apiBase = 'http://localhost:5239/api';

  activeTab = signal<'groups' | 'hierarchy'>('groups');

  // GROUPS
  groups         = signal<GroupDto[]>([]);
  expandedGroups = signal<Set<number>>(new Set());
  groupClients   = signal<Map<number, ClientSimpleDto[]>>(new Map());
  loadingGroups  = signal(false);
  loadingGroupId = signal<number | null>(null);

  // HIERARCHY
  businesses         = signal<BusinessNode[]>([]);
  expandedBusinesses = signal<Set<number>>(new Set());
  expandedBranches   = signal<Set<number>>(new Set());
  loadingHierarchy   = signal(false);

  constructor(
    private http: HttpClient,
    public layoutService: LayoutService
  ) {}

  ngOnInit() {
    this.loadGroups();
  }

  setTab(tab: 'groups' | 'hierarchy') {
    this.activeTab.set(tab);
    if (tab === 'hierarchy' && this.businesses().length === 0) {
      this.loadHierarchy();
    }
  }

  // ───────── GROUPS ─────────
  loadGroups() {
    this.loadingGroups.set(true);

    this.http.get<GroupDto[]>(`${this.apiBase}/group`).subscribe({
      next: (data) => {
        this.groups.set(data);
        this.loadingGroups.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement groupes:', err);
        this.loadingGroups.set(false);
      }
    });
  }

  toggleGroup(groupId: number) {
    const expanded = new Set(this.expandedGroups());

    if (expanded.has(groupId)) {
      expanded.delete(groupId);
    } else {
      expanded.add(groupId);

      if (!this.groupClients().has(groupId)) {
        this.loadGroupClients(groupId);
      }
    }

    this.expandedGroups.set(expanded);
  }

  loadGroupClients(groupId: number) {
    this.loadingGroupId.set(groupId);

    this.http.get<GroupDetailsDto>(`${this.apiBase}/group/${groupId}`).subscribe({
      next: (data) => {
        const map = new Map(this.groupClients());
        map.set(groupId, data.clients ?? []);
        this.groupClients.set(map);
        this.loadingGroupId.set(null);
      },
      error: (err) => {
        console.error('Erreur chargement clients groupe:', err);
        this.loadingGroupId.set(null);
      }
    });
  }

  isGroupExpanded(groupId: number) {
    return this.expandedGroups().has(groupId);
  }

  getGroupClients(groupId: number): ClientSimpleDto[] {
    return this.groupClients().get(groupId) ?? [];
  }

  // ───────── HIERARCHY ─────────
  loadHierarchy() {
    this.loadingHierarchy.set(true);

    forkJoin({
      businesses: this.http.get<any[]>(`${this.apiBase}/atm/businesses`),
      branches:   this.http.get<any[]>(`${this.apiBase}/atm/branches`),
      clients:    this.http.get<any[]>(`${this.apiBase}/atm/clients`)
    }).subscribe({
      next: ({ businesses, branches, clients }) => {

        const tree: BusinessNode[] = businesses.map(biz => ({
          businessId: biz.businessId,
          businessName: biz.businessName,
          branches: branches
            .filter(br => br.businessId === biz.businessId)
            .map(br => ({
              branchId: br.branchId,
              branchName: br.branchName,
              clients: clients.filter(c => c.branchId === br.branchId)
            }))
        }));

        this.businesses.set(tree);
        this.loadingHierarchy.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement hiérarchie:', err);
        this.loadingHierarchy.set(false);
      }
    });
  }

  toggleBusiness(id: number) {
    const s = new Set(this.expandedBusinesses());
    s.has(id) ? s.delete(id) : s.add(id);
    this.expandedBusinesses.set(s);
  }

  toggleBranch(id: number) {
    const s = new Set(this.expandedBranches());
    s.has(id) ? s.delete(id) : s.add(id);
    this.expandedBranches.set(s);
  }

  isBusinessExpanded(id: number) {
    return this.expandedBusinesses().has(id);
  }

  isBranchExpanded(id: number) {
    return this.expandedBranches().has(id);
  }
}