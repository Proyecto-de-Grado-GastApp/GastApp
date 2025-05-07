using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GastAPI.Models
{
    public class EtiquetaGasto
    {
        [Key]
        public long EtiquetaId { get; set; } 
    
        // Aquí está la relación con Gasto, por lo que solo debes tener una propiedad GastoId
        public long GastoId { get; set; }

        // Relación con EtiquetaPersonalizada
        public long EtiquetaPersonalizadaId { get; set; }
        public EtiquetaPersonalizada EtiquetaPersonalizada { get; set; } = null!; 

        // Relación con Gasto
        public Gasto Gasto { get; set; } = null!;

        // Auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;
    }
}
