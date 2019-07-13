var terms = ["Kamal", "a developer", "a photographer"]; //array of terms to rotate

function rotateTerm() {
    var ct = $("#identity").data("term") || 0;
    $("#identity").data("term", ct == terms.length - 1 ? 0 : ct + 1).text(terms[ct]).fadeIn().delay(2000).fadeOut(200, rotateTerm);
}

$(rotateTerm);