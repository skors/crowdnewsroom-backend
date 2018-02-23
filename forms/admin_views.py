from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse
from guardian.mixins import PermissionRequiredMixin
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.views.generic import ListView, DetailView, CreateView
from guardian.shortcuts import get_objects_for_user

from forms.forms import CommentForm
from forms.models import FormResponse, Investigation, Comment


class InvestigationListView(ListView, LoginRequiredMixin):
    def get_queryset(self):
        return get_objects_for_user(self.request.user, 'view_investigation', Investigation)


class FormResponseListView(PermissionRequiredMixin, LoginRequiredMixin, ListView):
    permission_required = 'forms.view_investigation'
    return_403 = True

    def get_permission_object(self):
        return Investigation.objects.get(id=self.kwargs.get("investigation_id"))

    def get_queryset(self):
        return FormResponse.get_all_for_investigation(self.kwargs.get("investigation_id"))

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        investigation = get_object_or_404(Investigation, id=self.kwargs.get("investigation_id"))
        context['investigation'] = investigation
        return context


class FormResponseDetailView(PermissionRequiredMixin, LoginRequiredMixin, DetailView):
    permission_required = 'forms.view_investigation'
    return_403 = True
    model = FormResponse
    pk_url_kwarg = "response_id"

    def get_permission_object(self):
        return Investigation.objects.get(id=self.kwargs.get("investigation_id"))

    def dispatch(self, request, *args, **kwargs):
        form_response_id = self.kwargs[self.pk_url_kwarg]
        investigation_id = self.kwargs["investigation_id"]
        if not FormResponse.belongs_to_investigation(form_response_id, investigation_id):
            raise Http404()
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = CommentForm()
        return context


class CommentAddView(PermissionRequiredMixin, LoginRequiredMixin, CreateView):
    permission_required = 'forms.view_investigation'
    return_403 = True
    model = Comment
    form_class = CommentForm

    def get_success_url(self):
        return reverse("response_details", kwargs=self.kwargs)

    def get_permission_object(self):
        return Investigation.objects.get(id=self.kwargs.get("investigation_id"))

    def form_valid(self, form):
        response = FormResponse.objects.get(id=self.kwargs.get("response_id"))
        form.save_with_extra_props(form_response=response, author=self.request.user)
        return super().form_valid(form)