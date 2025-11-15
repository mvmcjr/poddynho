using Poddynho.Domain.Modelos;

namespace Poddynho.Modelos;

public record RespostaCalculoRotaDto(RotaDto Rota, List<Posto> PostosProximos)
{
    public override string ToString()
    {
        return $"{{ Rota = {Rota}, PostosProximos = {PostosProximos} }}";
    }
}