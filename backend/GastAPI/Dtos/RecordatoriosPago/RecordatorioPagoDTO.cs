namespace GastAPI.Dtos.RecordatoriosPago
{
    public class RecordatorioPagoDTO
    {
        public long Id { get; set; }
        public long GastoId { get; set; }
        public DateTime FechaRecordatorio { get; set; }
        public bool? Notificado { get; set; }
    }
}