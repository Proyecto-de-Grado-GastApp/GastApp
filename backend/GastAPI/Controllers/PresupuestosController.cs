using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GastAPI.Data;
using GastAPI.Models;
using GastAPI.Dtos.Presupuesto;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PresupuestosController : ControllerBase
{
    private readonly AppDbContext _context;

    public PresupuestosController(AppDbContext context)
    {
        _context = context;
    }

    private long GetUserId() =>
        long.Parse(User.FindFirst("id")!.Value);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PresupuestoDTO>>> GetPresupuestos()
    {
        var userId = GetUserId();

        var presupuestos = await _context.Presupuestos
            .Include(p => p.Categoria)
            .Where(p => p.UsuarioId == userId)
            .Select(p => new PresupuestoDTO
            {
                Id = p.Id,
                CategoriaId = p.CategoriaId,
                CategoriaNombre = p.Categoria.Nombre,
                Cantidad = p.Cantidad,
                FechaInicio = p.FechaInicio,
                FechaFin = p.FechaFin
            })
            .ToListAsync();

        return Ok(presupuestos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PresupuestoDTO>> GetPresupuesto(long id)
    {
        var userId = GetUserId();

        var presupuesto = await _context.Presupuestos
            .Include(p => p.Categoria)
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == userId);

        if (presupuesto == null)
            return NotFound();

        var dto = new PresupuestoDTO
        {
            Id = presupuesto.Id,
            CategoriaId = presupuesto.CategoriaId,
            CategoriaNombre = presupuesto.Categoria.Nombre,
            Cantidad = presupuesto.Cantidad,
            FechaInicio = presupuesto.FechaInicio,
            FechaFin = presupuesto.FechaFin
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<PresupuestoDTO>> PostPresupuesto(PresupuestoCreateDTO dto)
    {
        var userId = GetUserId();

        var presupuesto = new Presupuesto
        {
            UsuarioId = userId,
            CategoriaId = dto.CategoriaId,
            Cantidad = dto.Cantidad,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin
        };

        _context.Presupuestos.Add(presupuesto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPresupuesto), new { id = presupuesto.Id }, presupuesto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutPresupuesto(long id, PresupuestoCreateDTO dto)
    {
        var userId = GetUserId();

        var presupuesto = await _context.Presupuestos.FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == userId);

        if (presupuesto == null)
            return NotFound();

        presupuesto.CategoriaId = dto.CategoriaId;
        presupuesto.Cantidad = dto.Cantidad;
        presupuesto.FechaInicio = dto.FechaInicio;
        presupuesto.FechaFin = dto.FechaFin;
        presupuesto.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePresupuesto(long id)
    {
        var userId = GetUserId();

        var presupuesto = await _context.Presupuestos.FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == userId);
        if (presupuesto == null)
            return NotFound();

        _context.Presupuestos.Remove(presupuesto);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
