namespace GastAPI.Dtos.HistorialCambios
{
    public class HistorialCambioDTO
    {
        public long Id { get; set; }
        public long GastoId { get; set; }
        public DateTime FechaCambio { get; set; }
        public string Descripcion { get; set; } = string.Empty;
    }
}
