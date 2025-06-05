using GastAPI.Data;
using GastAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GastAPI.Dtos.Gastos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace GastAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GastosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GastosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/gastos
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<GastoDto>>> GetAll()
        {
            // Obtener el ID del usuario autenticado
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            
            var userId = long.Parse(userIdClaim.Value);

            // Filtrar gastos por usuario
            var gastos = await _context.Gastos
                .Where(g => g.UsuarioId == userId && g.Activo) // Filtro crítico
                .Include(g => g.Etiquetas)
                .Select(g => new GastoDto
                {
                    Id = g.Id,
                    UsuarioId = g.UsuarioId,
                    CategoriaId = g.CategoriaId,
                    MetodoPagoId = g.MetodoPagoId,
                    Cantidad = g.Cantidad,
                    Descripcion = g.Descripcion,
                    Fecha = g.Fecha,
                    Frecuencia = g.Frecuencia,
                    Activo = g.Activo,
                    Notificar = g.Notificar,
                    Nota = g.Nota,
                    FechaCreacion = g.FechaCreacion,
                    FechaActualizacion = g.FechaActualizacion,
                    EtiquetaIds = g.Etiquetas.Select(e => e.EtiquetaPersonalizadaId).ToList()
                })
                .ToListAsync();

            return Ok(gastos);
        }

        // GET: api/gastos/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<GastoDto>> GetById(long id)
        {
            // Obtener ID de usuario
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = long.Parse(userIdClaim.Value);

            var gasto = await _context.Gastos
                .Include(g => g.Etiquetas)
                .FirstOrDefaultAsync(g => g.Id == id && g.UsuarioId == userId); // Verificar propiedad

            if (gasto == null) return NotFound();

            var dto = new GastoDto
            {
                Id = gasto.Id,
                UsuarioId = gasto.UsuarioId,
                CategoriaId = gasto.CategoriaId,
                MetodoPagoId = gasto.MetodoPagoId,
                Cantidad = gasto.Cantidad,
                Descripcion = gasto.Descripcion,
                Fecha = gasto.Fecha,
                Frecuencia = gasto.Frecuencia,
                Activo = gasto.Activo,
                Notificar = gasto.Notificar,
                Nota = gasto.Nota,
                FechaCreacion = gasto.FechaCreacion,
                FechaActualizacion = gasto.FechaActualizacion,
                EtiquetaIds = gasto.Etiquetas.Select(e => e.EtiquetaPersonalizadaId).ToList()
            };

            return Ok(dto);
        }

        // POST: api/gastos
        [HttpPost]
        [Authorize]
        public async Task<ActionResult> Create(CreateGastoDto dto)
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                Console.WriteLine("No se encontró ClaimTypes.NameIdentifier en el token.");
                return Unauthorized();
            }

            var userId = long.Parse(userIdClaim.Value);

            var gasto = new Gasto
            {
                UsuarioId = userId,
                CategoriaId = dto.CategoriaId,
                MetodoPagoId = dto.MetodoPagoId,
                Cantidad = dto.Cantidad,
                Descripcion = dto.Descripcion,
                Fecha = dto.Fecha,
                Frecuencia = dto.Frecuencia,
                Activo = dto.Activo,
                Notificar = dto.Notificar,
                Nota = dto.Nota,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };

            _context.Gastos.Add(gasto);
            await _context.SaveChangesAsync();

            // Agregar etiquetas si hay
            if (dto.EtiquetaIds != null && dto.EtiquetaIds.Any())
            {
                foreach (var etiquetaId in dto.EtiquetaIds)
                {
                    _context.EtiquetasGasto.Add(new EtiquetaGasto
                    {
                        GastoId = gasto.Id,
                        EtiquetaPersonalizadaId = etiquetaId,
                        FechaCreacion = DateTime.UtcNow,
                        FechaActualizacion = DateTime.UtcNow
                    });
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetById), new { id = gasto.Id }, null);
        }


        // PUT: api/gastos/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult> Update(long id, UpdateGastoDto dto)
        {
            // Obtener ID de usuario
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = long.Parse(userIdClaim.Value);

            // Verificar que el gasto pertenece al usuario
            var gasto = await _context.Gastos
                .Include(g => g.Etiquetas)
                .FirstOrDefaultAsync(g => g.Id == id && g.UsuarioId == userId);

            if (gasto == null) return NotFound();

            gasto.UsuarioId = userId;
            gasto.CategoriaId = dto.CategoriaId;
            gasto.MetodoPagoId = dto.MetodoPagoId;
            gasto.Cantidad = dto.Cantidad;
            gasto.Descripcion = dto.Descripcion;
            gasto.Fecha = dto.Fecha;
            gasto.Frecuencia = dto.Frecuencia;
            gasto.Activo = dto.Activo;
            gasto.Notificar = dto.Notificar;
            gasto.Nota = dto.Nota;
            gasto.FechaActualizacion = DateTime.UtcNow;

            // Actualizar etiquetas
            if (dto.EtiquetaIds != null)
            {
                _context.EtiquetasGasto.RemoveRange(gasto.Etiquetas);

                foreach (var etiquetaId in dto.EtiquetaIds)
                {
                    _context.EtiquetasGasto.Add(new EtiquetaGasto
                    {
                        GastoId = gasto.Id,
                        EtiquetaPersonalizadaId = etiquetaId,
                        FechaCreacion = DateTime.UtcNow,
                        FechaActualizacion = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/gastos/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> Delete(long id)
        {
            // Obtener ID de usuario
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = long.Parse(userIdClaim.Value);

            // Verificar que el gasto pertenece al usuario
            var gasto = await _context.Gastos
                .FirstOrDefaultAsync(g => g.Id == id && g.UsuarioId == userId);

            if (gasto == null) return NotFound();

            gasto.Activo = false;
            gasto.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("categoria/{categoriaId}")]
        [Authorize]
        public async Task<IActionResult> GetGastosPorCategoria(long categoriaId)
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = long.Parse(userIdClaim.Value);

            var gastos = await _context.Gastos
                .Where(g => g.UsuarioId == userId && g.CategoriaId == categoriaId)
                .ToListAsync();

            return Ok(gastos);
        }

    }
}
