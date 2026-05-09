namespace KtcWeb.Application.DTOs
{
    public class CampaignCardDto
    {
        public int CampaignId { get; set; }
        public string? CardHash { get; set; }
        public string? CardData { get; set; }
        public byte? Priority { get; set; }
        public byte? StatusCode { get; set; }
        public byte? ShownCount { get; set; }
        public DateTime? CooldownTimestamp { get; set; }
        public bool? ShowAgain { get; set; }
    }
}
