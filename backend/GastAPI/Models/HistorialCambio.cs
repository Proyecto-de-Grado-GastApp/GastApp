namespace GastAPI.Models {
    public class HistorialCambio {
        public int Id { get; set; }
        public int IdGasto { get; set; } // Relación con el gasto
        public DateTime FechaCambio { get; set; } = DateTime.Now;
        public string Descripción { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}