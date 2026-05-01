namespace KtcWeb.Application.DTOs
{
    public class AppCounterDto
    {
        public short ComponentId { get; set; }
        public short PropertyId { get; set; }
        public string PropertyName { get; set; } = string.Empty;
        public string CurrencyCode { get; set; } = string.Empty;
        public short? DenominationId { get; set; }
        public decimal? DenominationValue { get; set; }
        public int CounterValue { get; set; }
        public DateTime Timestmp { get; set; }
        public DateTime? LastResetTimestmp { get; set; }
    }
}
