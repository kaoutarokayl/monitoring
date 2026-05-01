namespace KtcWeb.Application.DTOs
{
    public class LastClientContactDto
    {
        public int ClientId { get; set; }
        public DateTime? Timestmp { get; set; }
        public int Timeoffset { get; set; }
        public int LastMsgId { get; set; }
        public string? LastMsgReply { get; set; }
        public DateTime? NextMessageExpected { get; set; }
        public string? MsgRejectedInfo { get; set; }
        public int MsgQueueSize { get; set; }
        public DateTime? MsgCreatedTs { get; set; }
        public bool ReplayFlag { get; set; }
        public bool MutualAuth { get; set; }
    }
}
