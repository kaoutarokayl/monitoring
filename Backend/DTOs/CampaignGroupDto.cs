namespace KtcWeb.Application.DTOs
{
    public class CampaignGroupDto
    {
        public int CampaignId { get; set; }
        public int GroupId { get; set; }
        public string? GroupName { get; set; }
        public bool? GroupIncluded { get; set; }
    }
}
