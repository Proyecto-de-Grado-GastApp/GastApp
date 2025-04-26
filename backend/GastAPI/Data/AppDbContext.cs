using Microsoft.EntityFrameworkCore;
using GastAPI.Models;

namespace GastAPI.Data {
    public class AppDbContext : DbContext {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<MetodoPago> MetodosPago { get; set; }
        public DbSet<Categoria> Categorias { get; set; } 
        public DbSet<EtiquetaPersonalizada> EtiquetasPersonalizadas { get; set; }
        public DbSet<Presupuesto> Presupuestos { get; set; }
        public DbSet<Gasto> Gastos { get; set; }
        public DbSet<RecordatorioPago> RecordatoriosPago { get; set; }
        public DbSet<HistorialCambio> HistorialCambios { get; set; }
        public DbSet<EtiquetaGasto> EtiquetasGasto { get; set; }
        
    }
}