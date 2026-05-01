namespace KtcWeb.Application.DTOs
{
    public class AtmSoftwareInfoDto
    {
        public short SwId { get; set; }
        public string SoftwareName { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public byte InstallType { get; set; }
        public string InstallTypeLabel { get; set; } = string.Empty;
        public DateTime InstallDate { get; set; }
        public int ComplianceRulesCount { get; set; }
    }
}
