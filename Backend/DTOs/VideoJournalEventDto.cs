namespace KtcWeb.Application.DTOs
{
    public class VideoJournalEventDto
    {
        public string TransactionInformation { get; set; } = string.Empty; // free summary for the grid
        public long? TransactionId { get; set; }
        public long? SessionId { get; set; }
        public Guid? TransactionGuid { get; set; }

        public DateTime Timestamp { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Completion { get; set; } = string.Empty;

        public string CameraPosition { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;

        public bool Suspect { get; set; }
        public decimal? Amount { get; set; }

        public long MediaId { get; set; }
        public string MediaFileName { get; set; } = string.Empty;
        public string MediaUrl { get; set; } = string.Empty;
        public string MediaKind { get; set; } = "unknown"; // video|image|unknown
    }
}

