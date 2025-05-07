using GastAPI.Data;
using GastAPI.Models;

namespace GastAPI.Seeders
{
    public static class DbInitializer
    {
        public static void Seed(AppDbContext context)
        {
            var utcNow = DateTime.UtcNow;

            if (!context.Categorias.Any())
            {
                context.Categorias.AddRange(
                    new Categoria
                    {
                        Nombre = "Alimentación",
                        Descripcion = "Gastos de comida",
                        FechaCreacion = utcNow,
                        FechaActualizacion = utcNow
                    },
                    new Categoria
                    {
                        Nombre = "Transporte",
                        Descripcion = "Gasolina, trenes, buses",
                        FechaCreacion = utcNow,
                        FechaActualizacion = utcNow
                    }
                );
            }

            if (!context.MetodosPago.Any())
            {
                context.MetodosPago.AddRange(
                    new MetodoPago
                    {
                        NombreMetodo = "Tarjeta de crédito",
                        FechaCreacion = utcNow,
                        FechaActualizacion = utcNow
                    },
                    new MetodoPago
                    {
                        NombreMetodo = "Efectivo",
                        FechaCreacion = utcNow,
                        FechaActualizacion = utcNow
                    }
                );
            }

            if (!context.Usuarios.Any())
            {
                var usuario = new Usuario
                {
                    Nombre = "UsuarioPrueba",
                    Email = "usuario@demo.com",
                    Contrasena = HashPassword("12345@Abc"),
                    FechaCreacion = utcNow,
                    FechaActualizacion = utcNow
                };

                context.Usuarios.Add(usuario);
            }

            context.SaveChanges();
        }

        private static string HashPassword(string password)
        {
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}
