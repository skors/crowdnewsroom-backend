import datetime

from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.shortcuts import render
from django.template.defaultfilters import register
from guardian.decorators import permission_required
from guardian.shortcuts import get_objects_for_user

from forms.forms import CommentForm
from forms.models import FormResponse, Comment, Investigation


@login_required(login_url="/admin/login")
@register.filter
def get_item(dictionary, key, alternative):
    return dictionary.get(key, alternative)


@login_required(login_url="/admin/login")
def signatures(request):
    return render(request, "signatures.html", {"signatures": FormResponse.get_signatures()})


@login_required(login_url="/admin/login")
def list_investigations(request):
    investigations = get_objects_for_user(request.user, 'view_investigation', Investigation)
    return render(request, "investigations.html", {"investigations": investigations})


@login_required(login_url="/admin/login")
@permission_required('forms.view_investigation', (Investigation, 'id', 'investigation_id'), return_403=True)
def list_responses(request, investigation_id):
    investigation = Investigation.objects.get(id=investigation_id)
    responses = []
    for form in investigation.form_set.all():
        for form_instance in form.forminstance_set.all():
            for response in form_instance.formresponse_set.all():
                responses.append(response)
    return render(request, "responses.html", {"responses": responses, "investigation_id": investigation_id})


@login_required(login_url="/admin/login")
@permission_required('forms.view_investigation', (Investigation, 'id', 'investigation_id'), return_403=True)
def edit_response(request, investigation_id, form_response_id):
    response = FormResponse.objects.select_related('form_instance__form__investigation').get(id=form_response_id)
    if response.form_instance.form.investigation_id != investigation_id:
        return HttpResponseForbidden("This is not the right Investigation for this ID")

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
