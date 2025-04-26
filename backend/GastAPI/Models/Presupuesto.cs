namespace GastAPI.Models{
    public class Presupuesto {
        public int Id { get; set; }
        public int IdUsuario { get; set; }
        public int IdCategoria { get; set; }
        public required decimal Cantidad { get; set; }
        public required DateTime FechaInicio { get; set; } 
        public required DateTime FechaFin { get; set; }
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaActualizacion { get; set; } = DateTime.Now;
    }
}