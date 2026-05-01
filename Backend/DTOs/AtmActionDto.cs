namespace KtcWeb.Application.DTOs
{
    public class AtmActionDto
    {
        public long ActionId { get; set; }
        public string User { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? Started { get; set; }
        public DateTime? Finished { get; set; }
        public string LastComment { get; set; } = string.Empty;
    }
}

