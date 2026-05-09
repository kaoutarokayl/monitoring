namespace KtcWeb.Application.DTOs
{
    public class CampaignDto
    {
        public int CampaignId { get; set; }
        public string? Name { get; set; }
        public string? PackageName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? PurgeDate { get; set; }
        public byte? Priority { get; set; }
        public byte? CampaignType { get; set; }  // 0: General, 1: Targeted, 2: External
        public byte? CampaignStatus { get; set; }  // 0: Enabled, 1: Disabled, 2: Expired, 3: Purged, 4: Cancelled
        public bool? CampaignInTestmode { get; set; }
        public int? DownloadId { get; set; }
        public string? CampaignData { get; set; }
        public string? DynamicCampaignData { get; set; }
        public string? ExternalId { get; set; }
        public int? MaxShows { get; set; }
        public int? RestHours { get; set; }
        public bool? Interactive { get; set; }
        public int? MaxShowMeLaterShows { get; set; }
        public int? ShowMeLaterRestHours { get; set; }
    }
}
