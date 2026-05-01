import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AtmService, ClientAtm } from '../services/atm.service';
import { RemoteCommandTypeDto } from '../models/atm.models';
import { formatCommandDisplayLabel, partitionToolbarCommands } from '../remote-toolbar-commands';

@Component({
  selector: 'app-atm-remote-commands-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './atm-remote-commands-menu.component.html',
  styleUrls: ['./atm-remote-commands-menu.component.css']
})
export class AtmRemoteCommandsMenuComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly atmService = inject(AtmService);
  private navSub?: Subscription;

  readonly allCommands = signal<RemoteCommandTypeDto[]>([]);
  readonly commandPartitions = computed(() => partitionToolbarCommands(this.allCommands()));
  readonly mainCommands = computed(() => this.commandPartitions().main);
  readonly uploadCommands = computed(() => this.commandPartitions().upload);

  readonly uploadSubmenuOpen = signal(false);

  /** Affiché seulement sur les écrans de gestion des ATMs. */
  readonly visible = signal(false);
  readonly menuOpen = signal(false);

  readonly loadError = signal<string | null>(null);
  readonly activeCommand = signal<RemoteCommandTypeDto | null>(null);
  readonly modalClients = signal<ClientAtm[]>([]);
  readonly clientsLoading = signal(false);
  readonly selectedIds = signal<number[]>([]);
  readonly checkAllValue = signal(false);
  readonly initiatedBy = signal('');
  readonly dispatching = signal(false);
  readonly dispatchError = signal<string | null>(null);

  readonly modalOpen = computed(() => this.activeCommand() != null);

  ngOnInit(): void {
    this.updateVisible(this.router.url);
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.updateVisible(e.urlAfterRedirects || e.url);
        this.menuOpen.set(false);
        this.uploadSubmenuOpen.set(false);
      });

    this.atmService.getRemoteCommandTypes().subscribe({
      next: (rows) => this.allCommands.set(rows ?? []),
      error: () => this.loadError.set('Types de commandes indisponibles.')
    });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  private updateVisible(url: string): void {
    const path = url.split(/[?#]/)[0];
    this.visible.set(/^\/admin\/atms(\/|$)/.test(path));
  }

  /** Pré-coche l’ATM courant sur /admin/atms/:id/... */
  private preselectedFromUrl(url: string): number[] {
    const path = url.split(/[?#]/)[0];
    const m = path.match(/\/admin\/atms\/(\d+)(?:\/|$)/);
    if (!m) return [];
    return [Number(m[1])];
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuOpen.set(false);
    this.uploadSubmenuOpen.set(false);
  }

  toggleMenu(ev: MouseEvent): void {
    ev.stopPropagation();
    this.menuOpen.update((v) => {
      const next = !v;
      if (next) {
        this.uploadSubmenuOpen.set(false);
      }
      return next;
    });
  }

  toggleUploadSub(ev: MouseEvent): void {
    ev.stopPropagation();
    this.uploadSubmenuOpen.update((u) => !u);
  }

  displayLabel(commandName: string | undefined): string {
    return commandName ? formatCommandDisplayLabel(commandName) : '';
  }

  pickCommand(cmd: RemoteCommandTypeDto, ev: MouseEvent): void {
    ev.stopPropagation();
    this.menuOpen.set(false);
    this.uploadSubmenuOpen.set(false);
    this.openPicker(cmd);
  }

  openPicker(cmd: RemoteCommandTypeDto): void {
    this.dispatchError.set(null);
    this.activeCommand.set(cmd);
    this.clientsLoading.set(true);
    this.modalClients.set([]);

    const pre = this.preselectedFromUrl(this.router.url);

    this.atmService.getClients().subscribe({
      next: (list) => {
        const clients = list ?? [];
        this.modalClients.set(clients);
        const validPre = pre.filter((id) => clients.some((c) => c.clientId === id));
        this.selectedIds.set(validPre);
        this.clientsLoading.set(false);
        this.syncCheckAll();
      },
      error: () => {
        this.modalClients.set([]);
        this.clientsLoading.set(false);
        this.dispatchError.set('Impossible de charger la liste des ATMs.');
      }
    });
  }

  closePicker(): void {
    this.activeCommand.set(null);
    this.dispatchError.set(null);
    this.modalClients.set([]);
    this.uploadSubmenuOpen.set(false);
  }

  private syncCheckAll(): void {
    const all = this.modalClients().map((c) => c.clientId);
    const sel = this.selectedIds();
    this.checkAllValue.set(all.length > 0 && all.every((id) => sel.includes(id)));
  }

  toggleClient(id: number): void {
    this.selectedIds.update((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
    this.syncCheckAll();
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  setCheckAll(checked: boolean): void {
    if (checked) {
      this.selectedIds.set(this.modalClients().map((c) => c.clientId));
    } else {
      this.selectedIds.set([]);
    }
    this.checkAllValue.set(checked);
  }

  onCheckAllChange(ev: Event): void {
    this.setCheckAll((ev.target as HTMLInputElement).checked);
  }

  confirmDispatch(): void {
    const cmd = this.activeCommand();
    if (!cmd) return;
    const ids = this.selectedIds();
    if (ids.length === 0) {
      this.dispatchError.set('Cochez au moins un ATM.');
      return;
    }
    this.dispatching.set(true);
    this.dispatchError.set(null);
    const initiated = this.initiatedBy().trim();
    this.atmService
      .dispatchRemoteCommand({
        commandId: cmd.commandId,
        clientIds: ids,
        initiatedBy: initiated || undefined
      })
      .subscribe({
        next: (res) => {
          this.dispatching.set(false);
          const n = res?.created ?? 0;
          const skip = res?.skippedClientIds?.length
            ? ` (IDs ignorés : ${res.skippedClientIds.join(', ')})`
            : '';
          alert(`File d’attente : ${n} action(s) créée(s) dans dbo.Actions.${skip}`);
          this.closePicker();
        },
        error: (err) => {
          this.dispatching.set(false);
          this.dispatchError.set(err?.error?.message ?? 'Échec de l’envoi.');
        }
      });
  }
}
