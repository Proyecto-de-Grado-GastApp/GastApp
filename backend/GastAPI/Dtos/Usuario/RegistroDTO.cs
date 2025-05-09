using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.Usuario
{
    public class RegistroDTO
    {
        [Required(ErrorMessage = "El nombre es obligatorio")]
        [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El email es obligatorio")]
        [EmailAddress(ErrorMessage = "El email no es válido")]
        [MaxLength(255, ErrorMessage = "El email no puede superar los 255 caracteres")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria")]
        [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
        [MaxLength(255, ErrorMessage = "La contraseña no puede superar los 255 caracteres")]
        public string Contrasena { get; set; } = string.Empty;
    }
}
