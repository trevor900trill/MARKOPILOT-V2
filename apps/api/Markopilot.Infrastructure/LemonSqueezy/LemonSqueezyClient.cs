using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace Markopilot.Infrastructure.LemonSqueezy;

public class LemonSqueezyClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _storeId;

    public LemonSqueezyClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["LemonSqueezy:ApiKey"] ?? throw new ArgumentNullException("LemonSqueezy:ApiKey is missing");
        _storeId = configuration["LemonSqueezy:StoreId"] ?? throw new ArgumentNullException("LemonSqueezy:StoreId is missing");
        
        _httpClient.BaseAddress = new Uri("https://api.lemonsqueezy.com/v1/");
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<string> CreateCheckoutAsync(string variantId, string userEmail, string userId)
    {
        var payload = new
        {
            data = new
            {
                type = "checkouts",
                attributes = new
                {
                    checkout_data = new
                    {
                        email = userEmail,
                        custom = new { user_id = userId }
                    }
                },
                relationships = new
                {
                    store = new { data = new { type = "stores", id = _storeId } },
                    variant = new { data = new { type = "variants", id = variantId } }
                }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("checkouts", content);
        
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            throw new Exception($"LemonSqueezy API Error: {err}");
        }

        var resObj = await response.Content.ReadFromJsonAsync<JsonElement>();
        return resObj.GetProperty("data").GetProperty("attributes").GetProperty("url").GetString()!;
    }

    public async Task<string> GetCustomerPortalUrlAsync(string customerId)
    {
        var response = await _httpClient.GetAsync($"customers/{customerId}");

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            throw new Exception($"LemonSqueezy API Error: {err}");
        }

        var resObj = await response.Content.ReadFromJsonAsync<JsonElement>();
        return resObj.GetProperty("data").GetProperty("attributes").GetProperty("urls").GetProperty("customer_portal").GetString()!;
    }
}
