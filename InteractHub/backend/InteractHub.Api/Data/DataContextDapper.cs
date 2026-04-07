using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;

namespace InteractHub.Api.Data;

public class DataContextDapper
{
    private readonly string _connectionString;

    public DataContextDapper(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")
          ?? throw new InvalidOperationException("Conenction string not found");
    }

    // Sử dụng QueryAsync để lấy nhiều bản ghi từ cơ sở dữ liệu
    public async Task<IEnumerable<T>> LoadData<T>(string sqlCommand, object? parameters = null)
    {
        using IDbConnection dbConnection = new SqlConnection(_connectionString);
        return await dbConnection.QueryAsync<T>(sqlCommand, parameters);
    }

    // Sử dụng QuerySingleOrDefaultAsync để lấy một bản ghi duy nhất hoặc trả về null nếu không tìm thấy
    public async Task<T?> LoadDataSingleOrDefaultAsync<T>(string sqlcommand, object? parameters = null)
    {
        using IDbConnection dbConnection = new SqlConnection(_connectionString);
        return await dbConnection.QuerySingleOrDefaultAsync<T>(sqlcommand, parameters);
    }

    // Sử dụng ExecuteAsync để thực thi các câu lệnh SQL không trả về dữ liệu (INSERT, UPDATE, DELETE)
    public async Task<bool> ExecuteSqlAsync (string sqlCommand, object? parameters = null)
    {
        using IDbConnection dbConnection = new SqlConnection(_connectionString);
        return await dbConnection.ExecuteAsync(sqlCommand, parameters) > 0;
    }
}
