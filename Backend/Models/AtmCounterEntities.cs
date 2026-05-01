using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace KtcWeb.Domain.Entities
{
    [Keyless]
    [Table("CurrentCounters")]
    public class CurrentCounter
    {
        [Column("client_id")]
        public int ClientId { get; set; }

        [Column("component_id")]
        public short ComponentId { get; set; }

        [Column("property_id")]
        public short PropertyId { get; set; }

        [Column("denomination_id")]
        public short DenominationId { get; set; }

        [Column("timestmp")]
        public DateTime Timestmp { get; set; }

        [Column("counter_value")]
        public int CounterValue { get; set; }

        [Column("last_reset_timestmp")]
        public DateTime? LastResetTimestmp { get; set; }
    }

    [Keyless]
    [Table("Replenishments_P")]
    public class Replenishment
    {
        [Column("replenishment_id")]
        public int ReplenishmentId { get; set; }

        [Column("client_id")]
        public int ClientId { get; set; }

        [Column("component_id")]
        public short ComponentId { get; set; }

        [Column("timestmp")]
        public DateTime Timestmp { get; set; }

        [Column("transaction_id")]
        public long? TransactionId { get; set; }
    }

    [Keyless]
    [Table("ReplenishmentCounters_P")]
    public class ReplenishmentCounter
    {
        [Column("replenishment_id")]
        public int ReplenishmentId { get; set; }

        [Column("timestmp")]
        public DateTime Timestmp { get; set; }

        [Column("property_id")]
        public short PropertyId { get; set; }

        [Column("denomination_id")]
        public short DenominationId { get; set; }

        [Column("before_count")]
        public int BeforeCount { get; set; }

        [Column("after_count")]
        public int AfterCount { get; set; }
    }

    [Keyless]
    [Table("CurrentCashUnitStatus")]
    public class CurrentCashUnitStatus
    {
        [Column("client_id")]
        public int ClientId { get; set; }

        [Column("component_id")]
        public short ComponentId { get; set; }

        [Column("cashunit")]
        public byte CashUnit { get; set; }

        [Column("type_id")]
        public byte TypeId { get; set; }

        [Column("status_id")]
        public byte StatusId { get; set; }

        [Column("timestmp")]
        public DateTime Timestmp { get; set; }

        [Column("currency_id")]
        public byte CurrencyId { get; set; }

        [Column("currencyvalue")]
        public decimal CurrencyValue { get; set; }

        [Column("unitcount")]
        public int UnitCount { get; set; }

        [Column("totalvalue")]
        public decimal TotalValue { get; set; }
    }

    [Keyless]
    [Table("PhysicalCassettes")]
    public class PhysicalCassette
    {
        // FIX: DB schema defines cassette_id as bigint IDENTITY — must be long, not int.
        [Column("cassette_id")]
        public long CassetteId { get; set; }

        [Column("client_id")]
        public int ClientId { get; set; }

        [Column("component_id")]
        public short ComponentId { get; set; }

        [Column("position")]
        public string Position { get; set; } = string.Empty;

        [Column("type_id")]
        public byte TypeId { get; set; }
    }

    [Keyless]
    [Table("PhysicalCassetteCounts")]
    public class PhysicalCassetteCount
    {
        // FIX: FK to PhysicalCassettes.cassette_id which is bigint — must be long, not int.
        [Column("cassette_id")]
        public long CassetteId { get; set; }

        [Column("denomination_id")]
        public short DenominationId { get; set; }

        [Column("casscount")]
        public int CassCount { get; set; }
    }

    [Keyless]
    [Table("PhysicalCassetteCurrentStatus")]
    public class PhysicalCassetteCurrentStatus
    {
        [Column("cassette_id")]
        public long CassetteId { get; set; }

        [Column("timestmp")]
        public DateTime Timestmp { get; set; }

        [Column("status_id")]
        public byte StatusId { get; set; }

        [Column("reported")]
        public bool Reported { get; set; }
    }

    [Keyless]
    [Table("Denominations")]
    public class Denomination
    {
        [Column("denomination_id")]
        public short DenominationId { get; set; }

        [Column("currency_id")]
        public byte CurrencyId { get; set; }

        [Column("currencyvalue")]
        public decimal CurrencyValue { get; set; }
    }

    [Keyless]
    [Table("Currencies")]
    public class Currency
    {
        [Column("currency_id")]
        public byte CurrencyId { get; set; }

        [Column("currency")]
        public string Code { get; set; } = string.Empty;

        [Column("currency_description")]
        public string Description { get; set; } = string.Empty;
    }

    [Keyless]
    [Table("CashUnitStatuses")]
    public class CashUnitStatus
    {
        [Column("cashunitstatus_id")]
        public byte CashUnitStatusId { get; set; }

        [Column("statusname")]
        public string StatusName { get; set; } = string.Empty;
    }

    [Keyless]
    [Table("CashUnitTypes")]
    public class CashUnitType
    {
        [Column("cashunittype_id")]
        public byte CashUnitTypeId { get; set; }

        [Column("typename")]
        public string TypeName { get; set; } = string.Empty;
    }
}