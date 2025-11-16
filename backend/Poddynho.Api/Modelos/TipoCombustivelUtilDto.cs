using Poddynho.Domain.Modelos;
using Poddynho.Domain.Modelos.Dtos;

namespace Poddynho.Modelos;

public record TipoCombustivelUtilDto
    : TipoCombustivelDto
{
    public bool IniciarSelecionado { get; private set; }
    
    public TipoCombustivelUtilDto(TipoCombustivel combustivel, bool iniciarSelecionado = false) : base(combustivel)
    {
        IniciarSelecionado = iniciarSelecionado;
    }
}