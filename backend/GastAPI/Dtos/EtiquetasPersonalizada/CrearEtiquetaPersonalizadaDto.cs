using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.EtiquetasPersonalizada
{
    // DTO para crear una nueva etiqueta
    public class CrearEtiquetaPersonalizadaDto
    {
        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = null!;
        
        public long? UsuarioId { get; set; }
    }
}