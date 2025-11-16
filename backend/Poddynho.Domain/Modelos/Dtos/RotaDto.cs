namespace Poddynho.Domain.Modelos.Dtos;

public record RotaDto(int DistanciaEmMetros, TimeSpan Duracao, string Polyline)
{
    public override string ToString()
    {
        return $"{{ DistanciaEmMetros = {DistanciaEmMetros}, Duracao = {Duracao}, Polyline = {Polyline} }}";
    }
}