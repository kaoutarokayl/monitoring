using System.ComponentModel.DataAnnotations.Schema;

namespace KtcWeb.Application.DTOs
{
    public class BranchDto
    {
        public short BranchId { get; set; }
        public string BranchName { get; set; } = string.Empty;
        public string DisplayId { get; set; } = string.Empty;
        public string? AdditionalInfo { get; set; }
        public short BusinessId { get; set; }
        public short Level1RegionId { get; set; }
        public short Level2RegionId { get; set; }
        public short Level3RegionId { get; set; }
        public short Level4RegionId { get; set; }
        public short Level5RegionId { get; set; }
    }
}

