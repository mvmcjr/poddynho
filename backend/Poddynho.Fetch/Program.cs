using CliFx;
using Poddynho.Fetch;

return await new CliApplicationBuilder()
    .AddCommand<FetchCommand>()
    .Build()
    .RunAsync(args);
