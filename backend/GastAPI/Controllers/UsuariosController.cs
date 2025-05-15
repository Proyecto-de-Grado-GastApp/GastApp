using GastAPI.Data;
using GastAPI.Dtos.Usuario;
using GastAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace GastAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public UsuariosController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Usuario>>> GetUsuarios()
        {
            return await _context.Usuarios.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Usuario>> GetUsuario(long id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound();
            return usuario;
        }

        [HttpPost("registrar")]
        public async Task<ActionResult<Usuario>> Registrar([FromBody] RegistroDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("El correo ya está en uso");

            var usuario = new Usuario
            {
                Nombre = dto.Nombre,
                Email = dto.Email,
                Contrasena = HashPassword(dto.Contrasena),
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, usuario);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (usuario == null || !VerifyPassword(dto.Contrasena, usuario.Contrasena))
                return Unauthorized("Correo o contraseña incorrectos");

            var token = GenerateJwtToken(usuario);
            return Ok(new { token });
        }

        // Endpoint para validar el token manualmente
        [Authorize]
        [HttpGet("validate-token")]
        public IActionResult ValidateToken()
        {
            // Obtén el token manualmente del header
            var authHeader = Request.Headers["Authorization"].ToString();
            
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { valid = false, message = "Token no proporcionado" });
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();

            // Valida manualmente el token (versión simplificada)
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                
                // Verifica expiración básica (sin firma para desarrollo)
                if (jwtToken.ValidTo < DateTime.UtcNow)
                {
                    return Unauthorized(new { valid = false, message = "Token expirado" });
                }

                return Ok(new { valid = true, userId = jwtToken.Subject });
            }
            catch
            {
                return Unauthorized(new { valid = false, message = "Token inválido" });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult> GetMe()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Token inválido o sin identificador." });
            }

            var usuario = await _context.Usuarios.FindAsync(long.Parse(userId));
            if (usuario == null)
            {
                return NotFound(new { message = "Usuario no encontrado." });
            }

            return Ok(new
            {
                usuario.Id,
                usuario.Nombre,
                usuario.Email,
                usuario.FechaCreacion,
                usuario.ImagenPerfil
            });
        }

        [HttpGet("perfil")]
        [Authorize]
        public async Task<IActionResult> GetPerfil()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;

            if (identity == null)
                return Unauthorized();

            var userIdClaim = identity.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var userId = long.Parse(userIdClaim.Value);

            var usuario = await _context.Usuarios
                .Where(u => u.Id == userId)
                .Select(u => new {
                    u.Id,
                    u.Nombre,
                    u.Email,
                    u.ImagenPerfil
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
                return NotFound();

            return Ok(usuario);
        }

        [HttpPut("actualizar-perfil")]
        [Authorize]
        public async Task<IActionResult> ActualizarPerfil([FromBody] UsuarioUpdateDto dto)
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            if (!long.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Nombre))
                usuario.Nombre = dto.Nombre;

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var emailEnUso = await _context.Usuarios
                    .AnyAsync(u => u.Email == dto.Email && u.Id != userId);

                if (emailEnUso)
                    return BadRequest(new { message = "El correo ya está en uso por otro usuario." });

                usuario.Email = dto.Email;
            }

            if (!string.IsNullOrWhiteSpace(dto.Contrasena))
                usuario.Contrasena = HashPassword(dto.Contrasena);

            if (!string.IsNullOrWhiteSpace(dto.ImagenPerfil))
                usuario.ImagenPerfil = dto.ImagenPerfil;

            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Perfil actualizado correctamente." });
        }


        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPassword(string inputPassword, string storedHash)
        {
            var inputHash = HashPassword(inputPassword);
            return inputHash == storedHash;
        }

        private string GenerateJwtToken(Usuario usuario)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
                new Claim("nombre", usuario.Nombre),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
