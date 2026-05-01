using KtcWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KtcWeb.API.Controllers
{
    [ApiController]
    [Route("api/atm")]
    public class CashCassetteController : ControllerBase
    {
        private readonly ICashCassetteService _service;
        private readonly ILogger<CashCassetteController> _logger;

        public CashCassetteController(ICashCassetteService service, ILogger<CashCassetteController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get cash unit status for a specific ATM and optional component.
        /// </summary>
        [HttpGet("clients/{clientId}/cash-units")]
        public async Task<ActionResult> GetCashUnitStatus(int clientId, [FromQuery] short? componentId = null)
        {
            try
            {
                var result = await _service.GetCashUnitStatusAsync(clientId, componentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cash unit status for clientId={ClientId}", clientId);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get cash unit summary grouped by component.
        /// </summary>
        [HttpGet("clients/{clientId}/cash-summary")]
        public async Task<ActionResult> GetCashUnitSummary(int clientId)
        {
            try
            {
                var result = await _service.GetCashUnitSummaryAsync(clientId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cash unit summary for clientId={ClientId}", clientId);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get cash flow report for a specific component, with optional date range.
        /// </summary>
        [HttpGet("clients/{clientId}/cash-flow")]
        public async Task<ActionResult> GetCashFlowReport(
            int clientId,
            [FromQuery] short componentId,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            try
            {
                if (componentId == 0)
                {
                    return BadRequest(new { message = "Component ID is required" });
                }

                // FIX: from/to are now forwarded to the service instead of being silently ignored.
                var result = await _service.GetCashFlowReportAsync(clientId, componentId, from, to);
                if (result == null)
                {
                    return NotFound(new { message = "No cash flow data found for this component" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cash flow report for clientId={ClientId}, componentId={ComponentId}", clientId, componentId);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get detailed historical cash-unit records from HistoricalCashUnitStatus_P.
        /// </summary>
        [HttpGet("clients/{clientId}/cash-units-history")]
        public async Task<ActionResult> GetCashUnitHistory(
            int clientId,
            [FromQuery] short? componentId = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] int? limit = 500)
        {
            try
            {
                if (limit.HasValue && limit.Value <= 0)
                {
                    return BadRequest(new { message = "limit must be greater than 0" });
                }

                var result = await _service.GetCashUnitHistoryAsync(clientId, componentId, from, to, limit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cash unit history for clientId={ClientId}, componentId={ComponentId}", clientId, componentId);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get physical cassettes for a specific ATM and optional component.
        /// </summary>
        [HttpGet("clients/{clientId}/cassettes")]
        public async Task<ActionResult> GetPhysicalCassettes(int clientId, [FromQuery] short? componentId = null)
        {
            try
            {
                var result = await _service.GetPhysicalCassettesAsync(clientId, componentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting physical cassettes for clientId={ClientId}", clientId);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get cassette summary grouped by component.
        /// </summary>
        [HttpGet("clients/{clientId}/cassettes-summary")]
        public async Task<ActionResult> GetCassetteSummary(int clientId)
        {
            try
            {
                var result = await _service.GetCassetteSummaryAsync(clientId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cassette summary for clientId={ClientId}", clientId);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get detailed status report for a specific cassette.
        /// </summary>
        [HttpGet("cassettes/{cassetteId}/status")]
        public async Task<ActionResult> GetCassetteStatusReport(long cassetteId)
        {
            try
            {
                var result = await _service.GetCassetteStatusReportAsync(cassetteId);
                if (result == null)
                {
                    return NotFound(new { message = "Cassette not found" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cassette status report for cassetteId={CassetteId}", cassetteId);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get cassette status reports for all cassettes of a specific ATM.
        /// </summary>
        [HttpGet("clients/{clientId}/cassettes-status")]
        public async Task<ActionResult> GetCassetteStatusReportByClient(int clientId)
        {
            try
            {
                var result = await _service.GetCassetteStatusReportByClientAsync(clientId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cassette status reports for clientId={ClientId}", clientId);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get complete ATM cash and cassette overview.
        /// </summary>
        [HttpGet("clients/{clientId}/cash-cassette-overview")]
        public async Task<ActionResult> GetAtmCashCassetteOverview(int clientId)
        {
            try
            {
                var result = await _service.GetAtmCashCassetteOverviewAsync(clientId);
                if (result == null)
                {
                    return NotFound(new { message = "ATM not found" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cash cassette overview for clientId={ClientId}", clientId);
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get list of available cash unit statuses.
        /// </summary>
        [HttpGet("lookups/cash-unit-statuses")]
        public async Task<ActionResult> GetCashUnitStatuses()
        {
            try
            {
                var result = await _service.GetCashUnitStatusesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cash unit statuses");
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        /// <summary>
        /// Get list of available cash unit types.
        /// </summary>
        [HttpGet("lookups/cash-unit-types")]
        public async Task<ActionResult> GetCashUnitTypes()
        {
            try
            {
                var result = await _service.GetCashUnitTypesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cash unit types");
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }
    }
}