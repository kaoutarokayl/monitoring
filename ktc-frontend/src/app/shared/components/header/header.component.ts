import { Component, HostListener, inject, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AtmRemoteCommandsMenuComponent } from '../../../features/atm/components/atm-remote-commands-menu.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AtmRemoteCommandsMenuComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  themeMode = signal<'light' | 'dark'>('light');
  private readonly themeStorageKey = 'ktc-theme';

  roles = this.authService.currentUserRoles;
  user  = this.authService.currentUser;

  isProfileOpen = signal(false);

  // ─── SESSION COUNTDOWN ──────────────────────────────────────────────────────
  // Temps restant formaté ex: "1h 42m" ou "8m 30s" (sous les 10 min)
  sessionCountdown = signal<string>('—');
  // Passe à true quand il reste moins de 10 minutes → topbar vire au jaune
  sessionWarning   = signal<boolean>(false);

  private sessionTimer: ReturnType<typeof setInterval> | null = null;

  private startSessionCountdown(): void {
    // Récupère le token via AuthService (clé localStorage : 'jwt_token')
    const token = this.authService.getToken();
    if (!token) return;

    // Décode le payload (même pattern que AuthService)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) {
        // Token sans exp → durée fixe 2h depuis maintenant comme fallback
        const fallbackExp = Math.floor(Date.now() / 1000) + 7200;
        payload.exp = fallbackExp;
      }
      const expMs = payload.exp * 1000;

      const tick = () => {
        const remainMs = expMs - Date.now();

        if (remainMs <= 0) {
          this.sessionCountdown.set('Expirée');
          this.sessionWarning.set(true);
          this.stopSessionCountdown();
          // Optionnel : déconnecter automatiquement
          // this.authService.logout();
          return;
        }

        const totalSec = Math.floor(remainMs / 1000);
        const hours    = Math.floor(totalSec / 3600);
        const minutes  = Math.floor((totalSec % 3600) / 60);
        const seconds  = totalSec % 60;

        // Format : "1h 42m" si > 10 min, "8m 30s" si <= 10 min
        const WARNING_THRESHOLD_MIN = 10;
        if (hours === 0 && minutes < WARNING_THRESHOLD_MIN) {
          this.sessionWarning.set(true);
          this.sessionCountdown.set(`${minutes}m ${String(seconds).padStart(2, '0')}s`);
        } else {
          this.sessionWarning.set(false);
          const label = hours > 0
            ? `${hours}h ${String(minutes).padStart(2, '0')}m`
            : `${minutes}m`;
          this.sessionCountdown.set(label);
        }
      };

      tick(); // affiche immédiatement sans attendre 1 sec
      this.sessionTimer = setInterval(tick, 1000);

    } catch {
      // Token malformé ou non-JWT → on n'affiche rien
      this.sessionCountdown.set('—');
    }
  }

  private stopSessionCountdown(): void {
    if (this.sessionTimer !== null) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  userInitial = computed(() => {
    const name = this.user()?.username || '?';
    return name.charAt(0).toUpperCase();
  });

  primaryRole = computed(() => {
    const r = this.roles();
    if (!r || r.length === 0) return 'Utilisateur';
    return r[0];
  });

  get themeIcon() {
    return this.themeMode() === 'dark' ? '☀️' : '🌙';
  }

  get themeLabel() {
    return this.themeMode() === 'dark' ? 'Mode clair' : 'Mode sombre';
  }

  constructor() {
    this.initializeTheme();
    this.startSessionCountdown(); // démarre le compte à rebours au chargement du header
  }

  ngOnDestroy(): void {
    this.stopSessionCountdown(); // nettoie le setInterval à la destruction du composant
  }

  toggleTheme() {
    this.applyTheme(this.themeMode() === 'dark' ? 'light' : 'dark');
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem(this.themeStorageKey) as 'light' | 'dark' | null;
    const theme = savedTheme === 'dark' || savedTheme === 'light'
      ? savedTheme
      : this.getPreferredTheme();
    this.applyTheme(theme);
  }

  private getPreferredTheme(): 'light' | 'dark' {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark') {
    this.themeMode.set(theme);
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem(this.themeStorageKey, theme);
  }

  toggleProfile(event?: Event) {
    event?.stopPropagation();
    this.isProfileOpen.update(v => !v);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isProfileOpen.set(false);
  }

  logout() {
    this.stopSessionCountdown();
    this.authService.logout();
  }

  goToAdministration() {
    this.isProfileOpen.set(false);
    this.router.navigate(['/admin']);
  }

  goToCampaigns() {
    this.isProfileOpen.set(false);
    this.router.navigate(['/campaign']);
  }

  isCampaignRoute(): boolean {
    return this.router.url.startsWith('/campaign');
  }
}