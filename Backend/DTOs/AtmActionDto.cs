namespace KtcWeb.Application.DTOs
{
    public class AtmActionDto
    {
        public long ActionId { get; set; }
        public string User { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        /// <summary>dbo.Actions.addedtime formaté en SQL (UTC côté base), chaîne yyyy-MM-dd HH:mm:ss.</summary>
        public string? AddedTime { get; set; }
        public string? Started { get; set; }
        public string? Finished { get; set; }
        public string LastComment { get; set; } = string.Empty;
    }
}

