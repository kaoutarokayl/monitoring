namespace KtcWeb.Application.DTOs
{
    public class ReplenishmentDto
    {
        public int ReplenishmentId { get; set; }
        public short ComponentId { get; set; }
        public DateTime Timestmp { get; set; }
        public long? TransactionId { get; set; }
        public short PropertyId { get; set; }
        public string PropertyName { get; set; } = string.Empty;
        public short DenominationId { get; set; }
        public decimal? DenominationValue { get; set; }
        public int BeforeCount { get; set; }
        public int AfterCount { get; set; }
    }
}
