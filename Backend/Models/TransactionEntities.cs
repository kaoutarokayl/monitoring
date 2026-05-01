using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace KtcWeb.Domain.Entities
{
    [Keyless]
    [Table("TransactionData_P")]
    public class TransactionDataP
    {
        [Column("transaction_id")]
        public long TransactionId { get; set; }

        [Column("transaction_uuid")]
        public Guid TransactionUuid { get; set; }

        [Column("session_id")]
        public long SessionId { get; set; }

        [Column("transaction_timestamp")]
        public DateTime TransactionTimestamp { get; set; }

        [Column("client_id")]
        public int ClientId { get; set; }

        [Column("txtype_field_lookup_id")]
        public int TxtypeFieldLookupId { get; set; }

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("completion_field_lookup_id")]
        public int CompletionFieldLookupId { get; set; }

        [Column("reason_field_lookup_id")]
        public int ReasonFieldLookupId { get; set; }

        [Column("start_client_EJ_id")]
        public long? StartClientEjId { get; set; }

        [Column("end_client_EJ_id")]
        public long? EndClientEjId { get; set; }
    }

    [Keyless]
    [Table("STX_FieldLookups")]
    public class StxFieldLookup
    {
        [Column("field_lookup_id")]
        public int FieldLookupId { get; set; }

        [Column("field_id")]
        public short FieldId { get; set; }

        [Column("disambiguation")]
        public string? Disambiguation { get; set; }

        [Column("field_code")]
        public string FieldCode { get; set; } = string.Empty;

        [Column("field_description")]
        public string FieldDescription { get; set; } = string.Empty;
    }
}

