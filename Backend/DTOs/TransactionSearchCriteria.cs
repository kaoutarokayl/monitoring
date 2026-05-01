namespace KtcWeb.Application.DTOs
{
    public class TransactionSearchCriteria
    {
        public int ClientId { get; set; }

        public DateTime? From { get; set; }
        public DateTime? To { get; set; }

        public decimal? Amount { get; set; }

        public int? TypeLookupId { get; set; }
        public int? ReasonLookupId { get; set; }
        public int? CompletionLookupId { get; set; }

        // direct find
        public long? SessionId { get; set; }
        public long? TransactionId { get; set; }
        public Guid? TransactionGuid { get; set; }
    }
}

