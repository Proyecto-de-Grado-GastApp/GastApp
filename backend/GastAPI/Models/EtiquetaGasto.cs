namespace GastAPI.Models {
    public class EtiquetaGasto {
        public int Id { get; set; }
        public required int IdGasto { get; set; } // Relación con el gasto
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaActualizacion { get; set; } = DateTime.Now;
    }
}