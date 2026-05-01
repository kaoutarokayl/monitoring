// Add this class inside KtcWeb.Domain.Entities namespace, alongside the other entities in AtmCounterEntities.cs

using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace KtcWeb.Domain.Entities
{
    /// <summary>
    /// Maps to the partitioned table HistoricalCashUnitStatus_P.
    /// Used to build cash flow history reports.
    /// </summary>
    [Keyless]
    [Table("HistoricalCashUnitStatus_P")]
    public class HistoricalCashUnitStatus
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

        [Column("addedtime")]
        public DateTime? AddedTime { get; set; }
    }
}