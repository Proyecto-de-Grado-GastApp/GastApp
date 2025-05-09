using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.HistorialCambios
{
    public class HistorialCambioCreateDTO
    {
        public long GastoId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Descripcion { get; set; } = string.Empty;
    }
}