using System.Diagnostics.CodeAnalysis;

namespace Poddynho.Domain.Modelos.Dtos;

public record RespostaCalculoRotaDto(RotaDto Rota, List<RespostaCalculoRotaDto.PostoDto> PostosProximos)
{
    public record PostoDto : Posto
    {
        [SetsRequiredMembers]
        public PostoDto(Posto @base) : base(@base)
        {
            
        }
        
        public double DistanciaDaOrigemEmKm { get; set; }
        
        public double DistanciaDaRotaEmKm { get; set; }
        
        public double DistanciaDoDestinoEmKm { get; set; }

        public List<TipoCombustivelDto> CombustiveisDto => Combustiveis
            .Select(c => new TipoCombustivelDto(c))
            .ToList();
    }
    
    public override string ToString()
    {
        return $"{{ Rota = {Rota}, PostosProximos = {PostosProximos} }}";
    }
}