import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Vérifie que l'utilisateur est connecté ET que son token JWT n'est pas expiré.
 * L'implémentation originale vérifiait seulement la présence du token (isAuthenticated),
 * ce qui laissait passer des tokens expirés encore présents dans le localStorage.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const token = authService.getToken();

  // Pas de token → login
  if (!token) {
    return router.parseUrl('/login');
  }

  // Décode l'expiration (même pattern que AuthService et HeaderComponent)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Si le token n'a pas de claim exp, on lui fait confiance (token opaque ou custom)
    if (!payload.exp) {
      return true;
    }

    const isExpired = payload.exp * 1000 < Date.now();

    if (isExpired) {
      // Nettoie le token périmé et redirige
      authService.logout();
      return router.parseUrl('/login');
    }

    return true;

  } catch {
    // Token malformé → sécurité par défaut : on déconnecte
    authService.logout();
    return router.parseUrl('/login');
  }
};