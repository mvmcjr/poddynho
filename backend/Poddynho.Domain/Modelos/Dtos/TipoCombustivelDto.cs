using Poddynho.Domain.Extensoes;

namespace Poddynho.Domain.Modelos.Dtos;

public record TipoCombustivelDto
{
    public string Nome { get; private init; }
    
    public string Valor { get; private init; }

    public TipoCombustivelDto(TipoCombustivel combustivel)
    {
        Nome = combustivel.ObterNome();
        Valor = combustivel.ToString();
    }
}