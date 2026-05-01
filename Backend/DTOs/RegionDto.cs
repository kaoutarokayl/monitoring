namespace KtcWeb.Application.DTOs
{
    public class RegionDto
    {
        public short RegionId { get; set; }           // changé en short
        public string RegionName { get; set; } = string.Empty;
        public string DisplayId { get; set; } = string.Empty;
    }
}

