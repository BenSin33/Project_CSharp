public class HashTag : BaseEntity
{
    public string Name {get;set;}
    public virtual ICollection<Post> Posts {get;set;}
}