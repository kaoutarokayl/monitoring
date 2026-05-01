
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

using Microsoft.EntityFrameworkCore;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Injection de dépendance
builder.Services.AddSingleton<ActiveDirectoryService>();
builder.Services.AddScoped<IAtmRepository, AtmRepository>();
builder.Services.AddScoped<IAtmAdminRepository, AtmAdminRepository>();
builder.Services.AddScoped<IAtmApplicationService, AtmApplicationService>();
builder.Services.AddScoped<ICashCassetteRepository, CashCassetteRepository>();
builder.Services.AddScoped<ICashCassetteService, CashCassetteService>();
// === AJOUT POUR LA BASE KTC ===
// === CONNEXION BASE DE DONNÉES KTC ===
builder.Services.AddDbContext<KtcDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("KtcDb")));


// Configuration JWT Authentication
var jwtSecret = builder.Configuration["Jwt:SecretKey"] 
                ?? "KtcWebSecretKey2026SuperLongAndSecure!@#";   // fallback uniquement en dev

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "KtcWeb",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "KtcWeb",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");

app.UseAuthentication();   // ← Important : doit être avant UseAuthorization
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();


