using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


#pragma warning disable CS8604 // Possible null reference argument.

namespace KtcWeb.API.Controllers
{
    [ApiController]
    [Route("api/group")]
    public class GroupController : ControllerBase
    {
        private readonly KtcDbContext _context;

        public GroupController(KtcDbContext context)
        {
            _context = context;
        }

        // ====================== GET ALL GROUPS ======================
        [HttpGet]
        public async Task<ActionResult<List<GroupDto>>> GetAllGroups()
        {
            try
            {
                var groups = await _context.Database.SqlQueryRaw<GroupDto>(@"
                    SELECT CAST(group_id AS INT) AS GroupId, 
                           groupname AS GroupName, 
                           CAST(ISNULL(grouptype_id, 0) AS INT) AS GroupTypeId,
                           groupquery AS GroupQuery, 
                           groupdescription AS GroupDescription,
                           ISNULL(include_mothballed, 0) AS IncludeMothballed, 
                           CAST(ISNULL(evaluation_interval, 0) AS INT) AS EvaluationInterval,
                           last_changed_timestamp AS LastChangedTimestamp
                    FROM [KALKTCDB].[dbo].[Groups]
                    ORDER BY groupname
                ").ToListAsync();

                return Ok(groups);
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "? Erreur lors du chargement des groupes", error = ex.Message });
            }
        }

        // ====================== GET GROUP CLIENTS ======================
        [HttpGet("{groupId}/clients")]
        public async Task<ActionResult<List<ClientSimpleDto>>> GetGroupClients(int groupId)
        {
            try
            {
                // ?? Récupérer le groupe pour connaître son type
                var group = await _context.Database.SqlQueryRaw<GroupDto>(@"
                    SELECT 
                        CAST(group_id AS INT) AS GroupId, 
                        groupname AS GroupName, 
                        CAST(ISNULL(grouptype_id, 0) AS INT) AS GroupTypeId,
                        groupquery AS GroupQuery, 
                        groupdescription AS GroupDescription,
                        ISNULL(include_mothballed, 0) AS IncludeMothballed, 
                        CAST(ISNULL(evaluation_interval, 0) AS INT) AS EvaluationInterval,
                        last_changed_timestamp AS LastChangedTimestamp
                    FROM [KALKTCDB].[dbo].[Groups]
                    WHERE group_id = {0}
                ", groupId).FirstOrDefaultAsync();

                if (group == null)
                {
                    return NotFound(new { error = $"Groupe {groupId} non trouvé" });
                }

                // ?? Récupérer les clients selon le type de groupe
                List<ClientSimpleDto> clients;

                if (group.GroupTypeId == 1)
                {
                    // Groupe spécial : TOUS les clients
                    clients = await _context.Database.SqlQueryRaw<ClientSimpleDto>(@"
                        SELECT 
                            c.client_id      AS ClientId,
                            c.clientname     AS ClientName,
                            c.networkaddress AS NetworkAddress,
                            c.active         AS Active
                        FROM [KALKTCDB].[dbo].[Clients] c
                        WHERE c.client_id > 0
                        ORDER BY c.clientname
                    ").ToListAsync();
                }
                else if (group.GroupTypeId == 4 && !string.IsNullOrEmpty(group.GroupQuery))
                {
                    // Groupe dynamique : utiliser la requête stockée
                    clients = await _context.Database.SqlQueryRaw<ClientSimpleDto>(@"
                        SELECT 
                            c.client_id      AS ClientId,
                            c.clientname     AS ClientName,
                            c.networkaddress AS NetworkAddress,
                            c.active         AS Active
                        FROM [KALKTCDB].[dbo].[Clients] c
                        INNER JOIN [KALKTCDB].[dbo].[ClientGroups] cg 
                            ON c.client_id = cg.client_id
                        WHERE cg.group_id = {0}
                        ORDER BY c.clientname
                    ", groupId).ToListAsync();
                }
                else
                {
                    // Groupe normal : clients associés explicitement
                    clients = await _context.Database.SqlQueryRaw<ClientSimpleDto>(@"
                        SELECT 
                            c.client_id      AS ClientId,
                            c.clientname     AS ClientName,
                            c.networkaddress AS NetworkAddress,
                            c.active         AS Active
                        FROM [KALKTCDB].[dbo].[Clients] c
                        INNER JOIN [KALKTCDB].[dbo].[ClientGroups] cg 
                            ON c.client_id = cg.client_id
                        WHERE cg.group_id = {0}
                        ORDER BY c.clientname
                    ", groupId).ToListAsync();
                }

                return Ok(clients);
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "? Erreur lors du chargement des clients", error = ex.Message });
            }
        }

        // ====================== GET GROUP DETAILS ======================
        [HttpGet("{groupId}")]
        public async Task<ActionResult<GroupDetailsDto>> GetGroupDetails(int groupId)
        {
            try
            {
                // ?? 1. Récupérer le groupe
                var group = await _context.Database.SqlQueryRaw<GroupDto>(@"
                    SELECT 
                        CAST(group_id AS INT) AS GroupId, 
                        groupname AS GroupName, 
                        CAST(ISNULL(grouptype_id, 0) AS INT) AS GroupTypeId,
                        groupquery AS GroupQuery, 
                        groupdescription AS GroupDescription,
                        ISNULL(include_mothballed, 0) AS IncludeMothballed, 
                        CAST(ISNULL(evaluation_interval, 0) AS INT) AS EvaluationInterval,
                        last_changed_timestamp AS LastChangedTimestamp
                    FROM [KALKTCDB].[dbo].[Groups]
                    WHERE group_id = {0}
                ", groupId).FirstOrDefaultAsync();

                if (group == null)
                {
                    return NotFound(new { error = $"Groupe {groupId} non trouvé" });
                }

                // ?? 2. Logique de récupération des clients
                List<ClientSimpleDto> clients;

                // Si grouptype_id = 1 ? groupe spécial, retourner TOUS les clients
                if (group.GroupTypeId == 1)
                {
                    clients = await _context.Database.SqlQueryRaw<ClientSimpleDto>(@"
                        SELECT 
                            c.client_id      AS ClientId,
                            c.clientname     AS ClientName,
                            c.networkaddress AS NetworkAddress,
                            c.active         AS Active
                        FROM [KALKTCDB].[dbo].[Clients] c
                        WHERE c.client_id > 0
                        ORDER BY c.clientname
                    ").ToListAsync();
                }
                // Si grouptype_id = 4 ? groupe dynamique avec requête associée
                else if (group.GroupTypeId == 4 && !string.IsNullOrEmpty(group.GroupQuery))
                {
                    clients = await _context.Database.SqlQueryRaw<ClientSimpleDto>(@"
                        SELECT 
                            c.client_id      AS ClientId,
                            c.clientname     AS ClientName,
                            c.networkaddress AS NetworkAddress,
                            c.active         AS Active
                        FROM [KALKTCDB].[dbo].[Clients] c
                        INNER JOIN [KALKTCDB].[dbo].[ClientGroups] cg 
                            ON c.client_id = cg.client_id
                        WHERE cg.group_id = {0}
                        ORDER BY c.clientname
                    ", groupId).ToListAsync();
                }
                // Sinon ? membres explicites via ClientGroups
                else
                {
                    clients = await _context.Database.SqlQueryRaw<ClientSimpleDto>(@"
                        SELECT 
                            c.client_id      AS ClientId,
                            c.clientname     AS ClientName,
                            c.networkaddress AS NetworkAddress,
                            c.active         AS Active
                        FROM [KALKTCDB].[dbo].[Clients] c
                        INNER JOIN [KALKTCDB].[dbo].[ClientGroups] cg 
                            ON c.client_id = cg.client_id
                        WHERE cg.group_id = {0}
                        ORDER BY c.clientname
                    ", groupId).ToListAsync();
                }

                // ?? 3. Construire la réponse
                var groupDetails = new GroupDetailsDto
                {
                    GroupId = group.GroupId,
                    GroupName = group.GroupName,
                    GroupTypeId = group.GroupTypeId,
                    GroupQuery = group.GroupQuery,
                    GroupDescription = group.GroupDescription,
                    IncludeMothballed = group.IncludeMothballed,
                    EvaluationInterval = group.EvaluationInterval,
                    LastChangedTimestamp = group.LastChangedTimestamp,
                    Clients = clients
                };

                return Ok(groupDetails);
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "? Erreur lors du chargement du groupe", error = ex.Message });
            }
        }
        // ====================== CREATE GROUP ======================
        [HttpPost]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.GroupName))
                    return BadRequest(new { error = "Le nom du groupe est requis" });

                await _context.Database.ExecuteSqlInterpolatedAsync($@"
                    INSERT INTO [KALKTCDB].[dbo].[Groups] 
                    (groupname, grouptype_id, groupquery, groupdescription, include_mothballed, evaluation_interval, last_changed_timestamp)
                    VALUES ({request.GroupName}, {request.GroupTypeId}, {request.GroupQuery}, 
                            {request.GroupDescription}, {request.IncludeMothballed ?? false}, 
                            {request.EvaluationInterval}, {DateTime.Now})
                ");

                return Ok(new { status = "? Groupe créé avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "? Erreur lors de la création du groupe", error = ex.Message });
            }
        }

        // ====================== UPDATE GROUP ======================
        [HttpPut]
        public async Task<IActionResult> UpdateGroup([FromBody] UpdateGroupRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.GroupName))
                    return BadRequest(new { error = "Le nom du groupe est requis" });

                await _context.Database.ExecuteSqlInterpolatedAsync($@"
                    UPDATE [KALKTCDB].[dbo].[Groups]
                    SET groupname = {request.GroupName},
                        grouptype_id = {request.GroupTypeId},
                        groupquery = {request.GroupQuery},
                        groupdescription = {request.GroupDescription},
                        include_mothballed = {request.IncludeMothballed ?? false},
                        evaluation_interval = {request.EvaluationInterval},
                        last_changed_timestamp = {DateTime.Now}
                    WHERE group_id = {request.GroupId}
                ");

                return Ok(new { status = "? Groupe mis à jour avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "? Erreur lors de la mise à jour du groupe", error = ex.Message });
            }
        }

        // ====================== ADD CLIENT ======================
        [HttpPost("{groupId}/add-client/{clientId}")]
        public async Task<IActionResult> AddClientToGroup(int groupId, int clientId)
        {
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync($@"
                    INSERT INTO [KALKTCDB].[dbo].[ClientGroups] (group_id, client_id)
                    VALUES ({groupId}, {clientId})
                ");

                return Ok(new { status = "? Client ajouté au groupe" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "? Erreur ajout client", error = ex.Message });
            }
        }

        // ====================== REMOVE CLIENT ======================
        [HttpDelete("{groupId}/remove-client/{clientId}")]
        public async Task<IActionResult> RemoveClientFromGroup(int groupId, int clientId)
        {
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync($@"
                    DELETE FROM [KALKTCDB].[dbo].[ClientGroups]
                    WHERE group_id = {groupId} AND client_id = {clientId}
                ");

                return Ok(new { status = "? Client retiré du groupe" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "? Erreur suppression client", error = ex.Message });
            }
        }

        // ====================== DELETE GROUP ======================
        [HttpDelete("{groupId}")]
        public async Task<IActionResult> DeleteGroup(int groupId)
        {
            try
            {
                await _context.Database.ExecuteSqlInterpolatedAsync($@"
                    DELETE FROM [KALKTCDB].[dbo].[ClientGroups]
                    WHERE group_id = {groupId}
                ");

                await _context.Database.ExecuteSqlInterpolatedAsync($@"
                    DELETE FROM [KALKTCDB].[dbo].[Groups]
                    WHERE group_id = {groupId}
                ");

                return Ok(new { status = "? Groupe supprimé" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "? Erreur suppression groupe", error = ex.Message });
            }
        }
    }
}
#pragma warning restore CS8604

