using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GastAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddImagenPerfilToUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagenPerfil",
                table: "usuarios",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagenPerfil",
                table: "usuarios");
        }
    }
}
