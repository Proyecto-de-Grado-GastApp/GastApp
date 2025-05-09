using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.Usuario
{
    public class UsuarioUpdateDto
    {
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [StringLength(255, MinimumLength = 6)]
        public string Contrasena { get; set; } = string.Empty;
    }
}