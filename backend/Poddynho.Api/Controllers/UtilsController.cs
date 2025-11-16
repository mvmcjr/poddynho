using Microsoft.AspNetCore.Mvc;
using Poddynho.Domain.Modelos;
using Poddynho.Modelos;

namespace Poddynho.Controllers;

[ApiController]
[Route("[controller]")]
public class UtilsController
{
    [HttpGet("listar/tipos-combustivel")]
    public ActionResult<IEnumerable<TipoCombustivelUtilDto>> ListarTiposCombustivel()
    {
        return Enum.GetValues<TipoCombustivel>()
            .Select(tc =>
                new TipoCombustivelUtilDto(tc, tc == TipoCombustivel.GasolinaPremium))
            .ToList();
    }
}