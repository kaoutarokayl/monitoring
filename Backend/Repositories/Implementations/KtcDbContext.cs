using Microsoft.EntityFrameworkCore;

namespace KtcWeb.Infrastructure.Data
{
    public class KtcDbContext : DbContext
    {
        public KtcDbContext(DbContextOptions<KtcDbContext> options)
            : base(options)
        {
        }

        public DbSet<ClientAtmDto> Clients { get; set; } = null!;
        public DbSet<CurrentStatus> CurrentStatus { get; set; } = null!;
        public DbSet<ComponentList> ComponentList { get; set; } = null!;
        public DbSet<PropertyList> PropertyList { get; set; } = null!;
        public DbSet<ValueList> ValueList { get; set; } = null!;
        public DbSet<AssetHistory> AssetHistory { get; set; } = null!;
        public DbSet<CurrentCounter> CurrentCounters { get; set; } = null!;
        public DbSet<Replenishment> Replenishments { get; set; } = null!;
        public DbSet<ReplenishmentCounter> ReplenishmentCounters { get; set; } = null!;
        public DbSet<CurrentCashUnitStatus> CurrentCashUnitStatus { get; set; } = null!;
        public DbSet<PhysicalCassette> PhysicalCassettes { get; set; } = null!;
        public DbSet<PhysicalCassetteCount> PhysicalCassetteCounts { get; set; } = null!;
        public DbSet<PhysicalCassetteCurrentStatus> PhysicalCassetteCurrentStatus { get; set; } = null!;
        public DbSet<Denomination> Denominations { get; set; } = null!;
        public DbSet<Currency> Currencies { get; set; } = null!;
        public DbSet<CashUnitStatus> CashUnitStatuses { get; set; } = null!;
        public DbSet<CashUnitType> CashUnitTypes { get; set; } = null!;
        public DbSet<TransactionDataP> TransactionDataP { get; set; } = null!;
        public DbSet<StxFieldLookup> StxFieldLookups { get; set; } = null!;

        // FIX: Added HistoricalCashUnitStatus so the cash flow report can query historical changes.
        public DbSet<HistoricalCashUnitStatus> HistoricalCashUnitStatus { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClientAtmDto>()
                        .ToTable("Clients")
                        .HasNoKey();

            modelBuilder.Entity<ClientAtmDto>()
                        .Ignore(c => c.Branch);

            modelBuilder.Entity<BranchDto>().HasNoKey();
            modelBuilder.Entity<BusinessDto>().HasNoKey();
            modelBuilder.Entity<RegionDto>().HasNoKey();
            modelBuilder.Entity<CurrentStatus>().HasNoKey();
            modelBuilder.Entity<AssetHistory>().HasNoKey();
            modelBuilder.Entity<CurrentCounter>().HasNoKey();
            modelBuilder.Entity<Replenishment>().HasNoKey();
            modelBuilder.Entity<ReplenishmentCounter>().HasNoKey();
            modelBuilder.Entity<CurrentCashUnitStatus>().HasNoKey();
            modelBuilder.Entity<PhysicalCassette>().HasNoKey();
            modelBuilder.Entity<PhysicalCassetteCount>().HasNoKey();
            modelBuilder.Entity<PhysicalCassetteCurrentStatus>().HasNoKey();
            modelBuilder.Entity<Denomination>().HasNoKey();
            modelBuilder.Entity<Currency>().HasNoKey();
            modelBuilder.Entity<CashUnitStatus>().HasNoKey();
            modelBuilder.Entity<CashUnitType>().HasNoKey();
            modelBuilder.Entity<TransactionDataP>().HasNoKey();
            modelBuilder.Entity<StxFieldLookup>().HasNoKey();

            // FIX: Register HistoricalCashUnitStatus as keyless (partitioned table, no single PK).
            modelBuilder.Entity<HistoricalCashUnitStatus>()
                        .ToTable("HistoricalCashUnitStatus_P")
                        .HasNoKey();
        }
    }
}