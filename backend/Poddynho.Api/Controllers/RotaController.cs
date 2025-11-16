using Microsoft.AspNetCore.Mvc;
using Poddynho.Domain.Modelos.Dtos;
using Poddynho.Modelos;
using Poddynho.Servicos;

namespace Poddynho.Controllers;

[ApiController]
[Route("[controller]")]
public class RotaController(ServicoCalculoRota servicoCalculoRota) : ControllerBase
{
    [HttpPost("computar")]
    public async ValueTask<ActionResult<RespostaCalculoRotaDto>> ComputarRota(RequisicaoComputarRota requisicao)
    {
        var resultado = await servicoCalculoRota.CalcularRota(requisicao);
        return resultado.IsSuccess(out var resposta, out var erro) ? Ok(resposta) : Problem(erro.Message);
    }
}