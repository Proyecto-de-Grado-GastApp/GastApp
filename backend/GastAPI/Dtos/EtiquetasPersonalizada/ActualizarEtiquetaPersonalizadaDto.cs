using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.EtiquetasPersonalizada
{
    // DTO para actualizar una etiqueta existente
    public class ActualizarEtiquetaPersonalizadaDto
    {
        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = null!;
    }
}