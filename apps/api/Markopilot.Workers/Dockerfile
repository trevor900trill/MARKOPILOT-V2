# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore as distinct layers
COPY ["Markopilot.Workers/Markopilot.Workers.csproj", "Markopilot.Workers/"]
COPY ["Markopilot.Core/Markopilot.Core.csproj", "Markopilot.Core/"]
COPY ["Markopilot.Infrastructure/Markopilot.Infrastructure.csproj", "Markopilot.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "Markopilot.Workers/Markopilot.Workers.csproj"

# Copy remaining source code
COPY . .

# Build and publish
WORKDIR "/src/Markopilot.Workers"
RUN dotnet publish "Markopilot.Workers.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/runtime:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Markopilot.Workers.dll"]
