using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GastAPI.Migrations.CuartaMigracion
{
    /// <inheritdoc />
    public partial class _4_TablasDependientes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "recordatorios_de_pago",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GastoId = table.Column<long>(type: "bigint", nullable: true),
                    FechaRecordatorio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notificado = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recordatorios_de_pago", x => x.Id);
                    table.ForeignKey(
                        name: "FK_recordatorios_de_pago_gastos_GastoId",
                        column: x => x.GastoId,
                        principalTable: "gastos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_recordatorios_de_pago_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "historial_de_cambios",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GastoId = table.Column<long>(type: "bigint", nullable: false),
                    FechaCambio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    descripcion_cambio = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_historial_de_cambios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_historial_de_cambios_gastos_GastoId",
                        column: x => x.GastoId,
                        principalTable: "gastos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_historial_de_cambios_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id");
                });
            
                migrationBuilder.CreateTable(
                name: "etiquetas_gasto",
                columns: table => new
                {
                    EtiquetaId = table.Column<long>(type: "bigint", nullable: false),
                    GastoId = table.Column<long>(type: "bigint", nullable: false),
                    EtiquetaPersonalizadaId = table.Column<long>(type: "bigint", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_etiquetas_gasto", x => new { x.EtiquetaId, x.GastoId });
                    table.ForeignKey(
                        name: "FK_etiquetas_gasto_etiquetas_personalizadas_EtiquetaPersonaliz~",
                        column: x => x.EtiquetaPersonalizadaId,
                        principalTable: "etiquetas_personalizadas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_etiquetas_gasto_gastos_GastoId",
                        column: x => x.GastoId,
                        principalTable: "gastos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

             migrationBuilder.CreateIndex(
                name: "IX_recordatorios_de_pago_GastoId",
                table: "recordatorios_de_pago",
                column: "GastoId");

            migrationBuilder.CreateIndex(
                name: "IX_recordatorios_de_pago_UsuarioId",
                table: "recordatorios_de_pago",
                column: "UsuarioId");
            
            migrationBuilder.CreateIndex(
                name: "IX_historial_de_cambios_GastoId",
                table: "historial_de_cambios",
                column: "GastoId");

            migrationBuilder.CreateIndex(
                name: "IX_historial_de_cambios_UsuarioId",
                table: "historial_de_cambios",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_etiquetas_gasto_GastoId",
                table: "etiquetas_gasto",
                column: "GastoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
