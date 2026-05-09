namespace KtcWeb.Application.DTOs
{
    public class CampaignShownCountDto
    {
        public int CampaignId { get; set; }
        public int BusinessId { get; set; }
        public string? BusinessName { get; set; }
        public int Count { get; set; }
    }
}
