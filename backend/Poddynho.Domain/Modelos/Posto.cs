using System.ComponentModel.DataAnnotations;

namespace Poddynho.Domain.Modelos;

public enum TipoCombustivel
{
    Gasolina,
    Etanol,
    [Display(Name = "Gasolina Aditivada")]
    GasolinaAditivada,
    [Display(Name = "Etanol Aditivado")]
    EtanolAditivado,
    [Display(Name = "Gasolina Premium")]
    GasolinaPremium
}

public record Posto
{
    public required string Id { get; init; }
    
    public required string Nome { get; init; }
    
    public required string Bandeira { get; init; }
    
    public required string Cidade { get; init; }
    
    public required string Estado { get; init; }
    
    public required PontoGeografico Localizacao { get; init; }

    public ICollection<TipoCombustivel> Combustiveis { get; init; } = [];
}