# 📖 KTC Web - Guide d'Architecture & Onboarding Développeur

Bienvenue dans l'équipe de **KTC Web** ! Ce document est votre point d'entrée pour comprendre la structure, les choix techniques et les règles d'or de notre application. Lisez-le attentivement avant de commencer à coder.

---

## 🚀 Le Projet (Quoi et Pourquoi)

**KTC Web** est une plateforme web moderne conçue pour la **supervision, le monitoring et le pilotage à distance d'un parc de Guichets Automatiques Bancaires (ATMs)**. Elle permet aux administrateurs bancaires de visualiser en temps réel l'état du matériel (cassettes, imprimantes, coffres) et d'interagir avec les machines.

⚠️ **Règle d'Or Absolue : L'approche "Database-First"**
Notre application se branche sur une base de données industrielle KAL KTC préexistante et complexe (+120 tables). **Cette base est en production.**
Il est **strictement interdit** de générer, créer ou exécuter des migrations Entity Framework Core (`Add-Migration`, `Update-Database`). Notre code backend a uniquement un rôle de *lecteur* et *d'acteur* métier, il ne gère pas le cycle de vie du schéma de la DB.

---

## 🏗️ L'Architecture Code (Le Comment)

Notre stack technique repose sur des fondations solides et modernes :
* **Backend** : ASP.NET Core 8, Entity Framework Core (EF Core)
* **Frontend** : Angular 18
* **Base de Données** : Microsoft SQL Server
* **Sécurité** : JWT (JSON Web Tokens) & Intégration Active Directory (AD)

### 🧩 Backend : Clean Architecture
Notre solution .NET est divisée en 4 couches distinctes pour garantir un couplage faible et une grande testabilité :

1. **`Domain/` (Le Cœur)** : Contient nos entités de base de données (reflétant le schéma SQL), nos énumérations et les interfaces de nos *Repositories*.
2. **`Application/` (Le Contrat)** : Regroupe les cas d'utilisation, la logique métier pure, les *Mappers* et surtout les **DTOs** (Data Transfer Objects).
3. **`Infrastructure/` (La Technique)** : Implémente l'accès aux données avec `KtcDbContext`, l'implémentation concrète des *Repositories*, et l'intégration avec des services externes (comme l'Active Directory).
4. **`API/` (Le Point d'Entrée)** : Ne contient que la couche web (les `Controllers` REST), les `Middlewares` de gestion d'erreur et la configuration de l'Injection de Dépendances (`Program.cs`).

### 🎨 Frontend : Architecture "Feature-First"
Le projet Angular (`src/app/`) est pensé pour l'extensibilité et la séparation par domaine métier :

* **`core/`** : Les fondations de l'application. Ne contient que des services Singletons (ex: `AuthService`), des `Guards` (sécurité) et des `Interceptors` (injections de tokens HTTP).
* **`shared/`** : Composants visuels génériques et "bêtes" (Layout, Sidebar, Boutons, Badges) réutilisables partout, sans logique métier forte.
* **`features/`** : Le cœur de l'appli. Divisé par modules métiers (ex: `atm/`, `business/`, `group/`). Chaque feature contient ses propres :
  * `components/` : Les pages et fragments d'UI spécifiques.
  * `services/` : Les appels API liés à la feature.
  * `models/` : Les interfaces TypeScript.
