namespace KtcWeb.Application.DTOs
{
    public class AtmTicketDto
    {
        public int TicketId { get; set; }
        public string TicketType { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public DateTime Created { get; set; }
        public bool IsClosed { get; set; }
        public string Duration { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int ErrorId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string ErrorText { get; set; } = string.Empty;
        public string Owner { get; set; } = string.Empty;
        public string LastChangeBy { get; set; } = string.Empty;
        public DateTime LastChangeDate { get; set; }
        public string LastComment { get; set; } = string.Empty;
        public string SlaSummary { get; set; } = string.Empty;
        public string DispatchedTo { get; set; } = string.Empty;
    }
}
