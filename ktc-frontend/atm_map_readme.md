# 📍 ATM Map — Instructions d'intégration

## 1. Ajouter Leaflet dans `index.html`

Dans `src/index.html`, ajouter dans `<head>` :

```html
<!-- Leaflet CSS -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
  crossorigin=""
/>

<!-- Leaflet JS — AVANT la balise </body> -->
<script
  src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WLs="
  crossorigin=""
></script>
```

## 2. Fichiers à créer

Copier les 3 fichiers générés dans :
```
src/app/features/atm/
├── atm-map.component.ts
├── atm-map.component.html
└── atm-map.component.css
```

## 3. Routing — `app.routes.ts`

La route `/admin/atms/map` est déjà ajoutée dans `app.routes.ts` généré.

⚠️ **Important** : La route `atms/map` doit être déclarée **AVANT** `atms/:id/edit`,
sinon Angular interprétera `map` comme un `:id`. C'est déjà le cas dans le fichier fourni.

## 4. Fonctionnalités de la carte

| Fonctionnalité | Description |
|---|---|
| 🗺️ Carte OpenStreetMap | Fond de carte gratuit, sans clé API |
| 📍 Markers colorés | Vert = Actif, Rouge = Inactif |
| 🔍 Recherche en temps réel | Filtre les markers + la liste latérale |
| 🏷️ Filtres Actifs / Inactifs | Chips dans la sidebar |
| 📊 KPIs | Compteurs Total / Actifs / Inactifs |
| 🖱️ Popup au clic | Détails + lien Modifier directement sur la carte |
| 📋 Panneau détail | Fiche ATM complète en bas à droite |
| ⌖ Fly to | Centrage animé sur l'ATM sélectionné |
| ⛶ Voir tout | Recadrage automatique sur tous les markers |
| ‹ › Sidebar repliable | Plus d'espace carte sur mobile |

## 5. ATMs sans coordonnées GPS

Les ATMs avec `latitude === 0 && longitude === 0` sont ignorés sur la carte.
Pour les afficher, renseigner leurs coordonnées via le formulaire ATM (champs Latitude / Longitude).

## 6. Accès depuis la liste ATM

Le bouton **"🗺️ Vue Carte"** dans `atm-list.component.html` navigue déjà vers `/admin/atms/map`
via `goMap()` → `this.router.navigate(['/admin/atms/map'])`. Aucune modification nécessaire.



Section GPS — nouvelles fonctionnalités :
Bouton "📍 Choisir sur la carte" → ouvre une modale avec une carte Leaflet interactive
Dans la modale :

🔍 Barre de recherche d'adresse — tape une ville/adresse + Entrée, la carte se centre dessus automatiquement (via Nominatim/OpenStreetMap, gratuit, sans clé API)
🖱️ Clic sur la carte → place le marqueur violet à cet endroit
↕️ Marker draggable → tu peux le glisser pour ajuster précisément
📌 Coordonnées affichées en temps réel en bas de la modale
✅ "Confirmer la position" → injecte lat/lng directement dans le formulaire