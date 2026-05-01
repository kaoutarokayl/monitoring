namespace KtcWeb.Application.DTOs
{
    public class AtmCertificateDto
    {
        public string CertificateStore { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string FriendlyName { get; set; } = string.Empty;
        public DateTime NotBefore { get; set; }
        public DateTime NotAfter { get; set; }
        public bool IsPrivate { get; set; }
        public DateTime FirstSeen { get; set; }
        public string SerialNumber { get; set; } = string.Empty;
    }
}
