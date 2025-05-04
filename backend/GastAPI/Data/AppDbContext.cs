using Microsoft.EntityFrameworkCore;
using GastAPI.Models;

namespace GastAPI.Data 
{
    public class AppDbContext : DbContext 
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) 
        {
        }

        // DbSets para cada entidad
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<MetodoPago> MetodosPago { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<EtiquetaPersonalizada> EtiquetasPersonalizadas { get; set; }
        public DbSet<Presupuesto> Presupuestos { get; set; }
        public DbSet<Gasto> Gastos { get; set; }
        public DbSet<RecordatorioPago> RecordatoriosPago { get; set; }
        public DbSet<HistorialCambio> HistorialCambios { get; set; }
        public DbSet<EtiquetaGasto> EtiquetasGasto { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder) 
        {
            base.OnModelCreating(modelBuilder);

            // Configuración de nombres de tablas
            modelBuilder.Entity<Usuario>().ToTable("usuarios");
            modelBuilder.Entity<MetodoPago>().ToTable("metodos_de_pago");
            modelBuilder.Entity<Categoria>().ToTable("categorias");
            modelBuilder.Entity<EtiquetaPersonalizada>().ToTable("etiquetas_personalizadas");
            modelBuilder.Entity<Presupuesto>().ToTable("presupuestos");
            modelBuilder.Entity<Gasto>().ToTable("gastos");
            modelBuilder.Entity<RecordatorioPago>().ToTable("recordatorios_de_pago");
            modelBuilder.Entity<HistorialCambio>().ToTable("historial_de_cambios");
            modelBuilder.Entity<EtiquetaGasto>().ToTable("etiquetas_gasto");

            // Configuración de claves primarias
            modelBuilder.Entity<Usuario>().HasKey(u => u.Id);
            modelBuilder.Entity<MetodoPago>().HasKey(m => m.Id);
            modelBuilder.Entity<Categoria>().HasKey(c => c.Id);
            modelBuilder.Entity<EtiquetaPersonalizada>().HasKey(e => e.Id);
            modelBuilder.Entity<Presupuesto>().HasKey(p => p.Id);
            modelBuilder.Entity<Gasto>().HasKey(g => g.Id);
            modelBuilder.Entity<RecordatorioPago>().HasKey(r => r.Id);
            modelBuilder.Entity<HistorialCambio>().HasKey(h => h.Id);
            modelBuilder.Entity<EtiquetaGasto>().HasKey(e => new { e.EtiquetaId, e.GastoId });

            // Configuración de relaciones

            // Usuario → Gastos (1-N)
            modelBuilder.Entity<Gasto>()
                .HasOne(g => g.Usuario)
                .WithMany(u => u.Gastos)
                .HasForeignKey(g => g.UsuarioId);

            // Usuario → Presupuestos (1-N)
            modelBuilder.Entity<Presupuesto>()
                .HasOne(p => p.Usuario)
                .WithMany(u => u.Presupuestos)
                .HasForeignKey(p => p.UsuarioId);

            // Usuario → EtiquetasPersonalizadas (1-N)
            modelBuilder.Entity<EtiquetaPersonalizada>()
                .HasOne(e => e.Usuario)
                .WithMany(u => u.EtiquetasPersonalizadas)
                .HasForeignKey(e => e.UsuarioId);

            // Gasto → Categoría (N-1)
            modelBuilder.Entity<Gasto>()
                .HasOne(g => g.Categoria)
                .WithMany(c => c.Gastos)
                .HasForeignKey(g => g.CategoriaId);

            // Gasto → MétodoPago (N-1)
            modelBuilder.Entity<Gasto>()
                .HasOne(g => g.MetodoPago)
                .WithMany(m => m.Gastos)
                .HasForeignKey(g => g.MetodoPagoId);

            // Gasto → RecordatoriosPago (1-N)
            modelBuilder.Entity<RecordatorioPago>()
                .HasOne(r => r.Gasto)
                .WithMany(g => g.Recordatorios)
                .HasForeignKey(r => r.GastoId);

            // Gasto → HistorialCambios (1-N)
            modelBuilder.Entity<HistorialCambio>()
                .HasOne(h => h.Gasto)
                .WithMany(g => g.HistorialCambios)
                .HasForeignKey(h => h.GastoId);

            // Presupuesto → Categoría (N-1)
            modelBuilder.Entity<Presupuesto>()
                .HasOne(p => p.Categoria)
                .WithMany(c => c.Presupuestos)
                .HasForeignKey(p => p.CategoriaId);

            // EtiquetaGasto (tabla de unión para N-N)
            modelBuilder.Entity<EtiquetaGasto>()
                .HasOne(eg => eg.EtiquetaPersonalizada)
                .WithMany(e => e.GastosEtiquetados)
                .HasForeignKey(eg => eg.EtiquetaPersonalizadaId);

            modelBuilder.Entity<EtiquetaGasto>()
                .HasOne(eg => eg.Gasto)
                .WithMany(g => g.Etiquetas)
                .HasForeignKey(eg => eg.GastoId);

            // Configuración de índices
            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Gasto>()
                .HasIndex(g => new { g.UsuarioId, g.Fecha });

            modelBuilder.Entity<Presupuesto>()
                .HasIndex(p => new { p.UsuarioId, p.FechaInicio });

            // Configuración de valores por defecto
            modelBuilder.Entity<Gasto>()
                .Property(g => g.Activo)
                .HasDefaultValue(true);

            modelBuilder.Entity<Gasto>()
                .Property(g => g.Notificar)
                .HasDefaultValue(false);

            modelBuilder.Entity<RecordatorioPago>()
                .Property(r => r.Notificado)
                .HasDefaultValue(false);

            // Configuración de columnas específicas
            modelBuilder.Entity<HistorialCambio>()
                .Property(h => h.Descripcion)
                .HasColumnName("descripcion_cambio");

            // Configuración de tipos de datos
            modelBuilder.Entity<Gasto>()
                .Property(g => g.Cantidad)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Presupuesto>()
                .Property(p => p.Cantidad)
                .HasColumnType("decimal(18,2)");
        }
    }
}