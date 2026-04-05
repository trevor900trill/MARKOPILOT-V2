using System.Security.Cryptography;
using System.Text;
using Markopilot.Core.Interfaces;

namespace Markopilot.Core.Services;

/// <summary>
/// AES-256-CBC encryption for social/Gmail tokens before storage.
/// Keys are sourced from environment variables: Encryption__AesKey, Encryption__AesIv.
/// </summary>
public class TokenEncryptionService : ITokenEncryptionService
{
    private readonly byte[] _key;
    private readonly byte[] _iv;

    public TokenEncryptionService(string aesKeyBase64, string aesIvBase64)
    {
        _key = Convert.FromBase64String(aesKeyBase64);
        _iv = Convert.FromBase64String(aesIvBase64);

        if (_key.Length != 32) // 256 bits
            throw new ArgumentException("AES key must be 256-bit (32 bytes).");
        if (_iv.Length != 16) // 128 bits
            throw new ArgumentException("AES IV must be 128-bit (16 bytes).");
    }

    public string Encrypt(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext))
            return string.Empty;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var encryptor = aes.CreateEncryptor();
        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var cipherBytes = encryptor.TransformFinalBlock(plaintextBytes, 0, plaintextBytes.Length);

        return Convert.ToBase64String(cipherBytes);
    }

    public string Decrypt(string ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext))
            return string.Empty;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        var cipherBytes = Convert.FromBase64String(ciphertext);
        var plaintextBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);

        return Encoding.UTF8.GetString(plaintextBytes);
    }

    /// <summary>
    /// Generates a new random AES-256 key and IV for initial setup.
    /// </summary>
    public static (string KeyBase64, string IvBase64) GenerateKeyPair()
    {
        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.GenerateKey();
        aes.GenerateIV();
        return (Convert.ToBase64String(aes.Key), Convert.ToBase64String(aes.IV));
    }
}
