namespace KtcWeb.Application.DTOs
{
    public class ElectronicJournalEntryDto
    {
        public long TransactionId { get; set; }
        public DateTime Timestamp { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal? Amount { get; set; }
        public decimal? EffectiveAmount { get; set; }
        public long? EjStartId { get; set; }
        public long? EjEndId { get; set; }
    }
}

