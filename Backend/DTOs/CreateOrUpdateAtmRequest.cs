namespace KtcWeb.Application.DTOs
{
    public class CreateOrUpdateAtmRequest
    {
        public string ClientName { get; set; } = string.Empty;
        public string NetworkAddress { get; set; } = string.Empty;
        // 1=Not connectable, 2=Static IP, 3=Dynamic IP
        public byte Connectable { get; set; } = 1;
        public bool DetailsUnknown { get; set; } = false;
        public double Latitude { get; set; } = 0;
        public double Longitude { get; set; } = 0;
        public string Timezone { get; set; } = "UTC";
        public string? Comments { get; set; }

        public byte ClientType { get; set; } = 1;
        public int GridPosition { get; set; } = 0;
        public short BusinessId { get; set; } = 0;
        public short BranchId { get; set; } = 0;
        public short HardwareTypeId { get; set; } = 0;
        public short OwnerId { get; set; } = 0;
        public bool DeleteLater { get; set; } = false;
        public bool Active { get; set; } = true;
        public string Subnet { get; set; } = string.Empty;
        public short Level1RegionId { get; set; } = 0;
        public short Level2RegionId { get; set; } = 0;
        public short Level3RegionId { get; set; } = 0;
        public short Level4RegionId { get; set; } = 0;
        public short Level5RegionId { get; set; } = 0;
        public string Salt { get; set; } = string.Empty;
        public string AuthHash { get; set; } = string.Empty;
        public bool HypervisorActive { get; set; } = false;
        public int MergeToClientId { get; set; } = 0;
        public string FeatureFlags { get; set; } = string.Empty;
    }
}

