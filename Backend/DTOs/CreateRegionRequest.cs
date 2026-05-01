namespace KtcWeb.Application.DTOs
{
    public class CreateRegionRequest
    {
        public string RegionName { get; set; } = string.Empty;
        public string? DisplayId { get; set; }
        public short BusinessId { get; set; } = 0;
        public byte RegionLevel { get; set; } = 0;
        public short ParentRegionId { get; set; } = 0;
        public string? AdditionalInfo { get; set; }
    }
}

