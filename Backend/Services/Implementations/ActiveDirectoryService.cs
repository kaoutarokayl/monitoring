using System.DirectoryServices.AccountManagement;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace KtcWeb.Infrastructure.ExternalServices
{
    public class ActiveDirectoryService
    {
        private readonly string _domainName;
        private readonly IConfiguration _configuration;

        public ActiveDirectoryService(IConfiguration configuration)
        {
            _configuration = configuration;
            _domainName = _configuration["ActiveDirectorySettings:DomainName"] 
                          ?? throw new InvalidOperationException("ActiveDirectorySettings:DomainName n'est pas configuré dans appsettings.json");

            Console.WriteLine($"[AD Service] Domaine DNS configuré : {_domainName}");
        }

        /// <summary>
        /// Authentifie l'utilisateur contre Active Directory via le nom de domaine
        /// </summary>
   public bool Authenticate(string username, string password)
{
    try
    {
        Console.WriteLine($"[DEBUG Auth] Tentative pour {username} sur domaine {_domainName}");

        using (var context = new PrincipalContext(ContextType.Domain, _domainName))
        {
            // Priorité Negotiate (Kerberos) → beaucoup plus sécurisé et performant
            bool success = context.ValidateCredentials(username, password, ContextOptions.Negotiate);
            
            if (!success)
                success = context.ValidateCredentials(username, password, ContextOptions.SimpleBind);

            Console.WriteLine($"[DEBUG Auth] Résultat ValidateCredentials : {success}");
            return success;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[AD Auth ERROR] {ex.Message}");
        if (ex.InnerException != null)
            Console.WriteLine($"   InnerException: {ex.InnerException.Message}");
        return false;
    }
}

/// <summary>
/// Récupère les rôles métier de l'utilisateur depuis Active Directory (version finale et robuste pour KTC Web)
/// </summary>
public List<string> GetRoles(string username, string password)
{
    var roles = new List<string>();

    try
    {
        Console.WriteLine($"[DEBUG GetRoles] === Début pour {username} ===");

        using (var context = new PrincipalContext(ContextType.Domain, _domainName, username, password))
        {
            var user = UserPrincipal.FindByIdentity(context, IdentityType.SamAccountName, username);
            if (user == null)
            {
                Console.WriteLine($"[DEBUG] Utilisateur {username} non trouvé");
                roles.Add("Utilisateur");
                return roles;
            }

            Console.WriteLine($"[DEBUG] Utilisateur trouvé : {user.SamAccountName}");

            var groups = user.GetAuthorizationGroups();

            foreach (var group in groups)
            {
                if (group?.Name == null) continue;

                string groupName = group.Name.Trim();

                Console.WriteLine($"[DEBUG GetRoles] Groupe détecté : '{groupName}'");

                // On accepte TOUS les groupes sauf les plus basiques
                if (!IsHighlyDefaultGroup(groupName))
                {
                    roles.Add(groupName);
                    Console.WriteLine($"[DEBUG GetRoles] → RÔLE AJOUTÉ : {groupName}");
                }
            }
        }

        if (roles.Count == 0)
        {
            roles.Add("Utilisateur");
            Console.WriteLine("[DEBUG] Aucun rôle métier → fallback 'Utilisateur'");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[AD GetRoles ERROR] {ex.Message}");
    }

    Console.WriteLine($"[DEBUG GetRoles] RÔLES FINAUX : [{string.Join(", ", roles)}]");
    return roles;
}

private bool IsHighlyDefaultGroup(string groupName)
{
    var defaults = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "Utilisateurs du domaine", "Domain Users", "Utilisateurs", "Users",
        "Everyone", "Authenticated Users", "Guests", "Invités"
    };

    return defaults.Contains(groupName);
} 

        /// <summary>
        /// Génère le JWT Token avec les rôles
        /// </summary>
        public string GenerateJwtToken(string username, List<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
                claims.Add(new Claim("role", role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["Jwt:SecretKey"] ?? "KtcWebSecretKey2026SuperLongAndSecure!@#"));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "KtcWeb",
                audience: _configuration["Jwt:Audience"] ?? "KtcWeb",
                claims: claims,
                expires: DateTime.Now.AddHours(_configuration.GetValue<int>("Jwt:ExpirationInHours", 2)),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

