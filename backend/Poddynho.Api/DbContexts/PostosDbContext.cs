using Microsoft.EntityFrameworkCore;
using Poddynho.Domain.Modelos;

namespace Poddynho.DbContexts;

public class PostosDbContext(DbContextOptions<PostosDbContext> options) : DbContext(options)
{
    public DbSet<Posto> Postos => Set<Posto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Posto>(e =>
        {
            e.OwnsOne(x => x.Localizacao);
        });
    }
}