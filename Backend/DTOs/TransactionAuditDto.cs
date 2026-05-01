namespace KtcWeb.Application.DTOs
{
    public class TransactionAuditDto
    {
        public long SessionId { get; set; }
        public long TransactionId { get; set; }
        public Guid TransactionGuid { get; set; }
        public DateTime Timestamp { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Completion { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public bool HasEj { get; set; }
    }
}

