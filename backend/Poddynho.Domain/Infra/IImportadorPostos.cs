using Poddynho.Domain.Modelos;

namespace Poddynho.Domain.Infra;

public interface IImportadorPostos
{
    ValueTask<IReadOnlyCollection<Posto>> ImportarPostosAsync(CancellationToken cancellationToken = default);
}