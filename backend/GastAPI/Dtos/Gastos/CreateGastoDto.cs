using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.Gastos
{
    public class CreateGastoDto
    {
        [Required]
        public long UsuarioId { get; set; }

        public long? CategoriaId { get; set; }
        public long? MetodoPagoId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Cantidad { get; set; }

        public string Descripcion { get; set; } = string.Empty;

        [Required]
        public DateTime Fecha { get; set; }

        public int Frecuencia { get; set; } = 0;
        public bool Activo { get; set; } = true;
        public bool Notificar { get; set; } = false;

        public string Nota { get; set; } = string.Empty;

        // Lista opcional de etiquetas asociadas
        public List<long>? EtiquetaIds { get; set; }
    }
}