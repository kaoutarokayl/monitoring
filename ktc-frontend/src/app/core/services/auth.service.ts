import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';

export interface LoginResponse {
  token: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:5239/api/auth/login';
  
  // Utilisation des Signals d'Angular pour un state réactif
  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  
  public isAuthenticated = computed(() => this.tokenSignal() !== null);
  public currentUser = computed(() => {
    const token = this.tokenSignal();
    if (!token) return { username: null as string | null, email: null as string | null, displayName: null as string | null };

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Common JWT claim variants (.NET / AD / Azure AD / custom)
      const displayName =
        payload.name ??
        payload.display_name ??
        payload.given_name ??
        payload.unique_name ??
        null;

      const email =
        payload.email ??
        payload.upn ??
        payload.preferred_username ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
        null;

      const username =
        payload.preferred_username ??
        payload.unique_name ??
        payload.sub ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
        null;

      return { username, email, displayName };
    } catch {
      return { username: null, email: null, displayName: null };
    }
  });
  public currentUserRoles = computed(() => {
    const token = this.tokenSignal();
    if (!token) return [];
    
    try {
      // Décodage natif du JWT (sans librairie)
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Le back-end .NET met souvent les rôles dans http://.../claims/role
      const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role || payload.roles;
      
      if (Array.isArray(roleClaim)) return roleClaim;
      if (typeof roleClaim === 'string') return [roleClaim];
      return [];
    } catch {
      return [];
    }
  });

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredToken(): string | null {
    const token = localStorage.getItem('jwt_token');
    // Basic validation - check if token format is valid (3 parts separated by dots)
    if (token && token.split('.').length === 3) {
      return token;
    }
    return null;
  }

  login(credentials: { username: string; password: string }) {
    return this.http.post<LoginResponse>(this.API_URL, credentials)
      .pipe(
        tap(response => {
          if (response && response.token) {
            localStorage.setItem('jwt_token', response.token);
            this.tokenSignal.set(response.token);
            this.router.navigate(['/dashboard']);
          }
        }),
        catchError(error => {
          return throwError(() => new Error('Identifiants invalides ou problème réseau'));
        })
      );
  }

  logout() {
    localStorage.removeItem('jwt_token');
    this.tokenSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }
}