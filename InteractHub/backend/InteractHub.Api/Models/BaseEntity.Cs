public abstract class BaseEntity
{
    public int ID {get; set;}
    public DateTime CreatedAt {get; set;} = DateTime.UtcNow;
}