namespace KtcWeb.Application.DTOs
{
    public class AtmUploadDto
    {
        public long ActionId { get; set; }
        public string FileLocation { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public byte FileType { get; set; }
        public string? FileTypeLabel { get; set; }
        public string? CommandName { get; set; }
        public string? ScheduleName { get; set; }
        public string? Status { get; set; }
        public string? AddedTime { get; set; }
        public string? Comments { get; set; }
    }
}
