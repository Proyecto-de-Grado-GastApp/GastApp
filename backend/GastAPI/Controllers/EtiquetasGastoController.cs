using GastAPI.Data;
using GastAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GastAPI.Dtos.EtiquetasGasto;

[ApiController]
[Route("api/[controller]")]
public class EtiquetaGastoController : ControllerBase
{
    private readonly AppDbContext _context;

    public EtiquetaGastoController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EtiquetaGastoDto>>> GetAll()
    {
        var relaciones = await _context.EtiquetasGasto
            .Select(e => new EtiquetaGastoDto
            {
                GastoId = e.GastoId,
                EtiquetaPersonalizadaId = e.EtiquetaPersonalizadaId
            })
            .ToListAsync();

        return Ok(relaciones);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CrearEtiquetaGastoDto dto)
    {
        // Validación de existencia
        var gasto = await _context.Gastos.FindAsync(dto.GastoId);
        var etiqueta = await _context.EtiquetasPersonalizadas.FindAsync(dto.EtiquetaPersonalizadaId);
        if (gasto == null || etiqueta == null)
            return BadRequest("Gasto o Etiqueta no existente");

        // Comprobación para evitar duplicados
        var existente = await _context.EtiquetasGasto.AnyAsync(e =>
            e.GastoId == dto.GastoId && e.EtiquetaPersonalizadaId == dto.EtiquetaPersonalizadaId);
        if (existente)
            return Conflict("La relación ya existe");

        var relacion = new EtiquetaGasto
        {
            GastoId = dto.GastoId,
            EtiquetaPersonalizadaId = dto.EtiquetaPersonalizadaId,
            FechaCreacion = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow
        };

        _context.EtiquetasGasto.Add(relacion);
        await _context.SaveChangesAsync();
        return Ok("Relación creada correctamente");
    }

    [HttpDelete]
    public async Task<ActionResult> Delete([FromQuery] long gastoId, [FromQuery] long etiquetaId)
    {
        var relacion = await _context.EtiquetasGasto.FirstOrDefaultAsync(e =>
            e.GastoId == gastoId && e.EtiquetaPersonalizadaId == etiquetaId);

        if (relacion == null)
            return NotFound("Relación no encontrada");

        _context.EtiquetasGasto.Remove(relacion);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
