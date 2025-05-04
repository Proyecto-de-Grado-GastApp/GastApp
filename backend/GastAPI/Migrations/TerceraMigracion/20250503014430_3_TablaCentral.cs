using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GastAPI.Migrations.TerceraMigracion
{
    /// <inheritdoc />
    public partial class _3_TablaCentral : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gastos",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: false),
                    CategoriaId = table.Column<long>(type: "bigint", nullable: true),
                    MetodoPagoId = table.Column<long>(type: "bigint", nullable: true),
                    Cantidad = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Frecuencia = table.Column<int>(type: "integer", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Notificar = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Nota = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gastos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_gastos_categorias_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "categorias",
                        principalColumn: "id_categorias");
                    table.ForeignKey(
                        name: "FK_gastos_metodos_de_pago_MetodoPagoId",
                        column: x => x.MetodoPagoId,
                        principalTable: "metodos_de_pago",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_gastos_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

                migrationBuilder.CreateIndex(
                name: "IX_gastos_CategoriaId",
                table: "gastos",
                column: "CategoriaId");

                migrationBuilder.CreateIndex(
                    name: "IX_gastos_MetodoPagoId",
                    table: "gastos",
                    column: "MetodoPagoId");

                migrationBuilder.CreateIndex(
                    name: "IX_gastos_UsuarioId_Fecha",
                    table: "gastos",
                    columns: new[] { "UsuarioId", "Fecha" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gastos");
        }
    }
}
