using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GastAPI.Data;
using GastAPI.Models;
using GastAPI.Dtos.Presupuesto;
using System.Security.Claims;

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

    private long GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null) throw new Exception("No se encontró el ID del usuario en el token");
        return long.Parse(claim.Value);
    }

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
    
    [HttpPost]
    public async Task<ActionResult<PresupuestoResponseDTO>> PostPresupuesto(PresupuestoCreateDTO dto)
    {
        try
        {
            var userId = GetUserId();

            // Validar que la categoría exista
            var categoriaExistente = await _context.Categorias
                .AnyAsync(c => c.Id == dto.CategoriaId);
            
            if (!categoriaExistente)
            {
                return BadRequest(new { message = "La categoría especificada no existe" });
            }

            // Validar que la fecha de inicio no sea mayor a la fecha fin
            if (dto.FechaInicio > dto.FechaFin)
            {
                return BadRequest(new { message = "La fecha de inicio no puede ser posterior a la fecha de fin" });
            }

            // Validar que la cantidad sea positiva
            if (dto.Cantidad <= 0)
            {
                return BadRequest(new { message = "La cantidad debe ser mayor a cero" });
            }

            // Verificar si ya existe un presupuesto para esta categoría en el mismo período
            var presupuestoExistente = await _context.Presupuestos
                .AnyAsync(p => p.UsuarioId == userId 
                            && p.CategoriaId == dto.CategoriaId
                            && ((p.FechaInicio <= dto.FechaFin && p.FechaFin >= dto.FechaInicio)));
            
            if (presupuestoExistente)
            {
                return BadRequest(new { message = "Ya existe un presupuesto para esta categoría en el período especificado" });
            }

            // Crear el nuevo presupuesto
            var presupuesto = new Presupuesto
            {
                UsuarioId = userId,
                CategoriaId = dto.CategoriaId,
                Cantidad = dto.Cantidad,
                FechaInicio = dto.FechaInicio,
                FechaFin = dto.FechaFin,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };

            _context.Presupuestos.Add(presupuesto);
            await _context.SaveChangesAsync();

            // Obtener el nombre de la categoría para la respuesta
            var categoria = await _context.Categorias.FindAsync(dto.CategoriaId);

            var response = new PresupuestoResponseDTO
            {
                Id = presupuesto.Id,
                CategoriaId = presupuesto.CategoriaId,
                CategoriaNombre = categoria?.Nombre ?? "Desconocida",
                Cantidad = presupuesto.Cantidad,
                FechaInicio = presupuesto.FechaInicio,
                FechaFin = presupuesto.FechaFin ?? default(DateTime),
                Mensaje = "Presupuesto creado exitosamente"
            };

            return CreatedAtAction(nameof(GetPresupuesto), new { id = presupuesto.Id }, response);
        }
        catch (Exception ex)
        {
            // Loggear el error (dependiendo de tu sistema de logging)
            Console.Error.WriteLine($"Error al crear presupuesto: {ex.Message}");
            return StatusCode(500, new { message = "Ocurrió un error interno al procesar la solicitud" });
        }
    }
}
