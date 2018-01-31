import datetime

from django.shortcuts import render
from django.template.defaultfilters import register

from forms.forms import CommentForm
from forms.models import FormResponse, Comment


@register.filter
def get_item(dictionary, key, alternative):
    return dictionary.get(key, alternative)


def signatures(request):
    return render(request, "signatures.html", {"signatures": FormResponse.get_signatures()})


def edit_response(request, form_response_id):
    response = FormResponse.objects.get(id=form_response_id)
    if request.method == "POST":
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = Comment()
            comment.author = request.user
            comment.text = form.cleaned_data.get("comment")
            comment.date = datetime.datetime.now()
            comment.form_response_id = response.id
            comment.save()
    form = CommentForm()
    return render(request, "edit_form.html", {"response": response,
                                              "form": form})