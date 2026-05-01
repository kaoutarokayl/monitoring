namespace KtcWeb.Application.DTOs
{
    public class HardwareTypeDto
    {
        public short HardwareTypeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string TypeGroup { get; set; } = string.Empty;
        public bool CanBeConfigured { get; set; }
        public bool CanBeMonitored { get; set; }
    }
}



