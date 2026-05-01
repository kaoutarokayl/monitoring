namespace KtcWeb.Application.DTOs
{
    public class RegionDetailsDto
    {
        public short RegionId { get; set; }
        public string RegionName { get; set; } = string.Empty;
        public string DisplayId { get; set; } = string.Empty;
        public short BusinessId { get; set; }
        public byte RegionLevel { get; set; }
        public short ParentRegionId { get; set; }
        public string? AdditionalInfo { get; set; }
    }
}



