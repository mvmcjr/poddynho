namespace Poddynho.Domain.Modelos;

public enum Combustivel
{
    Gasolina,
    Etanol,
    Aditivada,
    Premium
}

public record Posto
{
    public required string Id { get; init; }
    
    public required string Nome { get; init; }
    
    public required string Bandeira { get; init; }
    
    public required PontoGeografico Localizacao { get; init; }

    public ICollection<Combustivel> Combustiveis { get; init; } = [];
}