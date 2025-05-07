namespace GastAPI.Dtos.MetodoPago
{
    public class MetodoPagoReadDto
    {
        public long Id { get; set; }
        public string NombreMetodo { get; set; } = null!;
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaActualizacion { get; set; }
    }
}
