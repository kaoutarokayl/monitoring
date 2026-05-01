namespace KtcWeb.Application.DTOs
{
    public class CreateGroupRequest
    {
        public string? GroupName { get; set; }
        public int? GroupTypeId { get; set; }
        public string? GroupQuery { get; set; }
        public string? GroupDescription { get; set; }
        public bool? IncludeMothballed { get; set; }
        public int? EvaluationInterval { get; set; }
    }
}


