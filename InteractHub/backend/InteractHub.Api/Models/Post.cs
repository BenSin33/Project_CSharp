using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;

public class Post : BaseEntity
{
    public string Content {get;set;}
    public string? MediaLocation {get;set;} // save the media file in the server and store the location in this field
    public string UserId {get;set;}
    public virtual User user {get;set;}
    public virtual ICollection<Comment> Comments{get;set;} // N-N relationship with Comment
    public virtual ICollection<Like> Likes {get;set;}
    public virtual ICollection<HashTag> HashTags {get;set;} // N-N relationship with HashTag
    public virtual ICollection<Share> Shares {get;set;}
 
}