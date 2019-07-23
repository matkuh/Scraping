$("#scrape").on("click", function () {
    $.ajax({
        method: "GET",
        url: "/scrape",
    }).done(function (data) {
        console.log(data)
        window.location = "/"
    })
})

$(".save").on("click", function () {
    var articlesId = $(this).attr("data-id");
    $.ajax({
        method: "Post",
        url: "/articles/save/" + articlesId
    }).done(function (data) {
        window.location = "/"
    })
})

$(".delete").on("click", function () {
    var articlesId = $(this).attr("data-id");
    $.ajax({
        method: "Post",
        url: "/articles/delete/" + articlesId
    }).done(function (data) {
        window.location = "/saved"
    })
})

$(".saveNote").on("click", function () {
    var articlesId = $(this).attr("data-id");
    if (!$("#noteBody" + articlesId).val()) {
        alert("please enter a note to save")
        $.ajax({
            method: "POST",
            url: "/notes/save/" + articlesId,
            data: {
                text: $("#noteBody" + articlesId).val()
            }
        }).done(function (data) {
            $("#noteBody" + articlesId).val("")
            $(".modalNote").modal("close");
            window.location = "/saved"
        })
    }
})

$(".deleteNote").on("click", function () {
    var noteId = $(this).attr("data-note-id")
    var articleId = $(this).attr("data-article-id")
    $.ajax({
        method: "DELETE",
        url: "/notes/delete/" + noteId + "/" + articleId
    }).done(function (data) {
        $(".modalNote").modal("hide")
        window.location = "/saved"
    })
})

$(".addNote").on("click", function () {
    $('.modal').modal();

    $('.trigger-modal').modal()
})