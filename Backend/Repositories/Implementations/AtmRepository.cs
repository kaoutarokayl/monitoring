

using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace KtcWeb.Infrastructure.Repositories
{
    public class AtmRepository : IAtmRepository
    {
        private readonly KtcDbContext _context;

        public AtmRepository(KtcDbContext context)
        {
            _context = context;
        }

        private class AtmTicketRaw
        {
            public int TicketId { get; set; }
            public string TicketType { get; set; } = string.Empty;
            public string ClientName { get; set; } = string.Empty;
            public DateTime Created { get; set; }
            public bool IsClosed { get; set; }
            public string Duration { get; set; } = string.Empty;
            public string Status { get; set; } = string.Empty;
            public int ErrorId { get; set; }
            public string Code { get; set; } = string.Empty;
            public string ErrorText { get; set; } = string.Empty;
            public string Owner { get; set; } = string.Empty;
            public string LastChangeBy { get; set; } = string.Empty;
            public DateTime LastChangeDate { get; set; }
            public string SlaSummary { get; set; } = string.Empty;
            public string DispatchedTo { get; set; } = string.Empty;
            public string CommentsXml { get; set; } = string.Empty;
        }

        private async Task<bool> ColumnExistsAsync(string tableName, string columnName)
        {
            var exists = await _context.Database.SqlQueryRaw<int>(@"
                SELECT CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = 'dbo'
                          AND TABLE_NAME = {0}
                          AND COLUMN_NAME = {1}
                    ) THEN 1
                    ELSE 0
                END AS [Value]", tableName, columnName).FirstOrDefaultAsync();

            return exists == 1;
        }

        private async Task<string?> FirstExistingColumnAsync(string tableName, params string[] candidates)
        {
            foreach (var candidate in candidates)
            {
                if (await ColumnExistsAsync(tableName, candidate))
                {
                    return candidate;
                }
            }

            return null;
        }

        private async Task<bool> TableExistsAsync(string tableName)
        {
            var exists = await _context.Database.SqlQueryRaw<int>(@"
                SELECT CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_SCHEMA = 'dbo'
                          AND TABLE_NAME = {0}
                    ) THEN 1
                    ELSE 0
                END AS [Value]", tableName).FirstOrDefaultAsync();

            return exists == 1;
        }

        public async Task<List<AtmComponentStatusDto>> GetAtmStatusAsync(int clientId)
        {
            var query = from status in _context.CurrentStatus.AsNoTracking()
                        where status.ClientId == clientId
                        join component in _context.ComponentList.AsNoTracking()
                            on status.ComponentId equals component.ComponentId
                        join property in _context.PropertyList.AsNoTracking()
                            on status.PropertyId equals property.PropertyId
                        join val in _context.ValueList.AsNoTracking()
                            on status.ValueId equals val.ValueId into valueGroup
                        from val in valueGroup.DefaultIfEmpty()
                        select new AtmComponentStatusDto
                        {
                            ComponentId = component.ComponentId,
                            ComponentName = component.ComponentName,
                            PropertyCategory = property.Category,
                            PropertyName = property.PropertyName,
                            Value = status.ValueId == 0
                                ? (status.NumericValue != null ? status.NumericValue.ToString() ?? string.Empty : string.Empty)
                                : (val != null ? val.ValueName : (status.NumericValue != null ? status.NumericValue.ToString() ?? string.Empty : string.Empty)),
                            Severity = "UNKNOWN" // We'll compute this after retrieving or let it be UNKNOWN for now
                        };

            var result = await query.ToListAsync();

            // Compute Severity based on text value (OK, WARNING, CRITICAL, UNKNOWN)
            foreach (var item in result)
            {
                var valLower = item.Value?.ToLower() ?? "";
                if (valLower.Contains("ok") || valLower.Contains("normal") || valLower.Contains("good") || valLower.Contains("active"))
                    item.Severity = "OK";
                else if (valLower.Contains("warning") || valLower.Contains("low") || valLower.Contains("near") || valLower.Contains("attention"))
                    item.Severity = "WARNING";
                else if (valLower.Contains("critical") || valLower.Contains("error") || valLower.Contains("fault") || valLower.Contains("empty") || valLower.Contains("jam") || valLower.Contains("out") || valLower.Contains("offline") || valLower.Contains("fatal"))
                    item.Severity = "CRITICAL";
                else
                    item.Severity = "UNKNOWN";
            }

            return result;
        }

        public async Task<List<AtmAssetHistoryDto>> GetAtmAssetHistoryAsync(int clientId)
        {
            var query = from history in _context.AssetHistory.AsNoTracking()
                        where history.ClientId == clientId
                        join component in _context.ComponentList.AsNoTracking()
                            on history.ComponentId equals component.ComponentId into compGroup
                        from component in compGroup.DefaultIfEmpty()
                        join property in _context.PropertyList.AsNoTracking()
                            on history.PropertyId equals property.PropertyId into propGroup
                        from property in propGroup.DefaultIfEmpty()
                        join valOld in _context.ValueList.AsNoTracking()
                            on history.OldValueId equals valOld.ValueId into valOldGroup
                        from valOld in valOldGroup.DefaultIfEmpty()
                        join valNew in _context.ValueList.AsNoTracking()
                            on history.NewValueId equals valNew.ValueId into valNewGroup
                        from valNew in valNewGroup.DefaultIfEmpty()
                        orderby history.Date descending
                        select new
                        {
                            history.Date,
                            ComponentName = component != null ? component.ComponentName : "Unknown",
                            PropertyName = property != null ? property.PropertyName : "Unknown",
                            OldValueName = valOld != null ? valOld.ValueName : null,
                            NewValueName = valNew != null ? valNew.ValueName : null,
                            history.OldValueId,
                            history.NewValueId,
                            history.OldNumericValue,
                            history.NewNumericValue,
                            history.Comments
                        };

            var dbResult = await query.ToListAsync();

            var result = new List<AtmAssetHistoryDto>();

            foreach (var item in dbResult)
            {
                var dto = new AtmAssetHistoryDto
                {
                    Timestamp = item.Date,
                    ComponentName = item.ComponentName,
                    PropertyName = item.PropertyName,
                    OldValue = item.OldValueId == 0
                        ? (item.OldNumericValue?.ToString() ?? string.Empty)
                        : (item.OldValueName ?? item.OldNumericValue?.ToString() ?? string.Empty),
                    NewValue = item.NewValueId == 0
                        ? (item.NewNumericValue?.ToString() ?? string.Empty)
                        : (item.NewValueName ?? item.NewNumericValue?.ToString() ?? string.Empty),
                    User = "System",
                    Comment = item.Comments ?? ""
                };

                if (!string.IsNullOrWhiteSpace(item.Comments))
                {
                    try
                    {
                        var xdoc = XDocument.Parse(item.Comments);
                        var root = xdoc.Root;
                        if (root != null)
                        {
                            var userAttr = root.Attribute("User");
                            if (userAttr != null)
                            {
                                dto.User = userAttr.Value;
                            }
                            dto.Comment = root.Value;
                        }
                    }
                    catch
                    {
                        // Fallback to raw string if XML parsing fails
                        dto.Comment = item.Comments;
                    }
                }

                result.Add(dto);
            }

            return result;
        }

        public async Task<LastClientContactDto?> GetLastClientContactAsync(int clientId)
        {
            return await _context.Database.SqlQueryRaw<LastClientContactDto>(@"
                SELECT TOP (1)
                    client_id AS ClientId,
                    timestmp AS Timestmp,
                    ISNULL(timeoffset, 0) AS Timeoffset,
                    ISNULL(lastmsgid, 0) AS LastMsgId,
                    ISNULL(CONVERT(varchar(50), lastmsgreply), 'N/A') AS LastMsgReply,
                    nextmessageexpected AS NextMessageExpected,
                    msgrejectedinfo AS MsgRejectedInfo,
                    ISNULL(msgqueuesize, 0) AS MsgQueueSize,
                    msgcreatedts AS MsgCreatedTs,
                    CAST(ISNULL(replayflag, 0) AS bit) AS ReplayFlag,
                    CAST(ISNULL(mutual_auth, 0) AS bit) AS MutualAuth
                FROM dbo.LastClientContact
                WHERE client_id = {0}
                ORDER BY timestmp DESC", clientId).FirstOrDefaultAsync();
        }

        public async Task<List<AtmSoftwareInfoDto>> GetAtmSoftwareInfoAsync(int clientId)
        {
            return await _context.Database.SqlQueryRaw<AtmSoftwareInfoDto>(@"
                SELECT
                    si.sw_id AS SwId,
                    si.sw_name AS SoftwareName,
                    si.version AS Version,
                    ins.install_type AS InstallType,
                    CASE ins.install_type
                        WHEN -1 THEN 'Unknown'
                        WHEN 0 THEN 'KTC software package'
                        WHEN 1 THEN 'Windows Hotfix'
                        WHEN 2 THEN 'MSI installed program'
                        WHEN 3 THEN 'Operating system'
                        WHEN 4 THEN 'KTC marketing package'
                        WHEN 5 THEN 'Other KAL software'
                        WHEN 6 THEN 'Hypervisor'
                        ELSE 'Other'
                    END AS InstallTypeLabel,
                    ins.install_date AS InstallDate,
                    ISNULL(r.rules_count, 0) AS ComplianceRulesCount
                FROM dbo.InstalledSoftware ins
                INNER JOIN dbo.SoftwareInfo si ON si.sw_id = ins.sw_id
                LEFT JOIN (
                    SELECT sw_id, COUNT(*) AS rules_count
                    FROM dbo.SoftwareInfoComplianceRules
                    GROUP BY sw_id
                ) r ON r.sw_id = si.sw_id
                WHERE ins.client_id = {0}
                ORDER BY ins.install_date DESC, si.sw_name ASC", clientId).ToListAsync();
        }

        public async Task<List<AtmCertificateDto>> GetAtmCertificatesAsync(int clientId)
        {
            return await _context.Database.SqlQueryRaw<AtmCertificateDto>(@"
                SELECT
                    CASE cl.certificate_store
                        WHEN 1 THEN 'LMRoot'
                        WHEN 2 THEN 'LMPersonal'
                        WHEN 3 THEN 'CURoot'
                        WHEN 4 THEN 'CUPersonal'
                        WHEN 5 THEN 'LMIntermediate'
                        WHEN 6 THEN 'LMTrustedPeople'
                        WHEN 7 THEN 'CUIntermediate'
                        WHEN 8 THEN 'CUTrustedPeople'
                        ELSE 'Unknown'
                    END AS CertificateStore,
                    cl.subject_name AS SubjectName,
                    cl.issuer AS Issuer,
                    cl.friendly_name AS FriendlyName,
                    cl.not_before AS NotBefore,
                    cl.not_after AS NotAfter,
                    CAST(cl.is_private AS bit) AS IsPrivate,
                    cl.addedtime AS FirstSeen,
                    UPPER(CONVERT(varchar(128), cl.serial, 2)) AS SerialNumber
                FROM dbo.ClientCertificates cc
                INNER JOIN dbo.CertificateList cl ON cl.certificate_id = cc.certificate_id
                WHERE cc.client_id = {0}
                ORDER BY
                    cl.certificate_store ASC,
                    cl.not_after ASC,
                    cl.subject_name ASC", clientId).ToListAsync();
        }

        public async Task<List<AtmActionDto>> GetClientActionsAsync(int clientId, DateTime? from, DateTime? to)
        {
            // Notes:
            // - Actions.comments is XML. We convert to NVARCHAR for parsing in C#.
            // - We filter by client_id and time window to avoid scanning.
            var fromDate = from ?? DateTime.UtcNow.AddDays(-90);
            var toDate = to ?? DateTime.UtcNow.AddDays(1);

            var raw = await _context.Database.SqlQueryRaw<ActionRaw>(@"
                SELECT TOP (500)
                    a.action_id AS ActionId,
                    ct.commandname AS CommandName,
                    a.status_id AS StatusId,
                    a.starttime AS Started,
                    a.endtime AS Finished,
                    CAST(a.comments AS nvarchar(max)) AS CommentsXml
                FROM dbo.Actions a
                LEFT JOIN dbo.CommandTypes ct ON ct.command_id = a.command_id
                WHERE a.client_id = {0}
                  AND ISNULL(a.addedtime, a.starttime) >= {1}
                  AND ISNULL(a.addedtime, a.starttime) <= {2}
                ORDER BY ISNULL(a.addedtime, a.starttime) DESC, a.action_id DESC",
                clientId, fromDate, toDate).ToListAsync();

            var result = new List<AtmActionDto>();

            foreach (var row in raw)
            {
                var (user, lastComment) = ParseLastActionComment(row.CommentsXml);

                result.Add(new AtmActionDto
                {
                    ActionId = row.ActionId,
                    User = user,
                    Command = string.IsNullOrWhiteSpace(row.CommandName) ? "Unknown" : row.CommandName,
                    Status = MapActionStatus(row.StatusId),
                    Started = row.Started,
                    Finished = row.Finished,
                    LastComment = lastComment
                });
            }

            return result;
        }

        public async Task<List<ElectronicJournalEntryDto>> GetElectronicJournalAsync(int clientId, DateTime from, DateTime to)
        {
            // We don't have the EJ line table in this DB snapshot.
            // Fallback: use TransactionData_P as log-like events (timestamp + type + amounts + EJ start/end ids).
            return await _context.Database.SqlQueryRaw<ElectronicJournalEntryDto>(@"
                SELECT TOP (2000)
                    t.transaction_id AS TransactionId,
                    t.transaction_timestamp AS [Timestamp],
                    ISNULL(tt.transactiontype_name, 'Unknown') AS [Type],
                    t.amount AS Amount,
                    t.effective_amount AS EffectiveAmount,
                    t.start_client_EJ_id AS EjStartId,
                    t.end_client_EJ_id AS EjEndId
                FROM dbo.TransactionData_P t
                LEFT JOIN dbo.TransactionTypeMappings map ON map.txtype_field_lookup_id = t.txtype_field_lookup_id
                LEFT JOIN dbo.TransactionTypes tt ON tt.transactiontype_id = map.transactiontype_id
                WHERE t.client_id = {0}
                  AND t.transaction_timestamp >= {1}
                  AND t.transaction_timestamp <= {2}
                ORDER BY t.transaction_timestamp DESC, t.transaction_id DESC",
                clientId, from, to).ToListAsync();
        }

        public async Task<List<LookupItemDto>> GetTransactionTypeLookupsAsync()
        {
            const short fieldId = 10; // observed: CashWithdrawal/FastCash
            return await _context.StxFieldLookups.AsNoTracking()
                .Where(x => x.FieldId == fieldId && x.FieldLookupId != 0)
                .OrderBy(x => x.FieldCode)
                .Select(x => new LookupItemDto { Id = x.FieldLookupId, Code = x.FieldCode })
                .ToListAsync();
        }

        public async Task<List<LookupItemDto>> GetTransactionReasonLookupsAsync()
        {
            const short fieldId = 5; // observed: Normal/CustomerCancel/CardReaderError...
            return await _context.StxFieldLookups.AsNoTracking()
                .Where(x => x.FieldId == fieldId && x.FieldLookupId != 0)
                .OrderBy(x => x.FieldCode)
                .Select(x => new LookupItemDto { Id = x.FieldLookupId, Code = x.FieldCode })
                .ToListAsync();
        }

        public async Task<List<LookupItemDto>> GetTransactionCompletionLookupsAsync()
        {
            const short fieldId = 11; // observed: SUCCESS/FAIL
            return await _context.StxFieldLookups.AsNoTracking()
                .Where(x => x.FieldId == fieldId && x.FieldLookupId != 0)
                .OrderBy(x => x.FieldCode)
                .Select(x => new LookupItemDto { Id = x.FieldLookupId, Code = x.FieldCode })
                .ToListAsync();
        }

        public async Task<List<TransactionAuditDto>> SearchAtmTransactionsAsync(TransactionSearchCriteria criteria)
        {
            // NOTE: TransactionData_P can be huge. We use a dynamically-built SQL query:
            // - WHERE clauses are only added when a filter is provided
            // - TOP (500) hard limit
            // - LEFT JOIN x3 to resolve codes
            // This avoids EF translation limits with keyless entities and is faster/predictable.

            var from = criteria.From ?? DateTime.UtcNow.AddDays(-1);
            var to = criteria.To ?? DateTime.UtcNow.AddDays(1);

            var sql = @"
                SELECT TOP (500)
                    t.session_id AS SessionId,
                    t.transaction_id AS TransactionId,
                    t.transaction_uuid AS TransactionGuid,
                    t.transaction_timestamp AS [Timestamp],
                    ISNULL(tl.field_code, 'Unknown') AS [Type],
                    t.amount AS Amount,
                    ISNULL(cl.field_code, 'Unknown') AS Completion,
                    ISNULL(rl.field_code, 'Unknown') AS Reason,
                    CASE WHEN t.start_client_EJ_id IS NOT NULL OR t.end_client_EJ_id IS NOT NULL
                        THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS HasEj
                FROM dbo.TransactionData_P t
                LEFT JOIN dbo.STX_FieldLookups tl ON tl.field_lookup_id = t.txtype_field_lookup_id
                LEFT JOIN dbo.STX_FieldLookups cl ON cl.field_lookup_id = t.completion_field_lookup_id
                LEFT JOIN dbo.STX_FieldLookups rl ON rl.field_lookup_id = t.reason_field_lookup_id
                WHERE t.client_id = {0}";

            var args = new List<object> { criteria.ClientId };
            var i = 1;

            // Direct find has priority (fast path)
            if (criteria.TransactionGuid.HasValue)
            {
                sql += $" AND t.transaction_uuid = {{{i}}}";
                args.Add(criteria.TransactionGuid.Value);
                i++;
            }
            else if (criteria.TransactionId.HasValue)
            {
                sql += $" AND t.transaction_id = {{{i}}}";
                args.Add(criteria.TransactionId.Value);
                i++;
            }
            else if (criteria.SessionId.HasValue)
            {
                sql += $" AND t.session_id = {{{i}}}";
                args.Add(criteria.SessionId.Value);
                i++;
            }
            else
            {
                sql += $" AND t.transaction_timestamp >= {{{i}}}";
                args.Add(from);
                i++;

                sql += $" AND t.transaction_timestamp <= {{{i}}}";
                args.Add(to);
                i++;

                if (criteria.Amount.HasValue)
                {
                    sql += $" AND t.amount = {{{i}}}";
                    args.Add(criteria.Amount.Value);
                    i++;
                }

                if (criteria.TypeLookupId.HasValue)
                {
                    sql += $" AND t.txtype_field_lookup_id = {{{i}}}";
                    args.Add(criteria.TypeLookupId.Value);
                    i++;
                }

                if (criteria.ReasonLookupId.HasValue)
                {
                    sql += $" AND t.reason_field_lookup_id = {{{i}}}";
                    args.Add(criteria.ReasonLookupId.Value);
                    i++;
                }

                if (criteria.CompletionLookupId.HasValue)
                {
                    sql += $" AND t.completion_field_lookup_id = {{{i}}}";
                    args.Add(criteria.CompletionLookupId.Value);
                    i++;
                }
            }

            sql += " ORDER BY t.transaction_timestamp DESC, t.transaction_id DESC";

            return await _context.Database.SqlQueryRaw<TransactionAuditDto>(sql, args.ToArray()).ToListAsync();
        }

        public async Task<List<VideoJournalEventDto>> SearchVideoJournalAsync(int clientId, DateTime from, DateTime to, string? search)
        {
            // This DB snapshot may not contain the central VideoJournal table.
            // We support known media tables (ChequeMedia_*) when present; otherwise return empty.
            // If later a real VideoJournal/CameraImages table exists, we can extend the candidates.

            var hasChequeP = await TableExistsAsync("ChequeMedia_P");
            var hasChequeS = await TableExistsAsync("ChequeMedia_S");

            if (!hasChequeP && !hasChequeS)
            {
                return new List<VideoJournalEventDto>();
            }

            // We query both tables (if exist) via UNION ALL and map to a standard event list.
            // Join TransactionData_P on tx_uuid to get amounts + type/completion lookups.
            var sql = @"
                WITH Media AS (
                    SELECT
                        m.media_id,
                        m.client_id,
                        m.tx_uuid,
                        m.file_name,
                        m.addedtime,
                        m.error_desc
                    FROM dbo.ChequeMedia_P m
                    WHERE m.client_id = {0}
                      AND m.addedtime >= {1}
                      AND m.addedtime <= {2}
                    UNION ALL
                    SELECT
                        m.media_id,
                        m.client_id,
                        m.tx_uuid,
                        m.file_name,
                        m.addedtime,
                        m.error_desc
                    FROM dbo.ChequeMedia_S m
                    WHERE m.client_id = {0}
                      AND m.addedtime >= {1}
                      AND m.addedtime <= {2}
                )
                SELECT TOP (500)
                    CONCAT('TX=', CONVERT(varchar(36), med.tx_uuid), ' | File=', ISNULL(med.file_name, '')) AS TransactionInformation,
                    t.transaction_id AS TransactionId,
                    t.session_id AS SessionId,
                    t.transaction_uuid AS TransactionGuid,
                    med.addedtime AS [Timestamp],
                    ISNULL(tl.field_code, 'Unknown') AS [Type],
                    ISNULL(cl.field_code, 'Unknown') AS Completion,
                    'XFS-ChequeMedia' AS CameraPosition,
                    '' AS Position,
                    CASE WHEN ISNULL(cl.field_code, '') IN ('FAIL','ERROR') THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS Suspect,
                    t.amount AS Amount,
                    med.media_id AS MediaId,
                    ISNULL(med.file_name, '') AS MediaFileName,
                    '' AS MediaUrl,
                    CASE 
                        WHEN LOWER(ISNULL(med.file_name,'')) LIKE '%.mp4' THEN 'video'
                        WHEN LOWER(ISNULL(med.file_name,'')) LIKE '%.jpg' OR LOWER(ISNULL(med.file_name,'')) LIKE '%.jpeg' OR LOWER(ISNULL(med.file_name,'')) LIKE '%.png' THEN 'image'
                        ELSE 'unknown'
                    END AS MediaKind
                FROM Media med
                LEFT JOIN dbo.TransactionData_P t ON t.client_id = med.client_id AND t.transaction_uuid = med.tx_uuid
                LEFT JOIN dbo.STX_FieldLookups tl ON tl.field_lookup_id = t.txtype_field_lookup_id
                LEFT JOIN dbo.STX_FieldLookups cl ON cl.field_lookup_id = t.completion_field_lookup_id
                WHERE 1=1
                /**search**/
                ORDER BY med.addedtime DESC, med.media_id DESC";

            // dynamic search (optional)
            var args = new List<object> { clientId, from, to };
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                var searchLike = $"%{s}%";
                sql = sql.Replace("/**search**/", " AND (CONVERT(varchar(36), med.tx_uuid) LIKE {3} OR ISNULL(med.file_name,'') LIKE {3} OR CONVERT(varchar(50), ISNULL(t.amount, 0)) LIKE {3})");
                args.Add(searchLike);
            }
            else
            {
                sql = sql.Replace("/**search**/", string.Empty);
            }

            var rows = await _context.Database.SqlQueryRaw<VideoJournalEventDto>(sql, args.ToArray()).ToListAsync();

            // Fill MediaUrl (needs controller base route, we keep relative here)
            foreach (var r in rows)
            {
                r.MediaUrl = $"/api/atm/clients/{clientId}/videojournal/media/{r.MediaId}";
            }

            return rows;
        }

        public async Task<(byte[] Data, string FileName)?> GetVideoJournalMediaAsync(int clientId, long mediaId)
        {
            // In this DB, known media table is ChequeMedia_* (varbinary). If absent, we return null.
            var hasChequeP = await TableExistsAsync("ChequeMedia_P");
            var hasChequeS = await TableExistsAsync("ChequeMedia_S");

            if (!hasChequeP && !hasChequeS)
            {
                return null;
            }

            // Try P then S
            var sqlP = @"
                SELECT TOP 1
                    m.media_data AS Data,
                    ISNULL(m.file_name, '') AS FileName
                FROM dbo.ChequeMedia_P m
                WHERE m.client_id = {0}
                  AND m.media_id = {1}";

            var sqlS = @"
                SELECT TOP 1
                    m.media_data AS Data,
                    ISNULL(m.file_name, '') AS FileName
                FROM dbo.ChequeMedia_S m
                WHERE m.client_id = {0}
                  AND m.media_id = {1}";

            var row = await _context.Database.SqlQueryRaw<MediaRow>(sqlP, clientId, mediaId).FirstOrDefaultAsync();
            row ??= await _context.Database.SqlQueryRaw<MediaRow>(sqlS, clientId, mediaId).FirstOrDefaultAsync();

            if (row == null || row.Data == null || row.Data.Length == 0)
            {
                return null;
            }

            var fileName = string.IsNullOrWhiteSpace(row.FileName) ? $"media_{mediaId}.bin" : row.FileName;
            return (row.Data, fileName);
        }

        private class MediaRow
        {
            public byte[] Data { get; set; } = Array.Empty<byte>();
            public string FileName { get; set; } = string.Empty;
        }

        public async Task<AtmAvailabilityReportDto> GetAtmAvailabilityAsync(int clientId, DateTime from, DateTime to)
        {
            // Use hourly aggregates from OverallAvailability_P (already seconds by state).
            // Also compute Top 5 unavailable reasons + Top 5 error codes.

            var totals = await _context.Database.SqlQueryRaw<AvailabilityTotalsRaw>(@"
                SELECT
                    SUM(CAST(sec_is  AS int)) AS SecIs,
                    SUM(CAST(sec_oos AS int)) AS SecOos,
                    SUM(CAST(sec_ls  AS int)) AS SecLs,
                    SUM(CAST(sec_rs  AS int)) AS SecRs,
                    SUM(CAST(sec_sus AS int)) AS SecSus,
                    SUM(CAST(sec_fb  AS int)) AS SecFb,
                    SUM(CAST(sec_anr AS int)) AS SecAnr,
                    SUM(CAST(sec_knr AS int)) AS SecKnr
                FROM dbo.OverallAvailability_P
                WHERE client_id = {0}
                  AND timestmp >= {1}
                  AND timestmp <= {2}", clientId, from, to).FirstOrDefaultAsync();

            totals ??= new AvailabilityTotalsRaw();

            var stateItems = new List<(string Name, int Seconds)>
            {
                ("In service", totals.SecIs ?? 0),
                ("Out of service", totals.SecOos ?? 0),
                ("Local supervisor", totals.SecLs ?? 0),
                ("Remote supervisor", totals.SecRs ?? 0),
                ("Suspended", totals.SecSus ?? 0),
                ("Fallback", totals.SecFb ?? 0),
                ("Not running", totals.SecAnr ?? 0),
                ("No data", totals.SecKnr ?? 0)
            };

            var totalSeconds = stateItems.Sum(x => x.Seconds);
            if (totalSeconds < 0) totalSeconds = 0;

            var uptimeSeconds = totals.SecIs ?? 0;
            if (uptimeSeconds < 0) uptimeSeconds = 0;

            var downtimeSeconds = Math.Max(0, totalSeconds - uptimeSeconds);

            decimal pct(int sec) => totalSeconds <= 0 ? 0 : Math.Round((decimal)sec * 100m / totalSeconds, 2);

            var serviceStates = stateItems
                .Select(s => new ServiceStateMetricDto
                {
                    State = s.Name,
                    Seconds = s.Seconds,
                    Duration = FormatDuration(s.Seconds),
                    Percent = pct(s.Seconds)
                })
                .OrderByDescending(x => x.Seconds)
                .ToList();

            var topUnavailableReasons = await _context.Database.SqlQueryRaw<UnavailableReasonRaw>(@"
                SELECT TOP (5)
                    our.una_reason_id AS ReasonId,
                    ISNULL(ur.una_reason_message, 'Unknown') AS Reason,
                    SUM(CAST(our.sec_duration AS int)) AS Seconds
                FROM dbo.OverallUnavailableReasons_P our
                LEFT JOIN dbo.UnavailableReasons ur ON ur.una_reason_id = our.una_reason_id
                WHERE our.timestmp >= {0}
                  AND our.timestmp <= {1}
                  AND EXISTS (
                      SELECT 1
                      FROM dbo.OverallAvailability_P oa
                      WHERE oa.overall_avail_id = our.overall_avail_id
                        AND oa.client_id = {2}
                  )
                GROUP BY our.una_reason_id, ur.una_reason_message
                ORDER BY SUM(CAST(our.sec_duration AS int)) DESC", from, to, clientId).ToListAsync();

            var topUnavailableDtos = topUnavailableReasons
                .Select(r => new UnavailableReasonMetricDto
                {
                    ReasonId = r.ReasonId,
                    Reason = r.Reason,
                    Seconds = r.Seconds,
                    Duration = FormatDuration(r.Seconds),
                    Percent = pct(r.Seconds)
                })
                .ToList();

            // Error codes: clamp opened/closed to [from,to] and sum seconds impact.
            var topErrorCodes = await _context.Database.SqlQueryRaw<ErrorCodeRaw>(@"
                WITH R AS (
                    SELECT
                        he.errorcodetype_id AS ErrorCodeTypeId,
                        CASE WHEN he.timestamp_opened < {0} THEN {0} ELSE he.timestamp_opened END AS StartTs,
                        CASE
                            WHEN he.timestamp_closed IS NULL OR he.timestamp_closed > {1} THEN {1}
                            ELSE he.timestamp_closed
                        END AS EndTs
                    FROM dbo.HistoricalErrorCodes_P_8129 he
                    WHERE he.client_id = {2}
                      AND he.timestamp_opened < {1}
                      AND (he.timestamp_closed IS NULL OR he.timestamp_closed > {0})
                )
                SELECT TOP (5)
                    r.ErrorCodeTypeId,
                    ISNULL(ect.errorcode, CONVERT(varchar(10), r.ErrorCodeTypeId)) AS Code,
                    ISNULL(ect.errortext, '') AS Reason,
                    SUM(CASE WHEN DATEDIFF(SECOND, r.StartTs, r.EndTs) > 0 THEN DATEDIFF(SECOND, r.StartTs, r.EndTs) ELSE 0 END) AS Seconds
                FROM R r
                LEFT JOIN dbo.ErrorCodeTypes ect ON ect.errorcodetype_id = r.ErrorCodeTypeId
                GROUP BY r.ErrorCodeTypeId, ect.errorcode, ect.errortext
                ORDER BY SUM(CASE WHEN DATEDIFF(SECOND, r.StartTs, r.EndTs) > 0 THEN DATEDIFF(SECOND, r.StartTs, r.EndTs) ELSE 0 END) DESC",
                from, to, clientId).ToListAsync();

            var topErrorDtos = topErrorCodes
                .Select(e => new ErrorCodeMetricDto
                {
                    ErrorCodeTypeId = e.ErrorCodeTypeId,
                    Code = e.Code,
                    Reason = e.Reason,
                    Seconds = e.Seconds,
                    Duration = FormatDuration(e.Seconds),
                    Percent = pct(e.Seconds)
                })
                .ToList();

            return new AtmAvailabilityReportDto
            {
                From = from,
                To = to,
                TotalSeconds = totalSeconds,
                TotalDuration = FormatDuration(totalSeconds),
                ServiceStates = serviceStates,
                UptimeSeconds = uptimeSeconds,
                UptimeDuration = FormatDuration(uptimeSeconds),
                UptimePercent = pct(uptimeSeconds),
                DowntimeSeconds = downtimeSeconds,
                DowntimeDuration = FormatDuration(downtimeSeconds),
                DowntimePercent = pct(downtimeSeconds),
                TopUnavailableReasons = topUnavailableDtos,
                TopErrorCodes = topErrorDtos,
                CoveringText = $"Covering calculated hours from {from:yyyy-MM-dd HH:mm} to {to:yyyy-MM-dd HH:mm}"
            };
        }

        private static string FormatDuration(int seconds)
        {
            if (seconds <= 0) return "0h 0m";
            var ts = TimeSpan.FromSeconds(seconds);
            var hours = (int)Math.Floor(ts.TotalHours);
            var mins = ts.Minutes;
            return $"{hours}h {mins}m";
        }

        private class AvailabilityTotalsRaw
        {
            public int? SecIs { get; set; }
            public int? SecOos { get; set; }
            public int? SecLs { get; set; }
            public int? SecRs { get; set; }
            public int? SecSus { get; set; }
            public int? SecFb { get; set; }
            public int? SecAnr { get; set; }
            public int? SecKnr { get; set; }
        }

        private class UnavailableReasonRaw
        {
            public short ReasonId { get; set; }
            public string Reason { get; set; } = string.Empty;
            public int Seconds { get; set; }
        }

        private class ErrorCodeRaw
        {
            public short ErrorCodeTypeId { get; set; }
            public string Code { get; set; } = string.Empty;
            public string Reason { get; set; } = string.Empty;
            public int Seconds { get; set; }
        }

        public async Task<List<AppCounterDto>> GetApplicationCountersAsync(int clientId, short componentId)
        {
            return await _context.Database.SqlQueryRaw<AppCounterDto>(@"
                SELECT
                    c.component_id AS ComponentId,
                    c.property_id AS PropertyId,
                    p.propertyname AS PropertyName,
                    ISNULL(cur.currency, '') AS CurrencyCode,
                    CASE WHEN c.denomination_id = 0 THEN NULL ELSE c.denomination_id END AS DenominationId,
                    d.currencyvalue AS DenominationValue,
                    c.counter_value AS CounterValue,
                    c.timestmp AS Timestmp,
                    c.last_reset_timestmp AS LastResetTimestmp
                FROM dbo.CurrentCounters c
                INNER JOIN dbo.PropertyList p ON p.property_id = c.property_id
                LEFT JOIN dbo.Denominations d ON d.denomination_id = c.denomination_id
                LEFT JOIN dbo.Currencies cur ON cur.currency_id = d.currency_id
                WHERE c.client_id = {0}
                  AND c.component_id = {1}
                ORDER BY p.propertyname, c.timestmp DESC", clientId, componentId).ToListAsync();
        }

        public async Task<List<ReplenishmentDto>> GetReplenishmentsAsync(int clientId, short componentId)
        {
            var query =
                from replenishment in _context.Replenishments.AsNoTracking()
                where replenishment.ClientId == clientId && replenishment.ComponentId == componentId
                join counter in _context.ReplenishmentCounters.AsNoTracking()
                    on replenishment.ReplenishmentId equals counter.ReplenishmentId
                join property in _context.PropertyList.AsNoTracking()
                    on counter.PropertyId equals property.PropertyId
                join denomination in _context.Denominations.AsNoTracking()
                    on counter.DenominationId equals denomination.DenominationId into denominationGroup
                let denominationValue = denominationGroup.Select(d => (decimal?)d.CurrencyValue).FirstOrDefault()
                orderby replenishment.Timestmp descending, replenishment.ReplenishmentId descending, property.PropertyName
                select new ReplenishmentDto
                {
                    ReplenishmentId = replenishment.ReplenishmentId,
                    ComponentId = replenishment.ComponentId,
                    Timestmp = replenishment.Timestmp,
                    TransactionId = replenishment.TransactionId,
                    PropertyId = counter.PropertyId,
                    PropertyName = property.PropertyName,
                    DenominationId = counter.DenominationId,
                    DenominationValue = denominationValue,
                    BeforeCount = counter.BeforeCount,
                    AfterCount = counter.AfterCount
                };

            return await query.ToListAsync();
        }

        public async Task<XfsCountersResponseDto> GetXfsCountersAsync(int clientId, short componentId)
        {
            var logicalView = await (
                from status in _context.CurrentCashUnitStatus.AsNoTracking()
                where status.ClientId == clientId && status.ComponentId == componentId
                join currency in _context.Currencies.AsNoTracking()
                    on status.CurrencyId equals currency.CurrencyId into currencyGroup
                let currencyCode = currencyGroup.Select(c => c.Code).FirstOrDefault()
                orderby status.CashUnit
                select new XfsCounterDto
                {
                    ViewType = "logical",
                    ComponentId = status.ComponentId,
                    Number = status.CashUnit.ToString(),
                    TypeId = status.TypeId,
                    CurrencyCode = (currencyCode ?? string.Empty).Trim(),
                    CurrencyValue = status.CurrencyValue,
                    UnitCount = status.UnitCount,
                    TotalValue = status.TotalValue,
                    StatusId = status.StatusId,
                    Timestmp = status.Timestmp
                }).ToListAsync();

            var physicalRows = await (
                from cassette in _context.PhysicalCassettes.AsNoTracking()
                where cassette.ClientId == clientId && cassette.ComponentId == componentId
                join count in _context.PhysicalCassetteCounts.AsNoTracking()
                    on cassette.CassetteId equals count.CassetteId
                join currentStatus in _context.PhysicalCassetteCurrentStatus.AsNoTracking()
                    on cassette.CassetteId equals currentStatus.CassetteId
                join denomination in _context.Denominations.AsNoTracking()
                    on count.DenominationId equals denomination.DenominationId into denominationGroup
                let denominationValue = denominationGroup.Select(d => (decimal?)d.CurrencyValue).FirstOrDefault()
                orderby cassette.Position
                select new XfsCounterDto
                {
                    ViewType = "physical",
                    ComponentId = cassette.ComponentId,
                    Number = cassette.Position,
                    TypeId = cassette.TypeId,
                    DenominationId = count.DenominationId == 0 ? null : count.DenominationId,
                    DenominationValue = denominationValue,
                    Count = count.CassCount,
                    StatusId = currentStatus.StatusId,
                    Timestmp = currentStatus.Timestmp
                }).ToListAsync();

            return new XfsCountersResponseDto
            {
                LogicalView = logicalView,
                PhysicalView = physicalRows
            };
        }

        public async Task<List<AtmTicketDto>> GetAtmTicketsAsync(int clientId, int days, string statusFilter)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-days);

            var ticketIdCol = await FirstExistingColumnAsync("TroubleTickets",
                "trouble_ticket_id", "troubleticket_id", "ticket_id", "ticketid", "id");
            var lastChangeCol = await FirstExistingColumnAsync("TroubleTickets",
                "lastchangedate", "lastchange_date", "lastupdatedate", "updatedtime", "modifieddate");
            var userUpdatedCol = await FirstExistingColumnAsync("TroubleTickets",
                "user_updated", "userupdated", "lastchangeby", "updatedby");
            var slaSummaryCol = await FirstExistingColumnAsync("TroubleTickets",
                "sla_summary", "slasummary", "sla");
            var ttCreatedCol = await FirstExistingColumnAsync("TroubleTickets",
                "creationtime", "created", "createdate", "created_at");
            var tttErrorCodeCol = await FirstExistingColumnAsync("TroubleTicketTypes",
                "errorcode_id", "errorcodeid", "error_code_id");
            var tttTypeNameCol = await FirstExistingColumnAsync("TroubleTicketTypes",
                "tickettype_name", "tickettypename", "ticket_type", "tickettype", "name", "description");
            var ecErrorCodeCol = await FirstExistingColumnAsync("ErrorCodeTypes",
                "errorcode_id", "errorcodeid", "error_code_id");
            var ecCodeCol = await FirstExistingColumnAsync("ErrorCodeTypes", "code", "error_code");
            var ecErrorTextCol = await FirstExistingColumnAsync("ErrorCodeTypes", "error_text", "errortext", "description");
            var userNameCol = await FirstExistingColumnAsync("KTCUsers",
                "user_name", "username", "name", "display_name");
            var clientNameCol = await FirstExistingColumnAsync("Clients",
                "clientname", "client_name", "name");

            var ticketIdExpr = string.IsNullOrWhiteSpace(ticketIdCol) ? "0" : $"CAST(tt.[{ticketIdCol}] AS int)";
            var lastChangeExpr = string.IsNullOrWhiteSpace(lastChangeCol) ? "tt.creationtime" : $"tt.[{lastChangeCol}]";
            var lastChangeByExpr = string.IsNullOrWhiteSpace(userUpdatedCol) ? "'N/A'" : $"tt.[{userUpdatedCol}]";
            var slaSummaryExpr = string.IsNullOrWhiteSpace(slaSummaryCol) ? "''" : $"tt.[{slaSummaryCol}]";
            var ticketTypeExpr = string.IsNullOrWhiteSpace(tttTypeNameCol) ? "''" : $"ttt.[{tttTypeNameCol}]";
            var clientNameExpr = string.IsNullOrWhiteSpace(clientNameCol) ? "''" : $"c.[{clientNameCol}]";
            var createdExpr = string.IsNullOrWhiteSpace(ttCreatedCol) ? "GETUTCDATE()" : $"tt.[{ttCreatedCol}]";
            var canJoinErrorCode = !string.IsNullOrWhiteSpace(tttErrorCodeCol) && !string.IsNullOrWhiteSpace(ecErrorCodeCol);
            var errorIdExpr = canJoinErrorCode ? $"CAST(ISNULL(ec.[{ecErrorCodeCol}], 0) AS int)" : "0";
            var codeExpr = !string.IsNullOrWhiteSpace(ecCodeCol) ? $"ISNULL(ec.[{ecCodeCol}], '')" : "''";
            var errorTextExpr = !string.IsNullOrWhiteSpace(ecErrorTextCol) ? $"ISNULL(ec.[{ecErrorTextCol}], '')" : "''";
            var errorCodeJoin = canJoinErrorCode
                ? $"LEFT JOIN dbo.ErrorCodeTypes ec ON ec.[{ecErrorCodeCol}] = ttt.[{tttErrorCodeCol}]"
                : "LEFT JOIN dbo.ErrorCodeTypes ec ON 1 = 0";
            var ownerExpr = string.IsNullOrWhiteSpace(userNameCol) ? "'N/A'" : $"u.[{userNameCol}]";

            var query = @"
                SELECT
                    " + ticketIdExpr + @" AS TicketId,
                    ISNULL(" + ticketTypeExpr + @", 'N/A') AS TicketType,
                    ISNULL(" + clientNameExpr + @", 'N/A') AS ClientName,
                    " + createdExpr + @" AS Created,
                    CASE 
                        WHEN tt.ticketstatus_id IN (3, 4, 5) THEN CAST(1 AS bit)
                        ELSE CAST(0 AS bit)
                    END AS IsClosed,
                    ISNULL(CONVERT(varchar(50), DATEDIFF(HOUR, tt.creationtime, ISNULL(" + lastChangeExpr + @", GETUTCDATE()))), '0') + ' hours' AS Duration,
                    CASE 
                        WHEN tt.ticketstatus_id = 1 THEN 'Open'
                        WHEN tt.ticketstatus_id = 2 THEN 'Dispatched'
                        WHEN tt.ticketstatus_id = 3 THEN 'Closed'
                        WHEN tt.ticketstatus_id = 4 THEN 'AutoClosed'
                        WHEN tt.ticketstatus_id = 5 THEN 'Suspended'
                        ELSE 'Unknown'
                    END AS Status,
                    " + errorIdExpr + @" AS ErrorId,
                    " + codeExpr + @" AS Code,
                    " + errorTextExpr + @" AS ErrorText,
                    ISNULL(" + ownerExpr + @", 'N/A') AS Owner,
                    ISNULL(" + lastChangeByExpr + @", 'N/A') AS LastChangeBy,
                    ISNULL(" + lastChangeExpr + @", tt.creationtime) AS LastChangeDate,
                    ISNULL(" + slaSummaryExpr + @", '') AS SlaSummary,
                    ISNULL(dl.dispatchname, '') AS DispatchedTo,
                    ISNULL(tt.comments, '') AS CommentsXml
                FROM dbo.TroubleTickets tt
                LEFT JOIN dbo.TroubleTicketTypes ttt ON ttt.tickettype_id = tt.tickettype_id
                " + errorCodeJoin + @"
                LEFT JOIN dbo.KTCUsers u ON u.user_id = tt.owner_id
                LEFT JOIN dbo.DispatchList dl ON dl.dispatch_id = tt.dispatch_id
                LEFT JOIN dbo.Clients c ON c.client_id = tt.client_id
                WHERE tt.client_id = {0}
                  AND tt.creationtime >= {1}";

            // Add status filter
            if (statusFilter == "Open/Dispatched")
            {
                query += " AND tt.ticketstatus_id IN (1, 2)";
            }
            else if (statusFilter == "Closed")
            {
                query += " AND tt.ticketstatus_id IN (3, 4, 5)";
            }
            // If "All", no additional filter

            if (lastChangeExpr.Equals("tt.creationtime", StringComparison.OrdinalIgnoreCase))
            {
                query += " ORDER BY tt.creationtime DESC";
            }
            else
            {
                query += " ORDER BY " + lastChangeExpr + " DESC, tt.creationtime DESC";
            }

            var dbResults = await _context.Database.SqlQueryRaw<AtmTicketRaw>(query, clientId, cutoffDate).ToListAsync();

            var tickets = new List<AtmTicketDto>();

            foreach (var row in dbResults)
            {
                var lastComment = "";
                var lastChangeBy = row.LastChangeBy;

                // Try to parse XML comments
                if (!string.IsNullOrWhiteSpace(row.CommentsXml))
                {
                    try
                    {
                        var xdoc = XDocument.Parse(row.CommentsXml);
                        var root = xdoc.Root;
                        if (root != null)
                        {
                            var lastCommentElement = root.Elements("Comment").LastOrDefault();
                            if (lastCommentElement != null)
                            {
                                lastComment = lastCommentElement.Value;
                                var userAttr = lastCommentElement.Attribute("User");
                                if (userAttr != null)
                                {
                                    lastChangeBy = userAttr.Value;
                                }
                            }
                        }
                    }
                    catch
                    {
                        lastComment = row.CommentsXml;
                    }
                }

                tickets.Add(new AtmTicketDto
                {
                    TicketId = row.TicketId,
                    TicketType = string.IsNullOrWhiteSpace(row.TicketType) ? "N/A" : row.TicketType,
                    ClientName = string.IsNullOrWhiteSpace(row.ClientName) ? "N/A" : row.ClientName,
                    Created = row.Created,
                    IsClosed = row.IsClosed,
                    Duration = string.IsNullOrWhiteSpace(row.Duration) ? "-" : row.Duration,
                    Status = string.IsNullOrWhiteSpace(row.Status) ? "Unknown" : row.Status,
                    ErrorId = row.ErrorId,
                    Code = row.Code ?? string.Empty,
                    ErrorText = row.ErrorText ?? string.Empty,
                    Owner = row.Owner ?? "N/A",
                    LastChangeBy = lastChangeBy ?? string.Empty,
                    LastChangeDate = row.LastChangeDate,
                    LastComment = lastComment,
                    SlaSummary = row.SlaSummary ?? string.Empty,
                    DispatchedTo = row.DispatchedTo ?? string.Empty
                });
            }

            return tickets;
        }

        private sealed class ActionRaw
        {
            public long ActionId { get; set; }
            public string? CommandName { get; set; }
            public byte StatusId { get; set; }
            public DateTime? Started { get; set; }
            public DateTime? Finished { get; set; }
            public string? CommentsXml { get; set; }
        }

        private static string MapActionStatus(byte statusId)
        {
            // Observed in DB:
            // 3 -> completed
            // 6 -> cancelled
            return statusId switch
            {
                0 => "Pending",
                1 => "Queued",
                2 => "Running",
                3 => "Completed",
                4 => "Failed",
                5 => "Retrying",
                6 => "Cancelled",
                _ => $"Status {statusId}"
            };
        }

        private static (string user, string lastComment) ParseLastActionComment(string? commentsXml)
        {
            if (string.IsNullOrWhiteSpace(commentsXml))
            {
                return ("", "");
            }

            try
            {
                var xdoc = XDocument.Parse(commentsXml);
                var last = xdoc.Descendants("Comment").LastOrDefault();
                if (last == null)
                {
                    return ("", "");
                }

                var user = last.Attribute("User")?.Value ?? "";
                var text = last.Value ?? "";
                return (user, text);
            }
            catch
            {
                return ("", commentsXml);
            }
        }
    }
}


