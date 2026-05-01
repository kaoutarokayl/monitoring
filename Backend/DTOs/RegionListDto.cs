namespace KtcWeb.Application.DTOs
{
    public class RegionListDto
    {
        public short RegionId { get; set; }
        public string RegionName { get; set; } = string.Empty;
        public string DisplayId { get; set; } = string.Empty;
        public byte RegionLevel { get; set; }
        public short ParentRegionId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
    }
}