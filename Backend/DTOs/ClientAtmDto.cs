using System.ComponentModel.DataAnnotations.Schema;

namespace KtcWeb.Application.DTOs
{
    public class ClientAtmDto
    {
        public int ClientId { get; set; }
        public string KtcGuid { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string NetworkAddress { get; set; } = string.Empty;
        public byte Connectable { get; set; }
        public bool DetailsUnknown { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Timezone { get; set; } = string.Empty;
        public string? Comments { get; set; }
        public short BusinessId { get; set; }
        public short BranchId { get; set; }
        public short HardwareTypeId { get; set; }
        public string? HardwareTypeName { get; set; }
        public bool Active { get; set; }
        public byte ClientType { get; set; }

        [NotMapped]
        public BranchDto? Branch { get; set; }
    }
}

