from django.urls import path

from forms import admin_views
from forms.admin_views import InvestigationListView, FormResponseListView, FormResponseDetailView, CommentAddView
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('investigations/<int:investigation_id>/forms/<int:form_instance_id>', views.form, name="form"),
    path('investigations/<int:investigation_id>/forms/<int:form_instance_id>/responses', views.form_response, name="form_response"),
    path('responses/<token>', views.form_data, name="form_data"),
    path('admin/investigations', InvestigationListView.as_view()),
    path('admin/investigations/<int:investigation_id>/responses', FormResponseListView.as_view(), name="investigation_responses"),
    path('admin/investigations/<int:investigation_id>/responses/<int:response_id>', FormResponseDetailView.as_view(), name="response_details"),
    path('admin/investigations/<int:investigation_id>/responses/<int:response_id>/comments', CommentAddView.as_view(), name="response_details_comments")
]
