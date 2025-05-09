using System.ComponentModel.DataAnnotations;

namespace GastAPI.Dtos.EtiquetasPersonalizada
{
    // DTO para mostrar una etiqueta
    public class EtiquetaPersonalizadaDto
    {
        public long Id { get; set; }
        public string Nombre { get; set; } = null!;
        public long? UsuarioId { get; set; }
    }
}
