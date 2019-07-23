$("#scrape").on(click, function(){
    $.ajax({
        method: "GET",
        url: "/scrape",
    }).done(function(data){
        console.log(data)
        window.location = "/"
    })
})

$(".save").on("click", function(){
    var articleId = $(this).attr("data-id");
    $.ajax({
        method: "Post",
        url: "/articles/save/" + articleId
    }).done(function(data){
        window.location = "/"
    })
})

$(".delete").on("click", function(){
    var articleId = $(this).attr("data-id");
    $.ajax({
        method: "Post",
        url: "/articles/delete/" + articleId
    }).done(function(data){
        window.location = "/saved"
    })
})

$(".saveNote").on("click", function(){
    var articleId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/notes/save/" + articleId,
        data: {
            text: $("#noteBody" + articleId).val()
        }
    }).done(function(data){
        $("noteBody" + articleId).val("")
        $(".noteModal").modal("hide");
        window.location = "/saved"
    })
})

$(".deleteNote").on("click", function(){
    var noteId = $(this).attr("data-note-id")
    var articleId = $(this).attr("data-article-id")
    $.ajax({
        method: "DELETE",
        url: "/notes/delete/" + noteId + "/" + articleId
    }).done(function(data){
        $(".modalNote").modal("hide")
        window.location = "/saved"
    })
})