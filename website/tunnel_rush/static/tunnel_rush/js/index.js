var terms = ["Kamal", "a developer", "a photographer"]; //array of terms to rotate

function rotateTerm() {
    var ct = $("#identity").data("term") || 0;
    $("#identity").data("term", ct == terms.length - 1 ? 0 : ct + 1).text(terms[ct]).fadeIn().delay(2000).fadeOut(200, rotateTerm);
}

$(rotateTerm);

$("#down_arrow_id").on('click', function (event) {
    if (this.hash !== "") {
        event.preventDefault();
        var hash = this.hash;
        $('html, body').animate({
            scrollTop: 0.95*$(hash).offset().top
        }, 800);
        // , function () {
        //     window.location.hash = hash;
        // });
        window.location.hash = hash;
    }
});


function blink(selector) {
    $(selector).fadeOut(2000, function () {
        $(this).fadeIn(2000, function () {
            blink(this);
        });
    });
}

blink('#down_arrow_id');