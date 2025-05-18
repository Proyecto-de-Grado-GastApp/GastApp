namespace GastAPI.Dtos.Presupuesto
{
    public class PresupuestoResponseDTO
    {
        public long Id { get; set; }
        public long CategoriaId { get; set; }
        public string CategoriaNombre { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public string Mensaje { get; set; } = string.Empty;
    }
}