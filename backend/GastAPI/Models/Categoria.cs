using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GastAPI.Models
{
    public class Categoria
    {
        public Categoria()
        {
            Gastos = new HashSet<Gasto>();
            Presupuestos = new HashSet<Presupuesto>();
        }

        [Key]
        [Column("id_categorias")]
        public long Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("nombre_categoria")]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(500)]
        [Column("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        //Auditoría
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

        // Relaciones
        public ICollection<Gasto> Gastos { get; set; }
        public ICollection<Presupuesto> Presupuestos { get; set; }
    }
}
