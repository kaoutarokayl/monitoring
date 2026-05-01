using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KtcWeb.Domain.Entities
{
    [Table("ComponentList")]
    public class ComponentList
    {
        [Key]
        [Column("component_id")]
        public short ComponentId { get; set; }

        [Column("componentname")]
        public string ComponentName { get; set; } = string.Empty;
    }

    [Table("PropertyList")]
    public class PropertyList
    {
        [Key]
        [Column("property_id")]
        public short PropertyId { get; set; }

        [Column("propertyname")]
        public string PropertyName { get; set; } = string.Empty;

        [Column("category")]
        public string Category { get; set; } = string.Empty;
    }

    [Table("ValueList")]
    public class ValueList
    {
        [Key]
        [Column("value_id")]
        public int ValueId { get; set; }

        [Column("valuename")]
        public string ValueName { get; set; } = string.Empty;
    }

    [Table("CurrentStatus")]
    public class CurrentStatus
    {
        [Column("client_id")]
        public int ClientId { get; set; }

        [Column("component_id")]
        public short ComponentId { get; set; }

        [Column("property_id")]
        public short PropertyId { get; set; }

        [Column("value_id")]
        public int ValueId { get; set; }

        [Column("numeric_value")]
        public decimal? NumericValue { get; set; }
    }

    [Table("AssetHistory")]
    public class AssetHistory
    {
        [Column("client_id")]
        public int ClientId { get; set; }

        [Column("timestmp")]
        public DateTime Date { get; set; }

        [Column("component_id")]
        public short ComponentId { get; set; }

        [Column("property_id")]
        public short PropertyId { get; set; }

        [Column("old_value_id")]
        public int OldValueId { get; set; }

        [Column("new_value_id")]
        public int NewValueId { get; set; }

        [Column("old_numeric_value")]
        public decimal? OldNumericValue { get; set; }

        [Column("new_numeric_value")]
        public decimal? NewNumericValue { get; set; }

        [Column("comments")]
        public string Comments { get; set; } = string.Empty;
    }

    public class AtmAssetHistoryDto
    {
        public string User { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string ComponentName { get; set; } = string.Empty;
        public string PropertyName { get; set; } = string.Empty;
        public string OldValue { get; set; } = string.Empty;
        public string NewValue { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
    }


    public class AtmComponentStatusDto
    {
        public short ComponentId { get; set; }
        public string ComponentName { get; set; } = string.Empty;
        public string PropertyCategory { get; set; } = string.Empty;
        public string PropertyName { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Severity { get; set; } = "UNKNOWN"; // OK, WARNING, CRITICAL, UNKNOWN
    }
}


